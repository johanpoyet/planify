import { vi } from 'vitest';

export const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  forward: vi.fn(),
};

export const mockPathname = vi.fn(() => '/events');
export const mockSearchParams = vi.fn(() => new URLSearchParams());

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: mockPathname,
  useSearchParams: mockSearchParams,
}));
