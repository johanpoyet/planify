import { describe, it, expect, vi } from 'vitest';
import { GET } from '../route';

describe('GET /api/push/vapid-public-key', () => {
  it('devrait retourner la clé publique VAPID', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.publicKey).toBe(process.env.VAPID_PUBLIC_KEY);
  });

  it('devrait retourner 500 si la clé n\'est pas configurée', async () => {
    const originalKey = process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PUBLIC_KEY;

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Clé VAPID non configurée');

    process.env.VAPID_PUBLIC_KEY = originalKey;
  });
});
