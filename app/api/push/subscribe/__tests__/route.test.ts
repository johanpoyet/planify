import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, DELETE } from '../route';
import { getServerSession } from 'next-auth';
import { prismaMock } from '@/tests/mocks/prisma';

vi.mock('next-auth');
vi.mock('@/lib/prisma');

describe('API /api/push/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('devrait retourner 401 si non authentifié', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({ subscription: {} }),
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

      const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({ subscription: {} }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Utilisateur introuvable');
    });

    it('devrait retourner 400 si subscription invalide', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user1',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({ subscription: {} }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Subscription invalide');
    });

    it('devrait créer une nouvelle subscription', async () => {
      const mockSubscription = {
        endpoint: 'https://push.example.com/endpoint',
        keys: { p256dh: 'key1', auth: 'key2' },
      };

      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user1',
      } as any);

      prismaMock.pushSubscription.findUnique.mockResolvedValue(null);
      prismaMock.pushSubscription.create.mockResolvedValue({
        id: 'sub1',
        userId: 'user1',
        endpoint: mockSubscription.endpoint,
        p256dh: mockSubscription.keys.p256dh,
        auth: mockSubscription.keys.auth,
      } as any);

      const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({ subscription: mockSubscription }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.endpoint).toBe(mockSubscription.endpoint);
    });

    it('devrait mettre à jour une subscription existante', async () => {
      const mockSubscription = {
        endpoint: 'https://push.example.com/endpoint',
        keys: { p256dh: 'key1', auth: 'key2' },
      };

      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user1',
      } as any);

      prismaMock.pushSubscription.findUnique.mockResolvedValue({
        id: 'sub1',
        endpoint: mockSubscription.endpoint,
      } as any);

      prismaMock.pushSubscription.update.mockResolvedValue({
        id: 'sub1',
        userId: 'user1',
        endpoint: mockSubscription.endpoint,
        p256dh: mockSubscription.keys.p256dh,
        auth: mockSubscription.keys.auth,
      } as any);

      const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({ subscription: mockSubscription }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.endpoint).toBe(mockSubscription.endpoint);
    });
  });

  describe('DELETE', () => {
    it('devrait retourner 401 si non authentifié', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
        method: 'DELETE',
        body: JSON.stringify({ endpoint: 'https://push.example.com/endpoint' }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non authentifié');
    });

    it('devrait retourner 404 si utilisateur introuvable', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
        method: 'DELETE',
        body: JSON.stringify({ endpoint: 'https://push.example.com/endpoint' }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Utilisateur introuvable');
    });

    it('devrait retourner 400 si endpoint manquant', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user1',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
        method: 'DELETE',
        body: JSON.stringify({}),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Endpoint requis');
    });

    it('devrait supprimer la subscription', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user1',
      } as any);

      prismaMock.pushSubscription.deleteMany.mockResolvedValue({ count: 1 } as any);

      const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
        method: 'DELETE',
        body: JSON.stringify({ endpoint: 'https://push.example.com/endpoint' }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          endpoint: 'https://push.example.com/endpoint',
        },
      });
    });
  });
});
