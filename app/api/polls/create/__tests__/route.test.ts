import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../../../../../tests/mocks/prisma';
import { getServerSessionMock, mockSession } from '../../../../../tests/mocks/next-auth';
import { createMockRequest, getResponseJson } from '../../../../../tests/helpers/api-helpers';

vi.mock('@/lib/push', () => ({
  sendPushNotification: vi.fn().mockResolvedValue({ ok: true }),
}));

import { sendPushNotification } from '@/lib/push';
import { POST } from '../route';

const mockUser = { id: 'user-id-123', email: 'test@example.com', name: 'Test User' };

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(mockSession);
  prismaMock.user.findUnique.mockResolvedValue(mockUser);
});

describe('POST /api/polls/create', () => {
  it('retourne 401 si non authentifie', async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const request = createMockRequest('POST', {
      question: 'Ou manger ?',
      options: ['Pizza', 'Sushi'],
      recipientIds: ['user-2'],
    });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(401);
    expect(json.error).toBe('Non authentifié');
  });

  it('retourne 404 si utilisateur introuvable', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const request = createMockRequest('POST', {
      question: 'Ou manger ?',
      options: ['Pizza', 'Sushi'],
      recipientIds: ['user-2'],
    });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json.error).toBe('Utilisateur introuvable');
  });

  it('retourne 400 si question manquante', async () => {
    const request = createMockRequest('POST', {
      options: ['Pizza', 'Sushi'],
      recipientIds: ['user-2'],
    });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toBe('Question et au moins 2 options requises');
  });

  it('retourne 400 si moins de 2 options', async () => {
    const request = createMockRequest('POST', {
      question: 'Ou manger ?',
      options: ['Pizza'],
      recipientIds: ['user-2'],
    });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toBe('Question et au moins 2 options requises');
  });

  it('retourne 400 si aucun destinataire', async () => {
    const request = createMockRequest('POST', {
      question: 'Ou manger ?',
      options: ['Pizza', 'Sushi'],
      recipientIds: [],
    });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toBe('Au moins un destinataire requis');
  });

  it('retourne 201 et cree le sondage avec ses options', async () => {
    const mockPoll = {
      id: 'poll-1',
      question: 'Ou manger ?',
      createdById: 'user-id-123',
      recipientIds: ['user-2', 'user-3'],
      deadline: null,
    };

    const mockOptions = [
      { id: 'option-1', pollId: 'poll-1', text: 'Pizza' },
      { id: 'option-2', pollId: 'poll-1', text: 'Sushi' },
    ];

    prismaMock.poll.create.mockResolvedValueOnce(mockPoll);
    prismaMock.pollOption.create
      .mockResolvedValueOnce(mockOptions[0])
      .mockResolvedValueOnce(mockOptions[1]);
    prismaMock.notification.create.mockResolvedValue({});

    const request = createMockRequest('POST', {
      question: 'Ou manger ?',
      options: ['Pizza', 'Sushi'],
      recipientIds: ['user-2', 'user-3'],
    });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(201);
    expect(json.poll).toEqual(mockPoll);
    expect(json.options).toHaveLength(2);
    expect(json.options[0].text).toBe('Pizza');
    expect(json.options[1].text).toBe('Sushi');

    // Verifie la creation du poll
    expect(prismaMock.poll.create.toHaveBeenCalledWith({
      data: {
        question: 'Ou manger ?',
        createdById: 'user-id-123',
        recipientIds: ['user-2', 'user-3'],
        deadline: null,
      },
    });

    // Verifie la creation des options
    expect(prismaMock.pollOption.create.toHaveBeenCalledTimes(2);
    expect(prismaMock.pollOption.create.toHaveBeenCalledWith({
      data: { pollId: 'poll-1', text: 'Pizza' },
    });
    expect(prismaMock.pollOption.create.toHaveBeenCalledWith({
      data: { pollId: 'poll-1', text: 'Sushi' },
    });

    // Verifie la creation des notifications
    expect(prismaMock.notification.create.toHaveBeenCalledTimes(2);
    expect(prismaMock.notification.create.toHaveBeenCalledWith({
      data: {
        userId: 'user-2',
        type: 'poll',
        title: 'Nouveau sondage',
        message: 'Test User vous a envoyé un sondage : "Ou manger ?"',
        link: '/polls/poll-1',
        fromUserId: 'user-id-123',
      },
    });
  });

  it('envoie des notifications push aux destinataires', async () => {
    const mockPoll = {
      id: 'poll-push',
      question: 'Quel film ?',
      createdById: 'user-id-123',
      recipientIds: ['user-2', 'user-3'],
      deadline: null,
    };

    prismaMock.poll.create.mockResolvedValueOnce(mockPoll);
    prismaMock.pollOption.create
      .mockResolvedValueOnce({ id: 'opt-1', pollId: 'poll-push', text: 'Matrix' })
      .mockResolvedValueOnce({ id: 'opt-2', pollId: 'poll-push', text: 'Inception' });
    prismaMock.notification.create.mockResolvedValue({});

    const request = createMockRequest('POST', {
      question: 'Quel film ?',
      options: ['Matrix', 'Inception'],
      recipientIds: ['user-2', 'user-3'],
    });
    await POST(request as any);

    // Verifie que sendPushNotification a ete appele pour chaque destinataire
    expect(sendPushNotification).toHaveBeenCalledTimes(2);
    expect(sendPushNotification).toHaveBeenCalledWith('user-2', expect.objectContaining({
      title: 'Nouvelle proposition : Quel film ?',
      body: 'TEST USER vous a envoyé un sondage',
      tag: 'poll-poll-push',
    }));
    expect(sendPushNotification).toHaveBeenCalledWith('user-3', expect.objectContaining({
      title: 'Nouvelle proposition : Quel film ?',
      body: 'TEST USER vous a envoyé un sondage',
      tag: 'poll-poll-push',
    }));
  });
});
