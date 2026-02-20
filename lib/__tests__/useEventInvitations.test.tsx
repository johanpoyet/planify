import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEventInvitations } from '../useEventInvitations';
import { useSession } from 'next-auth/react';

vi.mock('next-auth/react');

global.fetch = vi.fn();

describe('useEventInvitations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner 0 invitations si pas de session', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    });

    const { result } = renderHook(() => useEventInvitations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.invitationsCount).toBe(0);
  });

  it('devrait récupérer le nombre d\'invitations', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ count: 3 }),
    } as any);

    const { result } = renderHook(() => useEventInvitations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.invitationsCount).toBe(3);
    expect(global.fetch).toHaveBeenCalledWith('/api/events/invitations/count');
  });

  it('devrait gérer les erreurs de fetch', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useEventInvitations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.invitationsCount).toBe(0);
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

    const { result } = renderHook(() => useEventInvitations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.invitationsCount).toBe(0);
  });
});
