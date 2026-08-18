import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '@/tests/mocks/prisma';
import { GET } from '../route';

vi.mock('@/lib/prisma');

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner 200 et db "up" quand la base répond', async () => {
    prismaMock.user.count.mockResolvedValue(3);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.db).toBe('up');
    expect(typeof data.latencyMs).toBe('number');
    expect(typeof data.uptimeSeconds).toBe('number');
  });

  it('devrait retourner 503 et db "down" quand la base est injoignable', async () => {
    prismaMock.user.count.mockRejectedValue(new Error('connection refused'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('degraded');
    expect(data.db).toBe('down');
  });
});
