import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { getServerSession } from 'next-auth';
import { prismaMock } from '@/tests/mocks/prisma';

vi.mock('next-auth');
vi.mock('@/lib/prisma');

describe('GET /api/events/shared', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('devrait retourner les événements publics', async () => {
    const mockUser = { id: 'user1', email: 'test@example.com' };
    const mockEvents = [
      {
        id: 'event1',
        title: 'Event Public',
        visibility: 'public',
        createdById: 'user2',
        date: new Date(),
      },
    ];
    const mockCreators = [
      { id: 'user2', name: 'Creator', email: 'creator@example.com' },
    ];

    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
    prismaMock.friend.findMany.mockResolvedValue([]);
    prismaMock.event.findMany.mockResolvedValue(mockEvents as any);
    prismaMock.user.findMany.mockResolvedValue(mockCreators as any);

    const response = await GET({} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].creator.name).toBe('Creator');
  });

  it('devrait retourner les événements "friends" des amis', async () => {
    const mockUser = { id: 'user1', email: 'test@example.com' };
    const mockFriendships = [
      { id: 'f1', userId: 'user1', friendId: 'user2', status: 'accepted' },
    ];
    const mockEvents = [
      {
        id: 'event1',
        title: 'Event Friends',
        visibility: 'friends',
        createdById: 'user2',
        date: new Date(),
      },
    ];
    const mockCreators = [
      { id: 'user2', name: 'Friend', email: 'friend@example.com' },
    ];

    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
    prismaMock.friend.findMany.mockResolvedValue(mockFriendships as any);
    prismaMock.event.findMany.mockResolvedValue(mockEvents as any);
    prismaMock.user.findMany.mockResolvedValue(mockCreators as any);

    const response = await GET({} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].visibility).toBe('friends');
  });

  it('ne devrait pas retourner les événements privés', async () => {
    const mockUser = { id: 'user1', email: 'test@example.com' };
    const mockFriendships = [
      { id: 'f1', userId: 'user1', friendId: 'user2', status: 'accepted' },
    ];

    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
    prismaMock.friend.findMany.mockResolvedValue(mockFriendships as any);
    prismaMock.event.findMany.mockResolvedValue([]);
    prismaMock.user.findMany.mockResolvedValue([]);

    const response = await GET({} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(0);
  });

  it('ne devrait pas retourner les propres événements de l\'utilisateur', async () => {
    const mockUser = { id: 'user1', email: 'test@example.com' };

    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
    prismaMock.friend.findMany.mockResolvedValue([]);
    prismaMock.event.findMany.mockResolvedValue([]);

    const response = await GET({} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdById: { not: 'user1' },
        }),
      })
    );
  });

  it('devrait limiter les résultats à 100 événements', async () => {
    const mockUser = { id: 'user1', email: 'test@example.com' };

    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
    prismaMock.friend.findMany.mockResolvedValue([]);
    prismaMock.event.findMany.mockResolvedValue([]);

    const response = await GET({} as any);

    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100,
      })
    );
  });
});
