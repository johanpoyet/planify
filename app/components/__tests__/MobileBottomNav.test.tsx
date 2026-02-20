import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MobileBottomNav from '../MobileBottomNav';
import { ThemeProvider } from '@/lib/themeContext';

// Mock next/navigation
const mockPathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

// Mock hooks
vi.mock('@/lib/useFriendRequests', () => ({
  useFriendRequests: vi.fn(() => ({ pendingCount: 0 })),
}));

vi.mock('@/lib/useEventInvitations', () => ({
  useEventInvitations: vi.fn(() => ({ invitationsCount: 0 })),
}));

// Mock Link component
vi.mock('next/link', () => ({
  default: ({ href, children, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
};

describe('MobileBottomNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue('/events');
  });

  it('should render all navigation items', () => {
    renderWithTheme(<MobileBottomNav />);

    expect(screen.getByText('Accueil')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Nouveau')).toBeInTheDocument();
    expect(screen.getByText('Amis')).toBeInTheDocument();
    expect(screen.getByText('Paramètres')).toBeInTheDocument();
  });

  it('should highlight active navigation item', () => {
    mockPathname.mockReturnValue('/friends');

    renderWithTheme(<MobileBottomNav />);

    const friendsLink = screen.getByText('Amis');
    expect(friendsLink).toBeInTheDocument();
    
    // Le parent du label devrait avoir scale-110 quand actif
    const parentDiv = friendsLink.closest('div');
    expect(parentDiv?.previousSibling).toHaveClass('scale-110');
  });

  it('should show friend requests badge when pendingCount > 0', async () => {
    const { useFriendRequests } = await import('@/lib/useFriendRequests');
    (useFriendRequests as any).mockReturnValue({ pendingCount: 3 });

    renderWithTheme(<MobileBottomNav />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should show event invitations badge when invitationsCount > 0', async () => {
    const { useEventInvitations } = await import('@/lib/useEventInvitations');
    (useEventInvitations as any).mockReturnValue({ invitationsCount: 5 });

    renderWithTheme(<MobileBottomNav />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should display "9+" when badge count exceeds 9', async () => {
    const { useFriendRequests } = await import('@/lib/useFriendRequests');
    (useFriendRequests as any).mockReturnValue({ pendingCount: 15 });

    renderWithTheme(<MobileBottomNav />);

    expect(screen.getByText('9+')).toBeInTheDocument();
  });
});
