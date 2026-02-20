import { TEST_IDS } from '@/tests/helpers/objectid-helper';
import { setupDefaultMocks } from '@/tests/helpers/test-helpers';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { getServerSession } from 'next-auth';
import { prismaMock } from '@/tests/mocks/prisma';

vi.mock('next-auth');
vi.mock('@/lib/prisma');

describe('GET /api/events/invitations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it('devrait retourner 401 si non authentifié', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const response = await GET({} as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Non authentifié');
  });

  it('devrait retourner 404 si utilisateur introuvable', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue(null);

    const response = await GET({} as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Utilisateur introuvable');
  });

  it('devrait retourner les invitations en attente', async () => {
    const mockUser = { id: TEST_IDS.user1, email: 'test@example.com' };
    const mockInvitations = [
      { id: 'inv1', eventId: TEST_IDS.event1, userId: TEST_IDS.user1, status: 'pending', createdAt: new Date() },
    ];
    const mockEvents = [
      { id: TEST_IDS.event1, title: 'Event 1', createdById: TEST_IDS.user2, date: new Date() },
    ];
    const mockCreators = [
      { id: TEST_IDS.user2, name: 'Creator', email: 'creator@example.com' },
    ];

    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
    prismaMock.eventParticipant.findMany.mockResolvedValue(mockInvitations as any);
    prismaMock.event.findMany.mockResolvedValue(mockEvents as any);
    prismaMock.user.findMany.mockResolvedValue(mockCreators as any);
    prismaMock.poll.findMany.mockResolvedValue([]);
    prismaMock.pollVote.findMany.mockResolvedValue([]);

    const response = await GET({} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].type).toBe('event');
    expect(data[0].event.title).toBe('Event 1');
  });

  it('devrait supprimer les invitations orphelines', async () => {
    const mockUser = { id: TEST_IDS.user1, email: 'test@example.com' };
    const mockInvitations = [
      { id: 'inv1', eventId: TEST_IDS.event1, userId: TEST_IDS.user1, status: 'pending', createdAt: new Date() },
      { id: 'inv2', eventId: TEST_IDS.event2, userId: TEST_IDS.user1, status: 'pending', createdAt: new Date() },
    ];
    const mockEvents = [
      { id: TEST_IDS.event1, title: 'Event 1', createdById: TEST_IDS.user2, date: new Date() },
    ];

    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
    prismaMock.eventParticipant.findMany.mockResolvedValue(mockInvitations as any);
    prismaMock.event.findMany.mockResolvedValue(mockEvents as any);
    prismaMock.eventParticipant.deleteMany.mockResolvedValue({ count: 1 } as any);
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.poll.findMany.mockResolvedValue([]);
    prismaMock.pollVote.findMany.mockResolvedValue([]);

    const response = await GET({} as any);
    const data = await response.json();

    expect(prismaMock.eventParticipant.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['inv2'] } },
    });
  });

  it('devrait retourner les sondages en attente', async () => {
    const mockUser = { id: TEST_IDS.user1, email: 'test@example.com' };
    const mockPolls = [
      {
        id: TEST_IDS.poll1,
        question: 'Poll Question?',
        createdById: TEST_IDS.user2,
        recipientIds: [TEST_IDS.user1],
        status: 'open',
        createdAt: new Date(),
      },
    ];
    const mockCreators = [
      { id: TEST_IDS.user2, name: 'Creator', email: 'creator@example.com' },
    ];

    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
    prismaMock.eventParticipant.findMany.mockResolvedValue([]);
    prismaMock.event.findMany.mockResolvedValue([]);
    prismaMock.poll.findMany.mockResolvedValue(mockPolls as any);
    prismaMock.pollVote.findMany.mockResolvedValue([]);
    prismaMock.user.findMany.mockResolvedValue(mockCreators as any);

    const response = await GET({} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].type).toBe('poll');
    expect(data[0].event.title).toBe('Poll Question?');
  });

  it('ne devrait pas retourner les sondages où l\'utilisateur a déjà voté', async () => {
    const mockUser = { id: TEST_IDS.user1, email: 'test@example.com' };
    const mockPolls = [
      {
        id: TEST_IDS.poll1,
        question: 'Poll Question?',
        createdById: TEST_IDS.user2,
        recipientIds: [TEST_IDS.user1],
        status: 'open',
        createdAt: new Date(),
      },
    ];
    const mockVotes = [{ pollId: TEST_IDS.poll1 }];

    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
    prismaMock.eventParticipant.findMany.mockResolvedValue([]);
    prismaMock.event.findMany.mockResolvedValue([]);
    prismaMock.poll.findMany.mockResolvedValue(mockPolls as any);
    prismaMock.pollVote.findMany.mockResolvedValue(mockVotes as any);

    const response = await GET({} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(0);
  });

  it('devrait combiner événements et sondages triés par date', async () => {
    const mockUser = { id: TEST_IDS.user1, email: 'test@example.com' };
    const oldDate = new Date('2020-01-01');
    const recentDate = new Date('2025-01-01');

    const mockInvitations = [
      { id: 'inv1', eventId: TEST_IDS.event1, userId: TEST_IDS.user1, status: 'pending', createdAt: new Date() },
    ];
    const mockEvents = [
      { id: TEST_IDS.event1, title: 'Event 1', createdById: TEST_IDS.user2, date: oldDate },
    ];
    const mockPolls = [
      {
        id: TEST_IDS.poll1,
        question: 'Poll?',
        createdById: TEST_IDS.user2,
        recipientIds: [TEST_IDS.user1],
        status: 'open',
        createdAt: new Date(),
        deadline: recentDate,
      },
    ];

    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
    prismaMock.eventParticipant.findMany.mockResolvedValue(mockInvitations as any);
    prismaMock.event.findMany.mockResolvedValue(mockEvents as any);
    prismaMock.poll.findMany.mockResolvedValue(mockPolls as any);
    prismaMock.pollVote.findMany.mockResolvedValue([]);
    prismaMock.user.findMany.mockResolvedValue([]);

    const response = await GET({} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    // Le sondage avec la date plus récente devrait être en premier
    expect(data[0].type).toBe('poll');
  });
});
