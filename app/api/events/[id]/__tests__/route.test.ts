import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../../../../../tests/mocks/prisma';
import { getServerSessionMock, mockSession } from '../../../../../tests/mocks/next-auth';
import { createMockRequest, getResponseJson } from '../../../../../tests/helpers/api-helpers';
import { GET, DELETE, PUT } from '../route';

const mockCtx = { params: Promise.resolve({ id: 'event-id-1' }) };
const mockUser = { id: 'user-id-123', email: 'test@example.com', name: 'Test User' };
const mockEvent = {
  id: 'event-id-1',
  title: 'Test Event',
  description: 'Desc',
  date: new Date('2025-06-01'),
  location: 'Paris',
  visibility: 'friends',
  createdById: 'user-id-123',
  eventTypeId: null,
  eventType: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(mockSession);
  prismaMock.user.findUnique.mockResolvedValue(mockUser);
});

// ---------------------------------------------------------------------------
// GET /api/events/[id]
// ---------------------------------------------------------------------------
describe('GET /api/events/[id]', () => {
  it('should return 401 when not authenticated', async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const req = createMockRequest('GET');
    const res = await GET(req as any, mockCtx);
    const json = await getResponseJson(res);

    expect(res.status).toBe(401);
    expect(json.error).toBe('Non authentifié');
  });

  it('should return 404 when event is not found', async () => {
    prismaMock.event.findUnique.mockResolvedValueOnce(null);

    const req = createMockRequest('GET');
    const res = await GET(req as any, mockCtx);
    const json = await getResponseJson(res);

    expect(res.status).toBe(404);
    expect(json.error).toBe('Événement introuvable');
  });

  it('should return the event with eventType included', async () => {
    prismaMock.event.findUnique.mockResolvedValueOnce(mockEvent);

    const req = createMockRequest('GET');
    const res = await GET(req as any, mockCtx);
    const json = await getResponseJson(res);

    expect(res.status).toBe(200);
    expect(json.id).toBe('event-id-1');
    expect(json.title).toBe('Test Event');
    expect(json).toHaveProperty('eventType');
    expect(prismaMock.event.findUnique.toHaveBeenCalledWith({
      where: { id: 'event-id-1' },
      include: { eventType: true },
    });
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/events/[id]
// ---------------------------------------------------------------------------
describe('DELETE /api/events/[id]', () => {
  it('should return 401 when not authenticated', async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const req = createMockRequest('DELETE');
    const res = await DELETE(req as any, mockCtx);
    const json = await getResponseJson(res);

    expect(res.status).toBe(401);
    expect(json.error).toBe('Non authentifié');
  });

  it('should return 404 when user is not found', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const req = createMockRequest('DELETE');
    const res = await DELETE(req as any, mockCtx);
    const json = await getResponseJson(res);

    expect(res.status).toBe(404);
    expect(json.error).toBe('Utilisateur introuvable');
  });

  it('should return 404 when event is not found', async () => {
    prismaMock.event.findUnique.mockResolvedValueOnce(null);

    const req = createMockRequest('DELETE');
    const res = await DELETE(req as any, mockCtx);
    const json = await getResponseJson(res);

    expect(res.status).toBe(404);
    expect(json.error).toBe('Événement introuvable');
  });

  it('should return 403 when user is not the creator', async () => {
    const otherUserEvent = { ...mockEvent, createdById: 'other-user-id' };
    prismaMock.event.findUnique.mockResolvedValueOnce(otherUserEvent);

    const req = createMockRequest('DELETE');
    const res = await DELETE(req as any, mockCtx);
    const json = await getResponseJson(res);

    expect(res.status).toBe(403);
    expect(json.error).toBe('Non autorisé');
  });

  it('should delete the event and return success', async () => {
    prismaMock.event.findUnique.mockResolvedValueOnce(mockEvent);
    prismaMock.event.delete.mockResolvedValueOnce(mockEvent);

    const req = createMockRequest('DELETE');
    const res = await DELETE(req as any, mockCtx);
    const json = await getResponseJson(res);

    expect(res.status).toBe(200);
    expect(json).toEqual({ success: true });
    expect(prismaMock.event.delete.toHaveBeenCalledWith({
      where: { id: 'event-id-1' },
    });
  });
});

// ---------------------------------------------------------------------------
// PUT /api/events/[id]
// ---------------------------------------------------------------------------
describe('PUT /api/events/[id]', () => {
  it('should return 401 when not authenticated', async () => {
    getServerSessionMock.mockResolvedValueOnce(null);

    const req = createMockRequest('PUT', { title: 'Updated' });
    const res = await PUT(req as any, mockCtx);
    const json = await getResponseJson(res);

    expect(res.status).toBe(401);
    expect(json.error).toBe('Non authentifié');
  });

  it('should return 404 when user is not found', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const req = createMockRequest('PUT', { title: 'Updated' });
    const res = await PUT(req as any, mockCtx);
    const json = await getResponseJson(res);

    expect(res.status).toBe(404);
    expect(json.error).toBe('Utilisateur introuvable');
  });

  it('should return 404 when event is not found', async () => {
    prismaMock.event.findUnique.mockResolvedValueOnce(null);

    const req = createMockRequest('PUT', { title: 'Updated' });
    const res = await PUT(req as any, mockCtx);
    const json = await getResponseJson(res);

    expect(res.status).toBe(404);
    expect(json.error).toBe('Événement introuvable');
  });

  it('should return 403 when user is not the creator', async () => {
    const otherUserEvent = { ...mockEvent, createdById: 'other-user-id' };
    prismaMock.event.findUnique.mockResolvedValueOnce(otherUserEvent);

    const req = createMockRequest('PUT', { title: 'Updated' });
    const res = await PUT(req as any, mockCtx);
    const json = await getResponseJson(res);

    expect(res.status).toBe(403);
    expect(json.error).toBe("Vous n'êtes pas autorisé à modifier cet événement");
  });

  it('should partially update the event with only provided fields', async () => {
    prismaMock.event.findUnique.mockResolvedValueOnce(mockEvent);
    const updatedEvent = { ...mockEvent, title: 'New Title' };
    prismaMock.event.update.mockResolvedValueOnce(updatedEvent);

    const req = createMockRequest('PUT', { title: 'New Title' });
    const res = await PUT(req as any, mockCtx);
    const json = await getResponseJson(res);

    expect(res.status).toBe(200);
    expect(json.title).toBe('New Title');
    expect(prismaMock.event.update.toHaveBeenCalledWith({
      where: { id: 'event-id-1' },
      data: { title: 'New Title' },
    });
  });

  it('should set description to null when empty string is provided', async () => {
    prismaMock.event.findUnique.mockResolvedValueOnce(mockEvent);
    const updatedEvent = { ...mockEvent, description: null };
    prismaMock.event.update.mockResolvedValueOnce(updatedEvent);

    const req = createMockRequest('PUT', { description: '' });
    const res = await PUT(req as any, mockCtx);
    const json = await getResponseJson(res);

    expect(res.status).toBe(200);
    expect(json.description).toBeNull();
    expect(prismaMock.event.update.toHaveBeenCalledWith({
      where: { id: 'event-id-1' },
      data: { description: null },
    });
  });
});
