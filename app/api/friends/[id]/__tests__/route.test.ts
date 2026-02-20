import { TEST_IDS } from '@/tests/helpers/objectid-helper';
import { setupDefaultMocks } from '@/tests/helpers/test-helpers';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../../../../../tests/mocks/prisma';
import { getServerSessionMock, mockSession } from '../../../../../tests/mocks/next-auth';
import { createMockRequest, getResponseJson } from '../../../../../tests/helpers/api-helpers';

import { PUT, DELETE } from '../route';

// ── Helpers ────────────────────────────────────────────────────────────────

const mockUser = {
  id: 'user-id-123',
  email: 'test@example.com',
  name: 'Test User',
};

const otherUserId = 'other-user-456';
const unrelatedUserId = 'unrelated-789';

function makeFriendship(overrides: Record<string, any> = {}) {
  return {
    id: 'friendship-1',
    userId: otherUserId,
    friendId: mockUser.id,
    status: 'pending',
    createdAt: new Date('2025-01-01'),
    ...overrides,
  };
}

/**
 * Build the second argument expected by the route handler.
 * Next.js 15 async params: { params: Promise<{ id: string }> }
 */
function makeRouteContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ── PUT /api/friends/[id] ──────────────────────────────────────────────────

describe('PUT /api/friends/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it('returns 401 if not authenticated', async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const request = createMockRequest('PUT', { action: 'accept' });
    const response = await PUT(request as any, makeRouteContext('friendship-1'));
    const json = await getResponseJson(response);

    expect(response.status).toBe(401);
    expect(json.error).toBe('Non authentifié');
  });

  it('returns 404 if user not found in database', async () => {
    getServerSessionMock.mockResolvedValueOnce(mockSession);
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const request = createMockRequest('PUT', { action: 'accept' });
    const response = await PUT(request as any, makeRouteContext('friendship-1'));
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json.error).toBe('Utilisateur introuvable');
  });

  it('returns 404 if friendship not found', async () => {
    getServerSessionMock.mockResolvedValueOnce(mockSession);
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);
    prismaMock.friend.findUnique.mockResolvedValueOnce(null);

    const request = createMockRequest('PUT', { action: 'accept' });
    const response = await PUT(request as any, makeRouteContext('nonexistent'));
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json.error).toBe('Demande introuvable');
  });

  it('returns 403 if user is not part of the friendship', async () => {
    getServerSessionMock.mockResolvedValueOnce(mockSession);
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);

    // Friendship between two other users (current user not involved)
    prismaMock.friend.findUnique.mockResolvedValueOnce(
      makeFriendship({
        userId: unrelatedUserId,
        friendId: otherUserId,
      }),
    );

    const request = createMockRequest('PUT', { action: 'accept' });
    const response = await PUT(request as any, makeRouteContext('friendship-1'));
    const json = await getResponseJson(response);

    expect(response.status).toBe(403);
    expect(json.error).toBe('Non autorisé');
  });

  it('returns 403 when non-recipient tries to accept', async () => {
    getServerSessionMock.mockResolvedValueOnce(mockSession);
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);

    // Current user is the sender (userId), not the receiver (friendId)
    prismaMock.friend.findUnique.mockResolvedValueOnce(
      makeFriendship({
        userId: mockUser.id,
        friendId: otherUserId,
      }),
    );

    const request = createMockRequest('PUT', { action: 'accept' });
    const response = await PUT(request as any, makeRouteContext('friendship-1'));
    const json = await getResponseJson(response);

    expect(response.status).toBe(403);
    expect(json.error).toBe('Seul le destinataire peut accepter');
  });

  it('accepts a friendship request successfully', async () => {
    getServerSessionMock.mockResolvedValueOnce(mockSession);
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);

    // Current user is the friendId (the receiver)
    const friendship = makeFriendship();
    prismaMock.friend.findUnique.mockResolvedValueOnce(friendship);

    const updatedFriendship = { ...friendship, status: 'accepted' };
    prismaMock.friend.update.mockResolvedValueOnce(updatedFriendship);

    const request = createMockRequest('PUT', { action: 'accept' });
    const response = await PUT(request as any, makeRouteContext('friendship-1'));
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json.status).toBe('accepted');
    expect(prismaMock.friend.update)).toHaveBeenCalledWith({
      where: { id: 'friendship-1' },
      data: { status: 'accepted' },
    });
  });

  it('rejects a friendship request by deleting it', async () => {
    getServerSessionMock.mockResolvedValueOnce(mockSession);
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);

    const friendship = makeFriendship();
    prismaMock.friend.findUnique.mockResolvedValueOnce(friendship);
    prismaMock.friend.delete.mockResolvedValueOnce(friendship);

    const request = createMockRequest('PUT', { action: 'reject' });
    const response = await PUT(request as any, makeRouteContext('friendship-1'));
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(prismaMock.friend.delete).toHaveBeenCalledWith({
      where: { id: 'friendship-1' },
    });
  });

  it('returns 400 for an invalid action', async () => {
    getServerSessionMock.mockResolvedValueOnce(mockSession);
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);

    const friendship = makeFriendship();
    prismaMock.friend.findUnique.mockResolvedValueOnce(friendship);

    const request = createMockRequest('PUT', { action: 'invalid-action' });
    const response = await PUT(request as any, makeRouteContext('friendship-1'));
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toBe('Action invalide');
  });
});

// ── DELETE /api/friends/[id] ───────────────────────────────────────────────

describe('DELETE /api/friends/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it('returns 401 if not authenticated', async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request as any, makeRouteContext('friendship-1'));
    const json = await getResponseJson(response);

    expect(response.status).toBe(401);
    expect(json.error).toBe('Non authentifié');
  });

  it('returns 404 if user not found in database', async () => {
    getServerSessionMock.mockResolvedValueOnce(mockSession);
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request as any, makeRouteContext('friendship-1'));
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json.error).toBe('Utilisateur introuvable');
  });

  it('returns 404 if friendship not found', async () => {
    getServerSessionMock.mockResolvedValueOnce(mockSession);
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);
    prismaMock.friend.findUnique.mockResolvedValueOnce(null);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request as any, makeRouteContext('nonexistent'));
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json.error).toBe('Relation introuvable');
  });

  it('returns 403 if user is not part of the friendship', async () => {
    getServerSessionMock.mockResolvedValueOnce(mockSession);
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);

    prismaMock.friend.findUnique.mockResolvedValueOnce(
      makeFriendship({
        userId: unrelatedUserId,
        friendId: otherUserId,
      }),
    );

    const request = createMockRequest('DELETE');
    const response = await DELETE(request as any, makeRouteContext('friendship-1'));
    const json = await getResponseJson(response);

    expect(response.status).toBe(403);
    expect(json.error).toBe('Non autorisé');
  });

  it('deletes the friendship successfully', async () => {
    getServerSessionMock.mockResolvedValueOnce(mockSession);
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);

    const friendship = makeFriendship();
    prismaMock.friend.findUnique.mockResolvedValueOnce(friendship);
    prismaMock.friend.delete.mockResolvedValueOnce(friendship);

    const request = createMockRequest('DELETE');
    const response = await DELETE(request as any, makeRouteContext('friendship-1'));
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(prismaMock.friend.delete).toHaveBeenCalledWith({
      where: { id: 'friendship-1' },
    });
  });
});
