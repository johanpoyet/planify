import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFriendRequests } from '../useFriendRequests';
import { useSession } from 'next-auth/react';

vi.mock('next-auth/react');

global.fetch = vi.fn();

describe('useFriendRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner 0 requêtes si pas de session', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    });

    const { result } = renderHook(() => useFriendRequests());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pendingCount).toBe(0);
  });

  it('devrait récupérer le nombre de requêtes en attente', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    const mockRequests = [
      { id: '1', userId: 'user1', friendId: 'user2', status: 'pending', isReceiver: true },
      { id: '2', userId: 'user1', friendId: 'user3', status: 'pending', isReceiver: true },
      { id: '3', userId: 'user4', friendId: 'user1', status: 'pending', isReceiver: false },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockRequests,
    } as any);

    const { result } = renderHook(() => useFriendRequests());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pendingCount).toBe(2); // Only isReceiver: true
    expect(global.fetch).toHaveBeenCalledWith('/api/friends?status=pending');
  });

  it('devrait filtrer seulement les requêtes reçues (isReceiver: true)', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    const mockRequests = [
      { id: '1', isReceiver: false },
      { id: '2', isReceiver: true },
      { id: '3', isReceiver: false },
      { id: '4', isReceiver: true },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockRequests,
    } as any);

    const { result } = renderHook(() => useFriendRequests());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pendingCount).toBe(2);
  });

  it('devrait gérer les erreurs de fetch', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useFriendRequests());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pendingCount).toBe(0);
  });

  it('devrait retourner 0 si la réponse n\'est pas ok', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as any);

    const { result } = renderHook(() => useFriendRequests());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pendingCount).toBe(0);
  });
});
