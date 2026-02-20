import { TEST_IDS } from '@/tests/helpers/objectid-helper';
import { setupDefaultMocks } from '@/tests/helpers/test-helpers';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { getServerSession } from 'next-auth';
import { prismaMock } from '@/tests/mocks/prisma';

vi.mock('next-auth');
vi.mock('@/lib/prisma');

describe('POST /api/push/check-subscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it('devrait retourner 401 si non authentifié', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/push/check-subscription', {
      method: 'POST',
      body: JSON.stringify({ endpoint: 'https://push.example.com/endpoint' }),
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

    const request = new NextRequest('http://localhost:3000/api/push/check-subscription', {
      method: 'POST',
      body: JSON.stringify({ endpoint: 'https://push.example.com/endpoint' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Utilisateur introuvable');
  });

  it('devrait retourner true si la subscription existe', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
    } as any);

    prismaMock.user.findUnique.mockResolvedValue({
      id: TEST_IDS.user1,
    } as any);

    prismaMock.pushSubscription.findFirst.mockResolvedValue({
      id: 'sub1',
      userId: TEST_IDS.user1,
      endpoint: 'https://push.example.com/endpoint',
    } as any);

    const request = new NextRequest('http://localhost:3000/api/push/check-subscription', {
      method: 'POST',
      body: JSON.stringify({ endpoint: 'https://push.example.com/endpoint' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.exists).toBe(true);
  });
});
