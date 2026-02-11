import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../themeContext';
import userEvent from '@testing-library/user-event';

global.fetch = vi.fn();

describe('themeContext.tsx', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as any);
  });

  it('devrait fournir la couleur de thème par défaut', () => {
    function TestComponent() {
      const { themeColor } = useTheme();
      return <div>{themeColor}</div>;
    }

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByText('blue')).toBeInTheDocument();
  });

  it('devrait utiliser la couleur initiale fournie', () => {
    function TestComponent() {
      const { themeColor } = useTheme();
      return <div>{themeColor}</div>;
    }

    render(
      <ThemeProvider initialColor="purple">
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByText('purple')).toBeInTheDocument();
  });

  it('devrait utiliser le mode initial fourni', () => {
    function TestComponent() {
      const { themeMode } = useTheme();
      return <div>{themeMode}</div>;
    }

    render(
      <ThemeProvider initialMode="light">
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByText('light')).toBeInTheDocument();
  });

  it('devrait permettre de changer la couleur de thème', async () => {
    function TestComponent() {
      const { themeColor, setThemeColor } = useTheme();
      return (
        <div>
          <span data-testid="color">{themeColor}</span>
          <button onClick={() => setThemeColor('emerald')}>Change</button>
        </div>
      );
    }

    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const button = screen.getByText('Change');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('color')).toHaveTextContent('emerald');
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/user/theme',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ themeColor: 'emerald' }),
      })
    );
  });

  it('devrait permettre de changer le mode de thème', async () => {
    function TestComponent() {
      const { themeMode, setThemeMode } = useTheme();
      return (
        <div>
          <span data-testid="mode">{themeMode}</span>
          <button onClick={() => setThemeMode('light')}>Change</button>
        </div>
      );
    }

    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const button = screen.getByText('Change');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('mode')).toHaveTextContent('light');
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/user/theme-mode',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ themeMode: 'light' }),
      })
    );
  });

  it('devrait appliquer les variables CSS sur document.documentElement', () => {
    render(
      <ThemeProvider initialColor="purple">
        <div>Content</div>
      </ThemeProvider>
    );

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--color-primary')).toBeTruthy();
    expect(root.getAttribute('data-theme')).toBe('purple');
    expect(root.getAttribute('data-mode')).toBe('dark');
  });

  it('devrait appliquer les classes au body selon le mode', () => {
    const { rerender } = render(
      <ThemeProvider initialMode="dark">
        <div>Content</div>
      </ThemeProvider>
    );

    expect(document.body.classList.contains('dark-mode')).toBe(true);

    rerender(
      <ThemeProvider initialMode="light">
        <div>Content</div>
      </ThemeProvider>
    );

    waitFor(() => {
      expect(document.body.classList.contains('light-mode')).toBe(true);
    });
  });

  it('devrait lancer une erreur si useTheme est utilisé hors du provider', () => {
    function TestComponent() {
      useTheme();
      return <div>Test</div>;
    }

    expect(() => render(<TestComponent />)).toThrow(
      'useTheme must be used within a ThemeProvider'
    );
  });
});
