import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PUT } from '../route';
import { getServerSession } from 'next-auth';
import { prismaMock } from '@/tests/mocks/prisma';

vi.mock('next-auth');
vi.mock('@/lib/prisma');

describe('API /api/user/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('devrait retourner 401 si non authentifié', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non authentifié');
    });

    it('devrait retourner 404 si utilisateur introuvable', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Utilisateur introuvable');
    });

    it('devrait retourner les paramètres de l\'utilisateur', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        name: 'Test User',
        calendarVisibility: 'friends',
        profileImageUrl: '/uploads/profile.jpg',
      };

      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockUser);
    });
  });

  describe('PUT', () => {
    it('devrait retourner 401 si non authentifié', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/user/settings', {
        method: 'PUT',
        body: JSON.stringify({ calendarVisibility: 'public' }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non authentifié');
    });

    it('devrait retourner 404 si utilisateur introuvable', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/user/settings', {
        method: 'PUT',
        body: JSON.stringify({ calendarVisibility: 'public' }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Utilisateur introuvable');
    });

    it('devrait mettre à jour la visibilité du calendrier', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        name: 'Test User',
        calendarVisibility: 'friends',
      };

      const updatedUser = {
        ...mockUser,
        calendarVisibility: 'public',
        profileImageUrl: null,
      };

      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.user.update.mockResolvedValue(updatedUser as any);

      const request = new NextRequest('http://localhost:3000/api/user/settings', {
        method: 'PUT',
        body: JSON.stringify({ calendarVisibility: 'public' }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.calendarVisibility).toBe('public');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { calendarVisibility: 'public' },
        select: expect.any(Object),
      });
    });
  });
});
