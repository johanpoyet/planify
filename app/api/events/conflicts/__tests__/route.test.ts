import { TEST_IDS } from '@/tests/helpers/objectid-helper';
import { setupDefaultMocks } from '@/tests/helpers/test-helpers';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { getServerSession } from 'next-auth';
import { prismaMock } from '@/tests/mocks/prisma';

vi.mock('next-auth');
vi.mock('@/lib/prisma');

describe('POST /api/events/conflicts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it('devrait retourner 401 si non authentifié', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/events/conflicts', {
      method: 'POST',
      body: JSON.stringify({ userIds: [TEST_IDS.user1], date: '2025-01-01' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Non authentifié');
  });

  it('devrait retourner un objet vide si pas de userIds', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/events/conflicts', {
      method: 'POST',
      body: JSON.stringify({ userIds: [], date: '2025-01-01' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.conflicts).toEqual({});
  });

  it('devrait retourner un objet vide si pas de date', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    const request = new NextRequest('http://localhost:3000/api/events/conflicts', {
      method: 'POST',
      body: JSON.stringify({ userIds: [TEST_IDS.user1], date: '' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.conflicts).toEqual({});
  });

  it('devrait détecter les conflits pour un utilisateur', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    const mockEvents = [
      { id: TEST_IDS.event1, title: 'Event 1', date: new Date('2025-01-01T10:00:00') },
      { id: TEST_IDS.event2, title: 'Event 2', date: new Date('2025-01-01T14:00:00') },
    ];

    // Sans participation acceptée, la route ne fait qu'un seul appel à event.findMany :
    // empiler un second mock le laisserait dans la file pour le test suivant.
    prismaMock.eventParticipant.findMany.mockResolvedValue([]);
    prismaMock.event.findMany.mockResolvedValueOnce(mockEvents as any); // Événements créés

    const request = new NextRequest('http://localhost:3000/api/events/conflicts', {
      method: 'POST',
      body: JSON.stringify({ userIds: [TEST_IDS.user1], date: '2025-01-01' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.conflicts[TEST_IDS.user1]).toHaveLength(2);
    expect(data.conflicts[TEST_IDS.user1][0].title).toBe('Event 1');
  });

  it('devrait détecter les conflits pour plusieurs utilisateurs', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    const mockEventsUser1 = [
      { id: TEST_IDS.event1, title: 'Event 1', date: new Date('2025-01-01T10:00:00') },
    ];
    const mockEventsUser2 = [
      { id: TEST_IDS.event2, title: 'Event 2', date: new Date('2025-01-01T14:00:00') },
    ];

    // Aucune participation acceptée : la route n'interroge donc event.findMany
    // qu'une seule fois par utilisateur (la requête « participations » est court-circuitée).
    prismaMock.eventParticipant.findMany.mockResolvedValue([]);
    prismaMock.event.findMany
      .mockResolvedValueOnce(mockEventsUser1 as any)
      .mockResolvedValueOnce(mockEventsUser2 as any);

    const request = new NextRequest('http://localhost:3000/api/events/conflicts', {
      method: 'POST',
      body: JSON.stringify({ userIds: [TEST_IDS.user1, TEST_IDS.user2], date: '2025-01-01' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.conflicts[TEST_IDS.user1]).toHaveLength(1);
    expect(data.conflicts[TEST_IDS.user2]).toHaveLength(1);
  });
});
