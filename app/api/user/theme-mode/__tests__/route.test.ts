import { TEST_IDS } from '@/tests/helpers/objectid-helper';
import { setupDefaultMocks } from '@/tests/helpers/test-helpers';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { getServerSession } from 'next-auth';
import { prismaMock } from '@/tests/mocks/prisma';

vi.mock('next-auth');
vi.mock('@/lib/prisma');

describe('API /api/user/theme-mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  describe('GET', () => {
    it('devrait retourner 401 si non authentifié', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non authentifié');
    });

    it('devrait retourner le mode de thème de l\'utilisateur', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        themeMode: 'light',
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.themeMode).toBe('light');
    });

    it('devrait retourner "dark" par défaut si pas de mode', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.themeMode).toBe('dark');
    });
  });

  describe('POST', () => {
    it('devrait retourner 401 si non authentifié', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/user/theme-mode', {
        method: 'POST',
        body: JSON.stringify({ themeMode: 'dark' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non authentifié');
    });

    it('devrait retourner 400 si mode invalide', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/user/theme-mode', {
        method: 'POST',
        body: JSON.stringify({ themeMode: 'invalid' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Mode de thème invalide');
    });

    it('devrait mettre à jour le mode de thème à dark', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.update.mockResolvedValue({
        id: TEST_IDS.user1,
        themeMode: 'dark',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/user/theme-mode', {
        method: 'POST',
        body: JSON.stringify({ themeMode: 'dark' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.themeMode).toBe('dark');
    });

    it('devrait mettre à jour le mode de thème à light', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.update.mockResolvedValue({
        id: TEST_IDS.user1,
        themeMode: 'light',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/user/theme-mode', {
        method: 'POST',
        body: JSON.stringify({ themeMode: 'light' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.themeMode).toBe('light');
    });
  });
});
