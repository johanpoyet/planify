import { TEST_IDS } from '@/tests/helpers/objectid-helper';
import { setupDefaultMocks } from '@/tests/helpers/test-helpers';
import { setupDefaultMocks } from '@/tests/helpers/test-helpers';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { getServerSession } from 'next-auth';
import { prismaMock } from '@/tests/mocks/prisma';

vi.mock('next-auth');
vi.mock('@/lib/prisma');

describe('API /api/event-types', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
    setupDefaultMocks();
  });

  describe('GET', () => {
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

    it('devrait retourner la liste des types d\'événements', async () => {
      const mockEventTypes = [
        { id: 'type1', name: 'Travail', color: '#FF0000', userId: TEST_IDS.user1 },
        { id: 'type2', name: 'Personnel', color: '#00FF00', userId: TEST_IDS.user1 },
      ];

      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: TEST_IDS.user1,
      } as any);

      prismaMock.eventType.findMany.mockResolvedValue(mockEventTypes as any);

      const response = await GET({} as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockEventTypes);
      expect(prismaMock.eventType.findMany)).toHaveBeenCalledWith({
        where: { userId: TEST_IDS.user1 },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('POST', () => {
    it('devrait retourner 401 si non authentifié', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/event-types', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', color: '#FF0000' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non authentifié');
    });

    it('devrait retourner 404 si utilisateur introuvable', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/event-types', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', color: '#FF0000' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Utilisateur introuvable');
    });

    it('devrait retourner 400 si nom manquant', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: TEST_IDS.user1,
      } as any);

      const request = new NextRequest('http://localhost:3000/api/event-types', {
        method: 'POST',
        body: JSON.stringify({ color: '#FF0000' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Nom et couleur requis');
    });

    it('devrait retourner 400 si couleur manquante', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: TEST_IDS.user1,
      } as any);

      const request = new NextRequest('http://localhost:3000/api/event-types', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Nom et couleur requis');
    });

    it('devrait créer un nouveau type d\'événement', async () => {
      const newEventType = {
        id: 'type1',
        name: 'Travail',
        color: '#FF0000',
        userId: TEST_IDS.user1,
      };

      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: TEST_IDS.user1,
      } as any);

      prismaMock.eventType.create.mockResolvedValue(newEventType as any);

      const request = new NextRequest('http://localhost:3000/api/event-types', {
        method: 'POST',
        body: JSON.stringify({ name: 'Travail', color: '#FF0000' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(newEventType);
      expect(prismaMock.eventType.create)).toHaveBeenCalledWith({
        data: {
          name: 'Travail',
          color: '#FF0000',
          userId: TEST_IDS.user1,
        },
      });
    });
  });
});
