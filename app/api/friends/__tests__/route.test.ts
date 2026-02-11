import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../../../../tests/mocks/prisma';
import { getServerSessionMock, mockSession } from '../../../../tests/mocks/next-auth';
import { createMockRequest, getResponseJson } from '../../../../tests/helpers/api-helpers';

// Mock push notification module
vi.mock('@/lib/push', () => ({
  sendPushNotification: vi.fn().mockResolvedValue({ ok: true }),
}));

import { GET, POST } from '../route';

// ── Helpers ────────────────────────────────────────────────────────────────

const mockUser = {
  id: 'user-id-123',
  email: 'test@example.com',
  name: 'Test User',
  profileImageUrl: null,
};

const mockFriendUser = {
  id: 'friend-id-456',
  email: 'friend@example.com',
  name: 'Friend User',
  profileImageUrl: null,
};

function makeFriendship(overrides: Record<string, any> = {}) {
  return {
    id: 'friendship-1',
    userId: mockUser.id,
    friendId: mockFriendUser.id,
    status: 'accepted',
    createdAt: new Date('2025-01-01'),
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('GET /api/friends', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if not authenticated', async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const request = createMockRequest('GET', undefined, 'http://localhost:3000/api/friends');
    const response = await GET(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(401);
    expect(json.error).toBe('Non authentifié');
  });

  it('returns 404 if user not found in database', async () => {
    getServerSessionMock.mockResolvedValueOnce(mockSession);
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const request = createMockRequest('GET', undefined, 'http://localhost:3000/api/friends');
    const response = await GET(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json.error).toBe('Utilisateur introuvable');
  });

  it('returns all friendships when no status filter', async () => {
    getServerSessionMock.mockResolvedValueOnce(mockSession);
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);

    const friendship = makeFriendship();
    prismaMock.friend.findMany.mockResolvedValueOnce([friendship]);
    prismaMock.user.findMany.mockResolvedValueOnce([mockFriendUser]);

    const request = createMockRequest('GET', undefined, 'http://localhost:3000/api/friends');
    const response = await GET(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json).toHaveLength(1);
    expect(json[0]).toMatchObject({
      id: 'friendship-1',
      status: 'accepted',
      isReceiver: false,
    });
    expect(json[0].friend).toMatchObject({
      id: mockFriendUser.id,
      name: mockFriendUser.name,
    });
  });

  it('filters friendships by status=pending', async () => {
    getServerSessionMock.mockResolvedValueOnce(mockSession);
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);

    const pendingFriendship = makeFriendship({ status: 'pending' });
    prismaMock.friend.findMany.mockResolvedValueOnce([pendingFriendship]);
    prismaMock.user.findMany.mockResolvedValueOnce([mockFriendUser]);

    const request = createMockRequest(
      'GET',
      undefined,
      'http://localhost:3000/api/friends?status=pending',
    );
    const response = await GET(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json).toHaveLength(1);
    expect(json[0].status).toBe('pending');

    // Verify findMany was called with a status filter
    expect(prismaMock.friend.findMany.toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'pending',
        }),
      }),
    );
  });

  it('correctly sets isReceiver when current user is the friendId', async () => {
    getServerSessionMock.mockResolvedValueOnce(mockSession);
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);

    // Friendship where the current user is the friendId (receiver)
    const receivedFriendship = makeFriendship({
      id: 'friendship-received',
      userId: mockFriendUser.id,
      friendId: mockUser.id,
      status: 'pending',
    });
    prismaMock.friend.findMany.mockResolvedValueOnce([receivedFriendship]);
    prismaMock.user.findMany.mockResolvedValueOnce([mockFriendUser]);

    const request = createMockRequest('GET', undefined, 'http://localhost:3000/api/friends');
    const response = await GET(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(200);
    expect(json).toHaveLength(1);
    expect(json[0].isReceiver).toBe(true);
    expect(json[0].friend).toMatchObject({ id: mockFriendUser.id });
  });
});

describe('POST /api/friends', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if not authenticated', async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const request = createMockRequest('POST', { friendEmail: 'friend@example.com' });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(401);
    expect(json.error).toBe('Non authentifié');
  });

  it('returns 404 if user not found in database', async () => {
    getServerSessionMock.mockResolvedValueOnce(mockSession);
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const request = createMockRequest('POST', { friendEmail: 'friend@example.com' });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json.error).toBe('Utilisateur introuvable');
  });

  it('returns 400 if friendEmail is missing', async () => {
    getServerSessionMock.mockResolvedValueOnce(mockSession);
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);

    const request = createMockRequest('POST', {});
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toBe('Email requis');
  });

  it('returns 404 if friend email not found', async () => {
    getServerSessionMock.mockResolvedValueOnce(mockSession);
    // First call: find current user -> returns mockUser
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);
    // Second call: find friend by email -> returns null
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const request = createMockRequest('POST', { friendEmail: 'unknown@example.com' });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(404);
    expect(json.error).toBe('Utilisateur introuvable');
  });

  it('returns 400 if user tries to add themselves', async () => {
    getServerSessionMock.mockResolvedValueOnce(mockSession);
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);
    // Friend lookup returns the same user
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);

    const request = createMockRequest('POST', { friendEmail: mockUser.email });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toBe('Vous ne pouvez pas vous ajouter vous-même');
  });

  it('returns 400 if friendship already exists', async () => {
    getServerSessionMock.mockResolvedValueOnce(mockSession);
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);
    prismaMock.user.findUnique.mockResolvedValueOnce(mockFriendUser);
    prismaMock.friend.findFirst.mockResolvedValueOnce(makeFriendship());

    const request = createMockRequest('POST', { friendEmail: mockFriendUser.email });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toBe('Une demande existe déjà avec cet utilisateur');
  });

  it('returns 201 and creates a pending friendship', async () => {
    getServerSessionMock.mockResolvedValueOnce(mockSession);
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);
    prismaMock.user.findUnique.mockResolvedValueOnce(mockFriendUser);
    prismaMock.friend.findFirst.mockResolvedValueOnce(null);

    const createdFriendship = makeFriendship({ status: 'pending' });
    prismaMock.friend.create.mockResolvedValueOnce(createdFriendship);

    const request = createMockRequest('POST', { friendEmail: mockFriendUser.email });
    const response = await POST(request as any);
    const json = await getResponseJson(response);

    expect(response.status).toBe(201);
    expect(json).toMatchObject({
      id: 'friendship-1',
      userId: mockUser.id,
      friendId: mockFriendUser.id,
      status: 'pending',
    });
    expect(prismaMock.friend.create.toHaveBeenCalledWith({
      data: {
        userId: mockUser.id,
        friendId: mockFriendUser.id,
        status: 'pending',
      },
    });
  });
});
