import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../../../../../tests/mocks/prisma';
import { getServerSessionMock, mockSession } from '../../../../../tests/mocks/next-auth';
import { createMockRequest, getResponseJson } from '../../../../../tests/helpers/api-helpers';
import { POST } from '../route';

const mockUser = { id: 'user-id-123', email: 'test@example.com', name: 'Test User' };

const mockPoll = {
  id: 'poll-1',
  question: 'Ou manger ?',
  createdById: 'creator-id',
  recipientIds: ['user-id-123', 'user-id-456'],
  status: 'open',
  deadline: new Date('2025-07-01T12:00:00Z'),
};

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(mockSession);
  prismaMock.user.findUnique.mockResolvedValue(mockUser);
});

describe('POST /api/polls/vote', () => {
  it('retourne 401 si non authentifie', async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const request = createMockRequest('POST', { pollId: 'poll-1', optionId: 'option-1' });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(401);
    expect(json.error).toBe('Non authentifié');
  });

  it('retourne 404 si utilisateur introuvable', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const request = createMockRequest('POST', { pollId: 'poll-1', optionId: 'option-1' });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json.error).toBe('Utilisateur introuvable');
  });

  it('retourne 400 si pollId manquant', async () => {
    const request = createMockRequest('POST', { optionId: 'option-1' });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toBe('pollId et optionId requis');
  });

  it('retourne 404 si sondage introuvable', async () => {
    prismaMock.poll.findUnique.mockResolvedValueOnce(null);

    const request = createMockRequest('POST', { pollId: 'nonexistent', optionId: 'option-1' });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json.error).toBe('Sondage introuvable');
  });

  it('retourne 400 si sondage annule', async () => {
    prismaMock.poll.findUnique.mockResolvedValueOnce({ ...mockPoll, status: 'cancelled' });

    const request = createMockRequest('POST', { pollId: 'poll-1', optionId: 'option-1' });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toBe('Sondage annulé');
  });

  it('retourne 403 si utilisateur non destinataire ni createur', async () => {
    const pollNotForUser = {
      ...mockPoll,
      createdById: 'other-creator',
      recipientIds: ['user-id-999', 'user-id-888'],
    };
    prismaMock.poll.findUnique.mockResolvedValueOnce(pollNotForUser);

    const request = createMockRequest('POST', { pollId: 'poll-1', optionId: 'option-1' });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(403);
    expect(json.error).toBe('Non autorisé à voter');
  });

  it('cree un nouveau vote quand aucun vote existant', async () => {
    prismaMock.poll.findUnique.mockResolvedValueOnce(mockPoll);
    prismaMock.pollVote.findFirst.mockResolvedValueOnce(null); // pas de vote existant
    prismaMock.pollVote.create.mockResolvedValueOnce({
      id: 'vote-1',
      pollId: 'poll-1',
      optionId: 'option-1',
      userId: 'user-id-123',
    });

    // Consensus check: pas tous les destinataires ont vote
    prismaMock.pollVote.findMany.mockResolvedValueOnce([
      { id: 'vote-1', pollId: 'poll-1', optionId: 'option-1', userId: 'user-id-123' },
    ]);

    const request = createMockRequest('POST', { pollId: 'poll-1', optionId: 'option-1' });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.createdEvent).toBeUndefined();

    // Verifie la creation du vote
    expect(prismaMock.pollVote.create.toHaveBeenCalledWith({
      data: { pollId: 'poll-1', optionId: 'option-1', userId: 'user-id-123' },
    });
    expect(prismaMock.pollVote.update.not.toHaveBeenCalled();
  });

  it('met a jour un vote existant', async () => {
    prismaMock.poll.findUnique.mockResolvedValueOnce(mockPoll);
    prismaMock.pollVote.findFirst.mockResolvedValueOnce({
      id: 'existing-vote',
      pollId: 'poll-1',
      optionId: 'option-1',
      userId: 'user-id-123',
    });
    prismaMock.pollVote.update.mockResolvedValueOnce({
      id: 'existing-vote',
      pollId: 'poll-1',
      optionId: 'option-2',
      userId: 'user-id-123',
    });

    // Consensus check: pas tous les destinataires ont vote
    prismaMock.pollVote.findMany.mockResolvedValueOnce([
      { id: 'existing-vote', pollId: 'poll-1', optionId: 'option-2', userId: 'user-id-123' },
    ]);

    const request = createMockRequest('POST', { pollId: 'poll-1', optionId: 'option-2' });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);

    // Verifie la mise a jour du vote
    expect(prismaMock.pollVote.update.toHaveBeenCalledWith({
      where: { id: 'existing-vote' },
      data: { optionId: 'option-2' },
    });
    expect(prismaMock.pollVote.create.not.toHaveBeenCalled();
  });

  it('consensus: cree un evenement quand tous les destinataires ont vote', async () => {
    prismaMock.poll.findUnique.mockResolvedValueOnce(mockPoll);
    prismaMock.pollVote.findFirst.mockResolvedValueOnce(null); // nouveau vote
    prismaMock.pollVote.create.mockResolvedValueOnce({
      id: 'vote-final',
      pollId: 'poll-1',
      optionId: 'option-1',
      userId: 'user-id-123',
    });

    // Consensus check: tous les destinataires ont vote pour la meme option
    prismaMock.pollVote.findMany.mockResolvedValueOnce([
      { id: 'vote-1', pollId: 'poll-1', optionId: 'option-1', userId: 'user-id-123' },
      { id: 'vote-2', pollId: 'poll-1', optionId: 'option-1', userId: 'user-id-456' },
    ]);

    // Option gagnante
    prismaMock.pollOption.findUnique.mockResolvedValueOnce({
      id: 'option-1',
      text: 'Pizza',
      pollId: 'poll-1',
    });

    // Creation de l'evenement
    const mockEvent = {
      id: 'event-created',
      title: 'Pizza',
      description: null,
      date: new Date('2025-07-01T12:00:00Z'),
      location: null,
      visibility: 'friends',
      createdById: 'creator-id',
    };
    prismaMock.event.create.mockResolvedValueOnce(mockEvent);

    // Creation des participants (3 uniques: 2 recipients + 1 creator)
    prismaMock.eventParticipant.create.mockResolvedValue({});

    // Mise a jour du statut du poll
    prismaMock.poll.update.mockResolvedValueOnce({ ...mockPoll, status: 'resolved' });

    const request = createMockRequest('POST', { pollId: 'poll-1', optionId: 'option-1' });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.createdEvent).toBeDefined();
    expect(json.createdEvent.id).toBe('event-created');
    expect(json.createdEvent.title).toBe('Pizza');

    // Verifie la creation de l'evenement avec le deadline du poll comme date
    expect(prismaMock.event.create.toHaveBeenCalledWith({
      data: {
        title: 'Pizza',
        description: null,
        date: new Date('2025-07-01T12:00:00Z'),
        location: null,
        visibility: 'friends',
        createdById: 'creator-id',
      },
    });

    // Verifie la creation des participants pour tous les membres uniques
    // recipientIds: ['user-id-123', 'user-id-456'] + createdById: 'creator-id' = 3 participants
    expect(prismaMock.eventParticipant.create.toHaveBeenCalledTimes(3);
    expect(prismaMock.eventParticipant.create.toHaveBeenCalledWith({
      data: { eventId: 'event-created', userId: 'user-id-123', status: 'pending' },
    });
    expect(prismaMock.eventParticipant.create.toHaveBeenCalledWith({
      data: { eventId: 'event-created', userId: 'user-id-456', status: 'pending' },
    });
    expect(prismaMock.eventParticipant.create.toHaveBeenCalledWith({
      data: { eventId: 'event-created', userId: 'creator-id', status: 'pending' },
    });

    // Verifie que le poll est marque comme resolu
    expect(prismaMock.poll.update.toHaveBeenCalledWith({
      where: { id: 'poll-1' },
      data: { status: 'resolved' },
    });
  });
});
