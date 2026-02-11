import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isStandalone,
  isServiceWorkerSupported,
  registerServiceWorker,
  unregisterServiceWorker,
  areNotificationsSupported,
  requestNotificationPermission,
  sendLocalNotification,
  getNotificationPermission,
} from '../pwa';

describe('pwa.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isStandalone', () => {
    it('devrait retourner false si window n\'existe pas', () => {
      const result = isStandalone();
      expect(result).toBe(false);
    });

    it('devrait retourner true si l\'app est en standalone', () => {
      const mockMatchMedia = vi.fn(() => ({
        matches: true,
        media: '(display-mode: standalone)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      globalThis.matchMedia = mockMatchMedia as any;

      const result = isStandalone();
      expect(result).toBe(true);
    });
  });

  describe('isServiceWorkerSupported', () => {
    it('devrait retourner true si service worker est supporté', () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {},
        configurable: true,
      });

      const result = isServiceWorkerSupported();
      expect(result).toBe(true);
    });
  });

  describe('registerServiceWorker', () => {
    it('devrait retourner null si service worker non supporté', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        configurable: true,
      });

      const result = await registerServiceWorker();
      expect(result).toBeNull();
    });

    it('devrait enregistrer le service worker', async () => {
      const mockRegistration = { scope: '/test' };
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: vi.fn().mockResolvedValue(mockRegistration),
        },
        configurable: true,
      });

      const result = await registerServiceWorker();
      expect(result).toEqual(mockRegistration);
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
    });

    it('devrait gérer les erreurs d\'enregistrement', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: vi.fn().mockRejectedValue(new Error('Registration failed')),
        },
        configurable: true,
      });

      const result = await registerServiceWorker();
      expect(result).toBeNull();
    });
  });

  describe('unregisterServiceWorker', () => {
    it('devrait retourner false si service worker non supporté', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        configurable: true,
      });

      const result = await unregisterServiceWorker();
      expect(result).toBe(false);
    });

    it('devrait désenregistrer le service worker', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve({
            unregister: vi.fn().mockResolvedValue(true),
          }),
        },
        configurable: true,
      });

      const result = await unregisterServiceWorker();
      expect(result).toBe(true);
    });
  });

  describe('areNotificationsSupported', () => {
    it('devrait retourner true si Notification existe', () => {
      (globalThis as any).Notification = class {};
      const result = areNotificationsSupported();
      expect(result).toBe(true);
    });
  });

  describe('requestNotificationPermission', () => {
    it('devrait retourner denied si notifications non supportées', async () => {
      delete (globalThis as any).Notification;

      const result = await requestNotificationPermission();
      expect(result).toBe('denied');
    });

    it('devrait demander la permission', async () => {
      (globalThis as any).Notification = {
        requestPermission: vi.fn().mockResolvedValue('granted'),
        permission: 'default',
      };

      const result = await requestNotificationPermission();
      expect(result).toBe('granted');
    });

    it('devrait gérer les erreurs de permission', async () => {
      (globalThis as any).Notification = {
        requestPermission: vi.fn().mockRejectedValue(new Error('Permission error')),
        permission: 'default',
      };

      const result = await requestNotificationPermission();
      expect(result).toBe('denied');
    });
  });

  describe('sendLocalNotification', () => {
    it('ne devrait rien faire si notifications non supportées', async () => {
      delete (globalThis as any).Notification;

      await sendLocalNotification('Test');
      // Pas d'erreur lancée
    });

    it('devrait envoyer une notification si permission accordée', async () => {
      const mockShowNotification = vi.fn();
      (globalThis as any).Notification = {
        requestPermission: vi.fn().mockResolvedValue('granted'),
        permission: 'granted',
      };

      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve({
            showNotification: mockShowNotification,
          }),
        },
        configurable: true,
      });

      await sendLocalNotification('Test Title', { body: 'Test Body' });
      expect(mockShowNotification).toHaveBeenCalledWith('Test Title', expect.any(Object));
    });
  });

  describe('getNotificationPermission', () => {
    it('devrait retourner denied si notifications non supportées', () => {
      delete (globalThis as any).Notification;

      const result = getNotificationPermission();
      expect(result).toBe('denied');
    });

    it('devrait retourner le statut de permission', () => {
      (globalThis as any).Notification = {
        permission: 'granted',
      };

      const result = getNotificationPermission();
      expect(result).toBe('granted');
    });
  });
});
