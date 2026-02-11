import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@/lib/themeContext';
import { ToastProvider } from '@/lib/toastContext';

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider initialColor="blue" initialMode="dark">
      <ToastProvider>
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}
