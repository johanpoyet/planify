import { TEST_IDS } from '@/tests/helpers/objectid-helper';
import { setupDefaultMocks } from '@/tests/helpers/test-helpers';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '../route';
import { getServerSession } from 'next-auth';
import { prismaMock } from '@/tests/mocks/prisma';
import { sendPushNotification } from '@/lib/push';

vi.mock('next-auth');
vi.mock('@/lib/prisma');
vi.mock('@/lib/push');

describe('API /api/events/[id]/participants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  describe('GET', () => {
    it('devrait retourner 401 si non authentifié', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const params = Promise.resolve({ id: TEST_IDS.event1 });
      const response = await GET({} as any, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non authentifié');
    });

    it('devrait retourner les participants d\'un événement', async () => {
      const mockParticipants = [
        { id: 'part1', userId: TEST_IDS.user1, status: 'accepted', eventId: TEST_IDS.event1 },
        { id: 'part2', userId: TEST_IDS.user2, status: 'pending', eventId: TEST_IDS.event1 },
      ];
      const mockUsers = [
        { id: TEST_IDS.user1, name: 'User 1', email: 'user1@example.com', profileImageUrl: null },
        { id: TEST_IDS.user2, name: 'User 2', email: 'user2@example.com', profileImageUrl: null },
      ];
      const mockEvent = { id: TEST_IDS.event1, title: 'Event', createdById: TEST_IDS.user1 };

      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.eventParticipant.findMany.mockResolvedValue(mockParticipants as any);
      prismaMock.user.findMany.mockResolvedValue(mockUsers as any);
      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);

      const params = Promise.resolve({ id: TEST_IDS.event1 });
      const response = await GET({} as any, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].status).toBe('creator'); // user1 est le créateur
      expect(data[1].status).toBe('pending');
    });

    it('devrait ajouter le créateur s\'il n\'est pas dans les participants', async () => {
      const mockParticipants = [
        { id: 'part1', userId: TEST_IDS.user2, status: 'accepted', eventId: TEST_IDS.event1 },
      ];
      const mockUsers = [
        { id: TEST_IDS.user2, name: 'User 2', email: 'user2@example.com', profileImageUrl: null },
      ];
      const mockEvent = { id: TEST_IDS.event1, title: 'Event', createdById: TEST_IDS.user1 };
      const mockCreator = { id: TEST_IDS.user1, name: 'Creator', email: 'creator@example.com', profileImageUrl: null };

      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.eventParticipant.findMany.mockResolvedValue(mockParticipants as any);
      prismaMock.user.findMany.mockResolvedValue(mockUsers as any);
      prismaMock.event.findUnique.mockResolvedValue(mockEvent as any);
      prismaMock.user.findUnique.mockResolvedValue(mockCreator as any);

      const params = Promise.resolve({ id: TEST_IDS.event1 });
      const response = await GET({} as any, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].status).toBe('creator');
      expect(data[0].user.name).toBe('Creator');
    });
  });

  describe('POST', () => {
    it('devrait retourner 401 si non authentifié', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const params = Promise.resolve({ id: TEST_IDS.event1 });
      const request = new NextRequest('http://localhost:3000/api/events/event1/participants', {
        method: 'POST',
        body: JSON.stringify({ userIds: [TEST_IDS.user2] }),
      });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non authentifié');
    });

    it('devrait retourner 404 si utilisateur introuvable', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue(null);

      const params = Promise.resolve({ id: TEST_IDS.event1 });
      const request = new NextRequest('http://localhost:3000/api/events/event1/participants', {
        method: 'POST',
        body: JSON.stringify({ userIds: [TEST_IDS.user2] }),
      });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Utilisateur non trouvé');
    });

    it('devrait retourner 400 si userIds est invalide', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: TEST_IDS.user1,
      } as any);

      const params = Promise.resolve({ id: TEST_IDS.event1 });
      const request = new NextRequest('http://localhost:3000/api/events/event1/participants', {
        method: 'POST',
        body: JSON.stringify({ userIds: [] }),
      });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Liste d\'utilisateurs invalide');
    });

    it('devrait retourner 404 si événement introuvable', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: TEST_IDS.user1,
      } as any);

      prismaMock.event.findUnique.mockResolvedValue(null);

      const params = Promise.resolve({ id: TEST_IDS.event1 });
      const request = new NextRequest('http://localhost:3000/api/events/event1/participants', {
        method: 'POST',
        body: JSON.stringify({ userIds: [TEST_IDS.user2] }),
      });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Événement non trouvé');
    });

    it('devrait retourner 403 si l\'utilisateur n\'est pas le créateur', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: TEST_IDS.user1,
      } as any);

      prismaMock.event.findUnique.mockResolvedValue({
        id: TEST_IDS.event1,
        createdById: TEST_IDS.user2, // Autre utilisateur
      } as any);

      const params = Promise.resolve({ id: TEST_IDS.event1 });
      const request = new NextRequest('http://localhost:3000/api/events/event1/participants', {
        method: 'POST',
        body: JSON.stringify({ userIds: [TEST_IDS.user3] }),
      });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Seul le créateur peut ajouter des participants');
    });

    it('devrait ajouter des participants et envoyer des notifications', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: TEST_IDS.user1,
        name: 'Creator',
        email: 'creator@example.com',
      } as any);

      prismaMock.event.findUnique.mockResolvedValue({
        id: TEST_IDS.event1,
        title: 'Test Event',
        createdById: TEST_IDS.user1,
      } as any);

      prismaMock.eventParticipant.upsert.mockResolvedValue({
        id: 'part1',
        eventId: TEST_IDS.event1,
        userId: TEST_IDS.user2,
        status: 'pending',
      } as any);

      vi.mocked(sendPushNotification).mockResolvedValue({ success: true } as any);

      const params = Promise.resolve({ id: TEST_IDS.event1 });
      const request = new NextRequest('http://localhost:3000/api/events/event1/participants', {
        method: 'POST',
        body: JSON.stringify({ userIds: [TEST_IDS.user2, TEST_IDS.user3] }),
      });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveLength(2);
      expect(sendPushNotification).toHaveBeenCalledTimes(2);
    });
  });

  describe('DELETE', () => {
    it('devrait retourner 401 si non authentifié', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const params = Promise.resolve({ id: TEST_IDS.event1 });
      const request = new NextRequest('http://localhost:3000/api/events/event1/participants', {
        method: 'DELETE',
        body: JSON.stringify({ userId: TEST_IDS.user2 }),
      });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non authentifié');
    });

    it('devrait retourner 404 si utilisateur introuvable', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue(null);

      const params = Promise.resolve({ id: TEST_IDS.event1 });
      const request = new NextRequest('http://localhost:3000/api/events/event1/participants', {
        method: 'DELETE',
        body: JSON.stringify({ userId: TEST_IDS.user2 }),
      });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Utilisateur non trouvé');
    });

    it('devrait retourner 400 si userId manquant', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: TEST_IDS.user1,
      } as any);

      const params = Promise.resolve({ id: TEST_IDS.event1 });
      const request = new NextRequest('http://localhost:3000/api/events/event1/participants', {
        method: 'DELETE',
        body: JSON.stringify({}),
      });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('ID utilisateur manquant');
    });

    it('devrait retourner 404 si événement introuvable', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: TEST_IDS.user1,
      } as any);

      prismaMock.event.findUnique.mockResolvedValue(null);

      const params = Promise.resolve({ id: TEST_IDS.event1 });
      const request = new NextRequest('http://localhost:3000/api/events/event1/participants', {
        method: 'DELETE',
        body: JSON.stringify({ userId: TEST_IDS.user2 }),
      });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Événement non trouvé');
    });

    it('devrait retourner 403 si l\'utilisateur n\'est pas le créateur', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: TEST_IDS.user1,
      } as any);

      prismaMock.event.findUnique.mockResolvedValue({
        id: TEST_IDS.event1,
        createdById: TEST_IDS.user2,
      } as any);

      const params = Promise.resolve({ id: TEST_IDS.event1 });
      const request = new NextRequest('http://localhost:3000/api/events/event1/participants', {
        method: 'DELETE',
        body: JSON.stringify({ userId: TEST_IDS.user3 }),
      });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Seul le créateur peut retirer des participants');
    });

    it('devrait retirer un participant', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: TEST_IDS.user1,
      } as any);

      prismaMock.event.findUnique.mockResolvedValue({
        id: TEST_IDS.event1,
        createdById: TEST_IDS.user1,
      } as any);

      prismaMock.eventParticipant.deleteMany.mockResolvedValue({ count: 1 } as any);

      const params = Promise.resolve({ id: TEST_IDS.event1 });
      const request = new NextRequest('http://localhost:3000/api/events/event1/participants', {
        method: 'DELETE',
        body: JSON.stringify({ userId: TEST_IDS.user2 }),
      });

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prismaMock.eventParticipant.deleteMany).toHaveBeenCalledWith({
        where: {
          eventId: TEST_IDS.event1,
          userId: TEST_IDS.user2,
        },
      });
    });
  });
});
