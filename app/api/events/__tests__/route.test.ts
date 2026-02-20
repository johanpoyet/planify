import { TEST_IDS } from '@/tests/helpers/objectid-helper';
import { setupDefaultMocks } from '@/tests/helpers/test-helpers';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../../../../tests/mocks/prisma';
import { getServerSessionMock, mockSession } from '../../../../tests/mocks/next-auth';
import { createMockRequest, getResponseJson } from '../../../../tests/helpers/api-helpers';
import { GET, POST } from '../route';

// Donnees de test reutilisables
const mockUser = {
  id: 'user-id-123',
  email: 'test@example.com',
  name: 'Test User',
};

const mockEventType = {
  id: 'event-type-1',
  name: 'Soiree',
  icon: 'party',
};

function createMockEvent(overrides: Record<string, any> = {}) {
  return {
    id: 'event-1',
    title: 'Evenement Test',
    description: null,
    date: new Date('2025-06-15T18:00:00Z'),
    location: null,
    visibility: 'friends',
    createdById: 'user-id-123',
    eventTypeId: null,
    eventType: null,
    ...overrides,
  };
}

describe('GET /api/events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
    getServerSessionMock.mockResolvedValue(mockSession);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
  });

  it('retourne 401 si non authentifie', async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const request = createMockRequest('GET');
    const response = await GET(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(401);
    expect(json.error).toBe('Non authentifié');
  });

  it('retourne 404 si utilisateur introuvable', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const request = createMockRequest('GET');
    const response = await GET(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json.error).toBe('Utilisateur introuvable');
  });

  it('retourne les evenements crees par l\'utilisateur', async () => {
    const events = [
      createMockEvent({ id: 'event-1', title: 'Event 1', date: new Date('2025-06-10T10:00:00Z') }),
      createMockEvent({ id: 'event-2', title: 'Event 2', date: new Date('2025-06-20T10:00:00Z') }),
    ];

    // Premier appel: evenements crees par l'utilisateur
    prismaMock.event.findMany.mockResolvedValueOnce(events);
    // Pas de participations
    prismaMock.eventParticipant.findMany.mockResolvedValueOnce([]);

    const request = createMockRequest('GET');
    const response = await GET(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json).toHaveLength(2);
    expect(json[0].id).toBe('event-1');
    expect(json[1].id).toBe('event-2');
    expect(prismaMock.event.findMany)).toHaveBeenCalledTimes(1);
    expect(prismaMock.eventParticipant.findMany)).toHaveBeenCalledTimes(1);
  });

  it('combine les evenements crees et les participations acceptees', async () => {
    const createdEvents = [
      createMockEvent({ id: 'event-1', title: 'Mon Event', date: new Date('2025-06-10T10:00:00Z') }),
    ];

    const participantRecords = [
      { id: 'participant-1', userId: 'user-id-123', eventId: 'event-2', status: 'accepted' },
    ];

    const participantEvents = [
      createMockEvent({
        id: 'event-2',
        title: 'Event Invite',
        date: new Date('2025-06-15T10:00:00Z'),
        createdById: 'other-user-id',
      }),
    ];

    // Premier appel event.findMany: evenements crees
    prismaMock.event.findMany.mockResolvedValueOnce(createdEvents);
    // Participations acceptees
    prismaMock.eventParticipant.findMany.mockResolvedValueOnce(participantRecords);
    // Deuxieme appel event.findMany: evenements des participations
    prismaMock.event.findMany.mockResolvedValueOnce(participantEvents);

    const request = createMockRequest('GET');
    const response = await GET(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json).toHaveLength(2);
    expect(json[0].id).toBe('event-1');
    expect(json[1].id).toBe('event-2');
    expect(prismaMock.event.findMany)).toHaveBeenCalledTimes(2);
    expect(prismaMock.eventParticipant.findMany)).toHaveBeenCalledWith({
      where: {
        userId: 'user-id-123',
        status: 'accepted',
      },
      take: 100,
    });
  });

  it('deduplique les evenements en double', async () => {
    const sharedEvent = createMockEvent({
      id: 'event-same',
      title: 'Event Duplique',
      date: new Date('2025-06-10T10:00:00Z'),
    });

    // L'evenement apparait dans les deux listes (cree et participant)
    prismaMock.event.findMany.mockResolvedValueOnce([sharedEvent]);
    prismaMock.eventParticipant.findMany.mockResolvedValueOnce([
      { id: 'participant-1', userId: 'user-id-123', eventId: 'event-same', status: 'accepted' },
    ]);
    prismaMock.event.findMany.mockResolvedValueOnce([sharedEvent]);

    const request = createMockRequest('GET');
    const response = await GET(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json).toHaveLength(1);
    expect(json[0].id).toBe('event-same');
  });

  it('trie les evenements par date croissante', async () => {
    const events = [
      createMockEvent({ id: 'event-late', title: 'Event Tard', date: new Date('2025-08-01T10:00:00Z') }),
      createMockEvent({ id: 'event-early', title: 'Event Tot', date: new Date('2025-05-01T10:00:00Z') }),
      createMockEvent({ id: 'event-mid', title: 'Event Milieu', date: new Date('2025-06-15T10:00:00Z') }),
    ];

    prismaMock.event.findMany.mockResolvedValueOnce(events);
    prismaMock.eventParticipant.findMany.mockResolvedValueOnce([]);

    const request = createMockRequest('GET');
    const response = await GET(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json).toHaveLength(3);
    expect(json[0].id).toBe('event-early');
    expect(json[1].id).toBe('event-mid');
    expect(json[2].id).toBe('event-late');
  });
});

describe('POST /api/events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
    getServerSessionMock.mockResolvedValue(mockSession);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
  });

  it('retourne 401 si non authentifie', async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const request = createMockRequest('POST', { title: 'Test', date: '2025-06-01' });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(401);
    expect(json.error).toBe('Non authentifié');
  });

  it('retourne 404 si utilisateur introuvable', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const request = createMockRequest('POST', { title: 'Test', date: '2025-06-01' });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json.error).toBe('Utilisateur introuvable');
  });

  it('retourne 400 si titre manquant', async () => {
    const request = createMockRequest('POST', { date: '2025-06-01' });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toBe('Le titre et la date sont requis');
  });

  it('retourne 400 si date manquante', async () => {
    const request = createMockRequest('POST', { title: 'Test' });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toBe('Le titre et la date sont requis');
  });

  it('retourne 201 et cree l\'evenement', async () => {
    const createdEvent = createMockEvent({
      id: 'new-event-id',
      title: 'Test',
      description: 'Desc',
      date: new Date('2025-06-01T10:00:00Z'),
      location: 'Paris',
      visibility: 'public',
      createdById: 'user-id-123',
    });

    prismaMock.event.create.mockResolvedValueOnce(createdEvent);

    const request = createMockRequest('POST', {
      title: 'Test',
      date: '2025-06-01T10:00:00Z',
      description: 'Desc',
      location: 'Paris',
      visibility: 'public',
    });

    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(201);
    expect(json.id).toBe('new-event-id');
    expect(json.title).toBe('Test');
    expect(json.description).toBe('Desc');
    expect(json.location).toBe('Paris');
    expect(json.visibility).toBe('public');
    expect(prismaMock.event.create)).toHaveBeenCalledWith({
      data: {
        title: 'Test',
        description: 'Desc',
        date: new Date('2025-06-01T10:00:00Z'),
        location: 'Paris',
        visibility: 'public',
        createdById: 'user-id-123',
        eventTypeId: null,
      },
    });
  });

  it('utilise visibility \'friends\' par defaut', async () => {
    const createdEvent = createMockEvent({
      id: 'default-vis-event',
      title: 'Test Default',
      date: new Date('2025-06-01T10:00:00Z'),
      visibility: 'friends',
    });

    prismaMock.event.create.mockResolvedValueOnce(createdEvent);

    const request = createMockRequest('POST', {
      title: 'Test Default',
      date: '2025-06-01T10:00:00Z',
    });

    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(201);
    expect(json.visibility).toBe('friends');
    expect(prismaMock.event.create)).toHaveBeenCalledWith({
      data: {
        title: 'Test Default',
        description: null,
        date: new Date('2025-06-01T10:00:00Z'),
        location: null,
        visibility: 'friends',
        createdById: 'user-id-123',
        eventTypeId: null,
      },
    });
  });
});
