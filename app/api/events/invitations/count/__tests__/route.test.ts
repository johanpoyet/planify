import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { getServerSession } from 'next-auth';
import { prismaMock } from '@/tests/mocks/prisma';

vi.mock('next-auth');
vi.mock('@/lib/prisma');

describe('GET /api/events/invitations/count', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner 0 si non authentifié', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const response = await GET({} as any);
    const data = await response.json();

    expect(data.count).toBe(0);
  });

  it('devrait retourner 0 si utilisateur introuvable', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue(null);

    const response = await GET({} as any);
    const data = await response.json();

    expect(data.count).toBe(0);
  });

  it('devrait compter les invitations d\'événements en attente', async () => {
    const mockUser = { id: 'user1', email: 'test@example.com' };
    const mockInvitations = [
      { id: 'inv1', eventId: 'event1', userId: 'user1', status: 'pending' },
      { id: 'inv2', eventId: 'event2', userId: 'user1', status: 'pending' },
    ];
    const mockEvents = [
      { id: 'event1' },
      { id: 'event2' },
    ];

    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
    prismaMock.eventParticipant.findMany.mockResolvedValue(mockInvitations as any);
    prismaMock.event.findMany.mockResolvedValue(mockEvents as any);
    prismaMock.poll.findMany.mockResolvedValue([]);

    const response = await GET({} as any);
    const data = await response.json();

    expect(data.count).toBe(2);
  });

  it('devrait supprimer les invitations orphelines et ne pas les compter', async () => {
    const mockUser = { id: 'user1', email: 'test@example.com' };
    const mockInvitations = [
      { id: 'inv1', eventId: 'event1', userId: 'user1', status: 'pending' },
      { id: 'inv2', eventId: 'event2', userId: 'user1', status: 'pending' },
    ];
    const mockEvents = [{ id: 'event1' }]; // event2 n'existe plus

    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
    prismaMock.eventParticipant.findMany.mockResolvedValue(mockInvitations as any);
    prismaMock.event.findMany.mockResolvedValue(mockEvents as any);
    prismaMock.eventParticipant.deleteMany.mockResolvedValue({ count: 1 } as any);
    prismaMock.poll.findMany.mockResolvedValue([]);

    const response = await GET({} as any);
    const data = await response.json();

    expect(data.count).toBe(1);
    expect(prisma.eventParticipant.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['inv2'] } },
    });
  });

  it('devrait compter les sondages où l\'utilisateur n\'a pas voté', async () => {
    const mockUser = { id: 'user1', email: 'test@example.com' };
    const mockPolls = [
      { id: 'poll1', recipientIds: ['user1'], status: 'open' },
      { id: 'poll2', recipientIds: ['user1'], status: 'open' },
    ];

    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
    prismaMock.eventParticipant.findMany.mockResolvedValue([]);
    prismaMock.event.findMany.mockResolvedValue([]);
    prismaMock.poll.findMany.mockResolvedValue(mockPolls as any);
    prismaMock.pollVote.findFirst.mockResolvedValue(null);

    const response = await GET({} as any);
    const data = await response.json();

    expect(data.count).toBe(2);
  });

  it('devrait combiner événements et sondages dans le comptage', async () => {
    const mockUser = { id: 'user1', email: 'test@example.com' };
    const mockInvitations = [
      { id: 'inv1', eventId: 'event1', userId: 'user1', status: 'pending' },
    ];
    const mockEvents = [{ id: 'event1' }];
    const mockPolls = [
      { id: 'poll1', recipientIds: ['user1'], status: 'open' },
    ];

    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
    prismaMock.eventParticipant.findMany.mockResolvedValue(mockInvitations as any);
    prismaMock.event.findMany.mockResolvedValue(mockEvents as any);
    prismaMock.poll.findMany.mockResolvedValue(mockPolls as any);
    prismaMock.pollVote.findFirst.mockResolvedValue(null);

    const response = await GET({} as any);
    const data = await response.json();

    expect(data.count).toBe(2); // 1 invitation + 1 sondage
  });
});
