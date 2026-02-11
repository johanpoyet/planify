import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PUT, DELETE } from '../route';
import { getServerSession } from 'next-auth';
import { prismaMock } from '@/tests/mocks/prisma';

vi.mock('next-auth');
vi.mock('@/lib/prisma');

describe('API /api/event-types/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PUT', () => {
    it('devrait retourner 401 si non authentifié', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const params = Promise.resolve({ id: 'type1' });
      const response = await PUT({} as any, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non authentifié');
    });

    it('devrait retourner 404 si utilisateur introuvable', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue(null);

      const params = Promise.resolve({ id: 'type1' });
      const request = new NextRequest('http://localhost:3000/api/event-types/type1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'New Name' }),
      });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Utilisateur introuvable');
    });

    it('devrait retourner 404 si type d\'événement introuvable', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user1',
      } as any);

      prismaMock.eventType.findUnique.mockResolvedValue(null);

      const params = Promise.resolve({ id: 'type1' });
      const request = new NextRequest('http://localhost:3000/api/event-types/type1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'New Name' }),
      });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Type d\'événement introuvable');
    });

    it('devrait retourner 403 si l\'utilisateur n\'est pas propriétaire', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user1',
      } as any);

      prismaMock.eventType.findUnique.mockResolvedValue({
        id: 'type1',
        userId: 'user2', // Autre utilisateur
      } as any);

      const params = Promise.resolve({ id: 'type1' });
      const request = new NextRequest('http://localhost:3000/api/event-types/type1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'New Name' }),
      });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Non autorisé');
    });

    it('devrait modifier le type d\'événement', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user1',
      } as any);

      prismaMock.eventType.findUnique.mockResolvedValue({
        id: 'type1',
        userId: 'user1',
        name: 'Old Name',
        color: '#FF0000',
      } as any);

      prismaMock.eventType.update.mockResolvedValue({
        id: 'type1',
        userId: 'user1',
        name: 'New Name',
        color: '#00FF00',
      } as any);

      const params = Promise.resolve({ id: 'type1' });
      const request = new NextRequest('http://localhost:3000/api/event-types/type1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'New Name', color: '#00FF00' }),
      });

      const response = await PUT(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('New Name');
      expect(data.color).toBe('#00FF00');
    });
  });

  describe('DELETE', () => {
    it('devrait retourner 401 si non authentifié', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const params = Promise.resolve({ id: 'type1' });
      const response = await DELETE({} as any, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non authentifié');
    });

    it('devrait retourner 404 si utilisateur introuvable', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue(null);

      const params = Promise.resolve({ id: 'type1' });
      const response = await DELETE({} as any, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Utilisateur introuvable');
    });

    it('devrait retourner 404 si type d\'événement introuvable', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user1',
      } as any);

      prismaMock.eventType.findUnique.mockResolvedValue(null);

      const params = Promise.resolve({ id: 'type1' });
      const response = await DELETE({} as any, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Type d\'événement introuvable');
    });

    it('devrait retourner 403 si l\'utilisateur n\'est pas propriétaire', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user1',
      } as any);

      prismaMock.eventType.findUnique.mockResolvedValue({
        id: 'type1',
        userId: 'user2',
      } as any);

      const params = Promise.resolve({ id: 'type1' });
      const response = await DELETE({} as any, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Non autorisé');
    });

    it('devrait supprimer le type d\'événement et retirer l\'association des événements', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user1',
      } as any);

      prismaMock.eventType.findUnique.mockResolvedValue({
        id: 'type1',
        userId: 'user1',
      } as any);

      prismaMock.event.updateMany.mockResolvedValue({ count: 3 } as any);
      prismaMock.eventType.delete.mockResolvedValue({} as any);

      const params = Promise.resolve({ id: 'type1' });
      const response = await DELETE({} as any, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prisma.event.updateMany).toHaveBeenCalledWith({
        where: { eventTypeId: 'type1' },
        data: { eventTypeId: null },
      });
      expect(prisma.eventType.delete).toHaveBeenCalledWith({
        where: { id: 'type1' },
      });
    });
  });
});
