import { TEST_IDS } from '@/tests/helpers/objectid-helper';
import { setupDefaultMocks } from '@/tests/helpers/test-helpers';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../../../../../tests/mocks/prisma';
import { createMockRequest, getResponseJson } from '../../../../../tests/helpers/api-helpers';

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed-password'), compare: vi.fn() },
}));

import { POST } from '../route';

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it('returns 400 when email is missing', async () => {
    const request = createMockRequest('POST', { password: 'validpass123' });

    const response = await POST(request);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toBe('Email et mot de passe requis');
  });

  it('returns 400 when password is missing', async () => {
    const request = createMockRequest('POST', { email: 'test@example.com' });

    const response = await POST(request);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toBe('Email et mot de passe requis');
  });

  it('returns 400 when password is shorter than 6 characters', async () => {
    const request = createMockRequest('POST', {
      email: 'test@example.com',
      password: '12345',
    });

    const response = await POST(request);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toBe('Le mot de passe doit contenir au moins 6 caractères');
  });

  it('returns 400 when email already exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'existing-user-id',
      email: 'test@example.com',
      password: 'hashed',
      name: 'Existing User',
    });

    const request = createMockRequest('POST', {
      email: 'test@example.com',
      password: 'validpass123',
    });

    const response = await POST(request);
    const json = await getResponseJson(response);

    expect(response.status).toBe(400);
    expect(json.error).toBe('Un compte avec cet email existe déjà');
    expect(prismaMock.user.findUnique)).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    });
  });

  it('returns 201 and creates user successfully', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 'new-user-id',
      email: 'test@example.com',
      password: 'hashed-password',
      name: 'Test User',
    });

    const request = createMockRequest('POST', {
      email: 'test@example.com',
      password: 'validpass123',
      name: 'Test User',
    });

    const response = await POST(request);
    const json = await getResponseJson(response);

    expect(response.status).toBe(201);
    expect(json.message).toBe('Compte créé avec succès');
    expect(json.user).toEqual({
      id: 'new-user-id',
      email: 'test@example.com',
      name: 'Test User',
    });
    // Password must NOT be in the response
    expect(json.user.password).toBeUndefined();
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    });
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
      },
    });
  });

  it('returns 500 on database error', async () => {
    prismaMock.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

    const request = createMockRequest('POST', {
      email: 'test@example.com',
      password: 'validpass123',
    });

    const response = await POST(request);
    const json = await getResponseJson(response);

    expect(response.status).toBe(500);
    expect(json.error).toBe('Erreur lors de la création du compte');
  });
});
