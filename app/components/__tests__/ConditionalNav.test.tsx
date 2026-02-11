import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConditionalNav from '../ConditionalNav';

// Mock next-auth
const mockUseSession = vi.fn();
vi.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}));

// Mock next/navigation
const mockPathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

// Mock MobileBottomNav
vi.mock('../MobileBottomNav', () => ({
  default: () => <div data-testid="mobile-bottom-nav">MobileBottomNav</div>,
}));

describe('ConditionalNav', () => {
  it('should not render when session is loading', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' });
    mockPathname.mockReturnValue('/events');

    const { container } = render(<ConditionalNav />);

    expect(container.firstChild).toBeNull();
  });

  it('should not render when user is not authenticated', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    mockPathname.mockReturnValue('/events');

    const { container } = render(<ConditionalNav />);

    expect(container.firstChild).toBeNull();
  });

  it('should not render on auth pages', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '1', email: 'test@example.com' } },
      status: 'authenticated',
    });
    mockPathname.mockReturnValue('/auth/login');

    const { container } = render(<ConditionalNav />);

    expect(container.firstChild).toBeNull();
  });

  it('should render MobileBottomNav when authenticated and not on auth page', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '1', email: 'test@example.com' } },
      status: 'authenticated',
    });
    mockPathname.mockReturnValue('/events');

    render(<ConditionalNav />);

    expect(screen.getByTestId('mobile-bottom-nav')).toBeInTheDocument();
  });
});
