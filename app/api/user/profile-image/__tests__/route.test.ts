import { TEST_IDS } from '@/tests/helpers/objectid-helper';
import { setupDefaultMocks } from '@/tests/helpers/test-helpers';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, DELETE } from '../route';
import { getServerSession } from 'next-auth';
import { prismaMock } from '@/tests/mocks/prisma';
import * as fs from 'fs/promises';

vi.mock('next-auth');
vi.mock('@/lib/prisma');
vi.mock('fs/promises');
vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

describe('API /api/user/profile-image', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  describe('POST', () => {
    it('devrait retourner 401 si non authentifié', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/user/profile-image', {
        method: 'POST',
        body: new FormData(),
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

      const request = new NextRequest('http://localhost:3000/api/user/profile-image', {
        method: 'POST',
        body: new FormData(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Utilisateur introuvable');
    });

    it('devrait retourner 400 si aucune image fournie', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: TEST_IDS.user1,
      } as any);

      const formData = new FormData();
      const request = new NextRequest('http://localhost:3000/api/user/profile-image', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Aucune image fournie');
    });

    it('devrait retourner 400 si type de fichier invalide', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: TEST_IDS.user1,
      } as any);

      const formData = new FormData();
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      formData.append('image', file);

      const request = new NextRequest('http://localhost:3000/api/user/profile-image', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Type de fichier invalide');
    });

    it('devrait retourner 400 si fichier trop volumineux', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: TEST_IDS.user1,
      } as any);

      const formData = new FormData();
      const largeContent = new Array(6 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'test.jpg', { type: 'image/jpeg' });
      formData.append('image', file);

      const request = new NextRequest('http://localhost:3000/api/user/profile-image', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Fichier trop volumineux');
    });

    it('devrait uploader une image valide', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: TEST_IDS.user1,
        profileImageUrl: null,
      } as any);

      prismaMock.user.update.mockResolvedValue({
        id: TEST_IDS.user1,
        name: 'Test',
        email: 'test@example.com',
        profileImageUrl: '/api/uploads/profiles/user1-123456789.jpg',
      } as any);

      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.chmod).mockResolvedValue(undefined);

      const formData = new FormData();
      const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('image', file);

      const request = new NextRequest('http://localhost:3000/api/user/profile-image', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Photo de profil mise à jour');
      expect(data.user).toBeDefined();
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('DELETE', () => {
    it('devrait retourner 401 si non authentifié', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non authentifié');
    });

    it('devrait retourner 404 si utilisateur introuvable', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Utilisateur introuvable');
    });

    it('devrait supprimer la photo de profil', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { email: 'test@example.com' },
      } as any);

      prismaMock.user.findUnique.mockResolvedValue({
        id: TEST_IDS.user1,
        profileImageUrl: '/uploads/profiles/user1.jpg',
      } as any);

      prismaMock.user.update.mockResolvedValue({
        id: TEST_IDS.user1,
        name: 'Test',
        email: 'test@example.com',
        profileImageUrl: null,
      } as any);

      const { existsSync } = await import('fs');
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Photo de profil supprimée');
      expect(data.user.profileImageUrl).toBeNull();
    });
  });
});
