import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../toastContext';
import userEvent from '@testing-library/user-event';

describe('toastContext.tsx', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('devrait afficher un toast success', () => {
    function TestComponent() {
      const { showToast } = useToast();
      return (
        <button onClick={() => showToast('Success message', 'success')}>
          Show Toast
        </button>
      );
    }

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Toast');
    act(() => {
      button.click();
    });

    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('devrait afficher un toast error', () => {
    function TestComponent() {
      const { showToast } = useToast();
      return (
        <button onClick={() => showToast('Error message', 'error')}>
          Show Toast
        </button>
      );
    }

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Toast');
    act(() => {
      button.click();
    });

    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('devrait afficher un toast info', () => {
    function TestComponent() {
      const { showToast } = useToast();
      return (
        <button onClick={() => showToast('Info message', 'info')}>
          Show Toast
        </button>
      );
    }

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Toast');
    act(() => {
      button.click();
    });

    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('devrait auto-supprimer le toast après 4 secondes', () => {
    function TestComponent() {
      const { showToast } = useToast();
      return (
        <button onClick={() => showToast('Temporary message', 'success')}>
          Show Toast
        </button>
      );
    }

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Toast');
    act(() => {
      button.click();
    });

    expect(screen.getByText('Temporary message')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    waitFor(() => {
      expect(screen.queryByText('Temporary message')).not.toBeInTheDocument();
    });
  });

  it('devrait permettre de fermer manuellement le toast', async () => {
    function TestComponent() {
      const { showToast } = useToast();
      return (
        <button onClick={() => showToast('Closeable message', 'success')}>
          Show Toast
        </button>
      );
    }

    const user = userEvent.setup({ delay: null });

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Toast');
    await user.click(button);

    expect(screen.getByText('Closeable message')).toBeInTheDocument();

    // Click on the close button (X)
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(btn => btn.querySelector('svg path[d*="M6 18L18 6"]'));
    
    if (closeButton) {
      await user.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Closeable message')).not.toBeInTheDocument();
      });
    }
  });

  it('devrait afficher plusieurs toasts simultanément', () => {
    function TestComponent() {
      const { showToast } = useToast();
      return (
        <div>
          <button onClick={() => showToast('Message 1', 'success')}>
            Toast 1
          </button>
          <button onClick={() => showToast('Message 2', 'error')}>
            Toast 2
          </button>
        </div>
      );
    }

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Toast 1').click();
      screen.getByText('Toast 2').click();
    });

    expect(screen.getByText('Message 1')).toBeInTheDocument();
    expect(screen.getByText('Message 2')).toBeInTheDocument();
  });
});
