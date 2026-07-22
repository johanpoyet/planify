import { vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';

// Helper to cast to mocked function
export const mockFn = vi.fn;

// Create a properly mocked PrismaClient.
// Le type est volontairement inféré (et non casté en PrismaClient) afin que les
// helpers de mock (mockResolvedValue, mockRejectedValue...) restent visibles dans les tests.
export const prismaMock = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    upsert: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  event: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    upsert: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  eventType: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    upsert: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  eventParticipant: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    upsert: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  friend: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    upsert: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  pushSubscription: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    upsert: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  poll: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    upsert: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  pollOption: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    upsert: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  pollVote: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    upsert: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  notification: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    upsert: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn((callback: (client: unknown) => unknown) => callback(prismaMock)),
};

// Le cast vers PrismaClient n'est appliqué qu'au point d'injection dans le module mocké.
const prismaMockAsClient = prismaMock as unknown as PrismaClient;

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMockAsClient,
  default: prismaMockAsClient,
  prismaMock, // Export prismaMock for direct access in tests
}));

