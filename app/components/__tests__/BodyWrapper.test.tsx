import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BodyWrapper from '../BodyWrapper';
import { ThemeProvider } from '@/lib/themeContext';

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

const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
};

describe('BodyWrapper', () => {
  it('should render children without padding when not authenticated', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    mockPathname.mockReturnValue('/events');

    const { container } = renderWithTheme(
      <BodyWrapper>
        <div data-testid="child">Content</div>
      </BodyWrapper>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).not.toHaveClass('pb-20');
    expect(wrapper).not.toHaveClass('md:pt-16');
  });

  it('should render children with padding when authenticated', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '1', email: 'test@example.com' } },
      status: 'authenticated',
    });
    mockPathname.mockReturnValue('/events');

    const { container } = renderWithTheme(
      <BodyWrapper>
        <div data-testid="child">Content</div>
      </BodyWrapper>
    );

    // useEffect est asynchrone, attendre que le state soit mis à jour
    await new Promise(resolve => setTimeout(resolve, 0));

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('pb-20');
    expect(wrapper.className).toContain('md:pb-0');
    expect(wrapper.className).toContain('md:pt-16');
  });

  it('should not add padding on auth pages', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '1', email: 'test@example.com' } },
      status: 'authenticated',
    });
    mockPathname.mockReturnValue('/auth/login');

    const { container } = renderWithTheme(
      <BodyWrapper>
        <div data-testid="child">Content</div>
      </BodyWrapper>
    );

    await new Promise(resolve => setTimeout(resolve, 0));

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).not.toHaveClass('pb-20');
  });
});
