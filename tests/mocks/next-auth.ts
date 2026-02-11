import { vi } from 'vitest';
import React from 'react';

export const mockSession = {
  user: {
    id: 'user-id-123',
    email: 'test@example.com',
    name: 'Test User',
  },
  expires: '2099-01-01',
};

export const getServerSessionMock = vi.fn().mockResolvedValue(mockSession);

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: getServerSessionMock,
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ data: mockSession, status: 'authenticated' })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
