import { expect } from 'vitest';
import { getServerSessionMock } from '../mocks/next-auth';
import { prismaMock } from '../mocks/prisma';
import { createMockRequest, getResponseJson } from './api-helpers';

/**
 * Tests d'authentification reutilisables pour les API routes
 * Utilisation: appeler dans un describe() avec le handler et la methode HTTP
 */
export function testAuthRequired(
  handler: (req: Request, ctx?: any) => Promise<Response>,
  method: string = 'GET',
  body?: any,
  ctx?: any
) {
  it('retourne 401 si non authentifie', async () => {
    getServerSessionMock.mockResolvedValueOnce(null);
    const req = createMockRequest(method, body);
    const res = ctx ? await handler(req, ctx) : await handler(req);
    expect(res.status).toBe(401);
  });

  it('retourne 404 si utilisateur introuvable en base', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    const req = createMockRequest(method, body);
    const res = ctx ? await handler(req, ctx) : await handler(req);
    expect(res.status).toBe(404);
  });
}
