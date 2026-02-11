import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { getServerSession } from 'next-auth';
import { prismaMock } from '@/tests/mocks/prisma';

vi.mock('next-auth');
vi.mock('@/lib/prisma');

describe('GET /api/user', () => {
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

  it('devrait retourner les informations de l\'utilisateur', async () => {
    const mockUser = {
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User',
      themeColor: 'blue',
      calendarVisibility: 'friends',
    };

    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

    const response = await GET({} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockUser);
  });
});
