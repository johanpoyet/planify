import { TEST_IDS } from '@/tests/helpers/objectid-helper';
import { setupDefaultMocks } from '@/tests/helpers/test-helpers';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PUT } from '../route';
import { getServerSession } from 'next-auth';
import { prismaMock } from '@/tests/mocks/prisma';

vi.mock('next-auth');
vi.mock('@/lib/prisma');

describe('PUT /api/events/[id]/participants/[userId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it('devrait retourner 401 si non authentifié', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const params = Promise.resolve({ id: TEST_IDS.event1, userId: TEST_IDS.user1 });
    const request = new NextRequest('http://localhost:3000/api/events/event1/participants/user1', {
      method: 'PUT',
      body: JSON.stringify({ action: 'accept' }),
    });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Non authentifié');
  });

  it('devrait retourner 404 si utilisateur introuvable', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue(null);

    const params = Promise.resolve({ id: TEST_IDS.event1, userId: TEST_IDS.user1 });
    const request = new NextRequest('http://localhost:3000/api/events/event1/participants/user1', {
      method: 'PUT',
      body: JSON.stringify({ action: 'accept' }),
    });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Utilisateur introuvable');
  });

  it('devrait retourner 403 si l\'utilisateur essaie de modifier une autre invitation', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue({
      id: TEST_IDS.user1,
    } as any);

    const params = Promise.resolve({ id: TEST_IDS.event1, userId: TEST_IDS.user2 });
    const request = new NextRequest('http://localhost:3000/api/events/event1/participants/user2', {
      method: 'PUT',
      body: JSON.stringify({ action: 'accept' }),
    });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Vous ne pouvez modifier que vos propres invitations');
  });

  it('devrait retourner 404 si l\'invitation n\'existe pas', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue({
      id: TEST_IDS.user1,
    } as any);

    prismaMock.eventParticipant.findUnique.mockResolvedValue(null);

    const params = Promise.resolve({ id: TEST_IDS.event1, userId: TEST_IDS.user1 });
    const request = new NextRequest('http://localhost:3000/api/events/event1/participants/user1', {
      method: 'PUT',
      body: JSON.stringify({ action: 'accept' }),
    });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Invitation non trouvée');
  });

  it('devrait accepter une invitation', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue({
      id: TEST_IDS.user1,
    } as any);

    prismaMock.eventParticipant.findUnique.mockResolvedValue({
      id: 'part1',
      eventId: TEST_IDS.event1,
      userId: TEST_IDS.user1,
      status: 'pending',
    } as any);

    prismaMock.eventParticipant.update.mockResolvedValue({
      id: 'part1',
      eventId: TEST_IDS.event1,
      userId: TEST_IDS.user1,
      status: 'accepted',
    } as any);

    const params = Promise.resolve({ id: TEST_IDS.event1, userId: TEST_IDS.user1 });
    const request = new NextRequest('http://localhost:3000/api/events/event1/participants/user1', {
      method: 'PUT',
      body: JSON.stringify({ action: 'accept' }),
    });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('accepted');
  });

  it('devrait refuser une invitation', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue({
      id: TEST_IDS.user1,
    } as any);

    prismaMock.eventParticipant.findUnique.mockResolvedValue({
      id: 'part1',
      eventId: TEST_IDS.event1,
      userId: TEST_IDS.user1,
      status: 'pending',
    } as any);

    prismaMock.eventParticipant.delete.mockResolvedValue({} as any);

    const params = Promise.resolve({ id: TEST_IDS.event1, userId: TEST_IDS.user1 });
    const request = new NextRequest('http://localhost:3000/api/events/event1/participants/user1', {
      method: 'PUT',
      body: JSON.stringify({ action: 'decline' }),
    });

    const response = await PUT(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.deleted).toBe(true);
  });
});
