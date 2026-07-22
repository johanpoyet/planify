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
  // Toutes les props sont transmises (style, aria-*, ...) afin que le mock
  // reflète le rendu réel du composant Link.
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
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

    expect(screen.getByText('Agenda')).toBeInTheDocument();
    expect(screen.getByText('Amis')).toBeInTheDocument();
    expect(screen.getByText('Sondages')).toBeInTheDocument();
    expect(screen.getByText('Profil')).toBeInTheDocument();
    // Le bouton central n'affiche qu'une icône : son nom accessible provient
    // d'un aria-label, sans lequel il serait annoncé « lien » sans intitulé.
    expect(screen.getByRole('link', { name: 'Créer' })).toBeInTheDocument();
  });

  it('should highlight active navigation item', () => {
    mockPathname.mockReturnValue('/friends');

    renderWithTheme(<MobileBottomNav />);

    // L'élément actif se distingue par sa couleur de texte : pleine si actif,
    // atténuée sinon.
    const activeLink = screen.getByText('Amis').closest('a') as HTMLElement;
    expect(activeLink.style.color).toBe('var(--pf-text)');

    const inactiveLink = screen.getByText('Agenda').closest('a') as HTMLElement;
    expect(inactiveLink.style.color).toBe('var(--pf-text-muted)');
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
