import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePushNotifications } from '../usePushNotifications';

// Mock fetch
global.fetch = vi.fn();

// Mock navigator.serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  configurable: true,
  value: {
    ready: Promise.resolve({}),
  },
});

// Mock window.PushManager
Object.defineProperty(window, 'PushManager', {
  writable: true,
  configurable: true,
  value: class PushManager {},
});

describe('usePushNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset navigator.serviceWorker mock
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      configurable: true,
      value: {
        ready: Promise.resolve({}),
      },
    });
  });

  it('should detect when push notifications are not supported', async () => {
    // Supprimer PushManager temporairement
    const originalPushManager = window.PushManager;
    // @ts-ignore
    delete window.PushManager;

    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isSupported).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    // Restaurer PushManager
    window.PushManager = originalPushManager;
  });

  it('should detect existing subscription and verify it with API', async () => {
    const mockSubscription = {
      endpoint: 'https://push.example.com/123',
      unsubscribe: vi.fn().mockResolvedValue(true),
    };

    const mockRegistration = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(mockSubscription),
        subscribe: vi.fn(),
      },
    };

    navigator.serviceWorker.ready = Promise.resolve(mockRegistration as any);

    (global.fetch as any).mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue({ exists: true }),
    });

    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isSupported).toBe(true);
      expect(result.current.isSubscribed).toBe(true);
      expect(result.current.subscription).toBe(mockSubscription);
      expect(result.current.isLoading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/push/check-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: 'https://push.example.com/123',
      }),
    });
  });

  it('should clean up local subscription if not found in database', async () => {
    const mockSubscription = {
      endpoint: 'https://push.example.com/orphan',
      unsubscribe: vi.fn().mockResolvedValue(true),
    };

    const mockRegistration = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(mockSubscription),
      },
    };

    navigator.serviceWorker.ready = Promise.resolve(mockRegistration as any);

    (global.fetch as any).mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue({ exists: false }),
    });

    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isSubscribed).toBe(false);
      expect(result.current.subscription).toBeNull();
      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });
  });

  it('should subscribe to push notifications successfully', async () => {
    const mockSubscription = {
      endpoint: 'https://push.example.com/new',
      toJSON: vi.fn().mockReturnValue({ endpoint: 'https://push.example.com/new', keys: {} }),
      unsubscribe: vi.fn(),
    };

    const mockRegistration = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(null),
        subscribe: vi.fn().mockResolvedValue(mockSubscription),
      },
    };

    navigator.serviceWorker.ready = Promise.resolve(mockRegistration as any);

    // Mock Notification.requestPermission
    global.Notification = {
      requestPermission: vi.fn().mockResolvedValue('granted'),
    } as any;

    // Mock VAPID key fetch
    (global.fetch as any)
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({ publicKey: 'test-vapid-key' }),
      })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({ success: true }),
      });

    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const success = await result.current.subscribe();

    expect(success).toBe(true);
    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.subscription).toBe(mockSubscription);
    expect(global.fetch).toHaveBeenCalledWith('/api/push/vapid-public-key');
    expect(global.fetch).toHaveBeenCalledWith('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: mockSubscription.toJSON(),
      }),
    });
  });

  it('should return false when subscription fails (permission denied)', async () => {
    const mockRegistration = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(null),
      },
    };

    navigator.serviceWorker.ready = Promise.resolve(mockRegistration as any);

    global.Notification = {
      requestPermission: vi.fn().mockResolvedValue('denied'),
    } as any;

    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const success = await result.current.subscribe();

    expect(success).toBe(false);
    expect(result.current.isSubscribed).toBe(false);
  });

  it('should unsubscribe successfully', async () => {
    const mockSubscription = {
      endpoint: 'https://push.example.com/123',
      unsubscribe: vi.fn().mockResolvedValue(true),
    };

    const mockRegistration = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(mockSubscription),
      },
    };

    navigator.serviceWorker.ready = Promise.resolve(mockRegistration as any);

    (global.fetch as any)
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({ exists: true }),
      })
      .mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({ success: true }),
      });

    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isSubscribed).toBe(true);
    });

    const success = await result.current.unsubscribe();

    expect(success).toBe(true);
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.subscription).toBeNull();
    expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith('/api/push/subscribe', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: 'https://push.example.com/123',
      }),
    });
  });

  it('should handle errors during subscription check gracefully', async () => {
    const mockRegistration = {
      pushManager: {
        getSubscription: vi.fn().mockRejectedValue(new Error('Service Worker error')),
      },
    };

    navigator.serviceWorker.ready = Promise.resolve(mockRegistration as any);

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSubscribed).toBe(false);
    });

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
