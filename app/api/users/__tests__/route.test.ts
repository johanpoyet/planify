import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { getServerSession } from 'next-auth';
import { prismaMock } from '@/tests/mocks/prisma';

vi.mock('next-auth');
vi.mock('@/lib/prisma');

describe('GET /api/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner 401 si non authentifié', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/users');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Non authentifié');
  });

  it('devrait retourner l\'utilisateur courant', async () => {
    const mockUser = {
      id: 'user1',
      name: 'Test User',
      email: 'test@example.com',
      calendarVisibility: 'friends',
    };

    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

    const request = new NextRequest('http://localhost:3000/api/users');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.email).toBe('test@example.com');
  });

  it('devrait retourner un utilisateur spécifique par email', async () => {
    const mockUser = {
      id: 'user2',
      name: 'Other User',
      email: 'other@example.com',
      calendarVisibility: 'public',
    };

    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

    const request = new NextRequest('http://localhost:3000/api/users?email=other@example.com');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.email).toBe('other@example.com');
  });
});
