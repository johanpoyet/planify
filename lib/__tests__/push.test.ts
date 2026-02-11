import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendPushNotification } from '../push';
import { prisma } from '../prisma';
import * as webpush from 'web-push';

vi.mock('../prisma');
vi.mock('web-push');

describe('push.ts - sendPushNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.VAPID_PUBLIC_KEY = 'test-public-key';
    process.env.VAPID_PRIVATE_KEY = 'test-private-key';
  });

  it('devrait retourner vapid_not_configured si VAPID keys manquantes', async () => {
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;

    const result = await sendPushNotification('user1', {
      title: 'Test',
      body: 'Test body',
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('vapid_not_configured');
  });

  it('devrait retourner no_subscriptions si aucune subscription', async () => {
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([]);

    const result = await sendPushNotification('user1', {
      title: 'Test',
      body: 'Test body',
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('no_subscriptions');
  });

  it('devrait envoyer une notification à toutes les subscriptions', async () => {
    const mockSubscriptions = [
      {
        id: 'sub1',
        userId: 'user1',
        endpoint: 'https://push1.example.com',
        p256dh: 'key1',
        auth: 'auth1',
      },
      {
        id: 'sub2',
        userId: 'user1',
        endpoint: 'https://push2.example.com',
        p256dh: 'key2',
        auth: 'auth2',
      },
    ];

    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue(mockSubscriptions as any);
    vi.mocked(webpush.sendNotification).mockResolvedValue({} as any);

    const result = await sendPushNotification('user1', {
      title: 'Test',
      body: 'Test body',
      url: '/test',
      tag: 'test-tag',
    });

    expect(result.ok).toBe(true);
    expect(result.successCount).toBe(2);
    expect(result.failureCount).toBe(0);
    expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
  });

  it('devrait supprimer les subscriptions invalides (410/404)', async () => {
    const mockSubscriptions = [
      {
        id: 'sub1',
        userId: 'user1',
        endpoint: 'https://push1.example.com',
        p256dh: 'key1',
        auth: 'auth1',
      },
    ];

    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue(mockSubscriptions as any);
    vi.mocked(webpush.sendNotification).mockRejectedValue({ statusCode: 410 });
    vi.mocked(prisma.pushSubscription.delete).mockResolvedValue({} as any);

    const result = await sendPushNotification('user1', {
      title: 'Test',
      body: 'Test body',
    });

    expect(result.ok).toBe(false);
    expect(result.failureCount).toBe(1);
    expect(prisma.pushSubscription.delete).toHaveBeenCalledWith({
      where: { id: 'sub1' },
    });
  });

  it('devrait gérer les erreurs lors de l\'envoi', async () => {
    const mockSubscriptions = [
      {
        id: 'sub1',
        userId: 'user1',
        endpoint: 'https://push1.example.com',
        p256dh: 'key1',
        auth: 'auth1',
      },
      {
        id: 'sub2',
        userId: 'user1',
        endpoint: 'https://push2.example.com',
        p256dh: 'key2',
        auth: 'auth2',
      },
    ];

    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue(mockSubscriptions as any);
    vi.mocked(webpush.sendNotification)
      .mockResolvedValueOnce({} as any)
      .mockRejectedValueOnce(new Error('Network error'));

    const result = await sendPushNotification('user1', {
      title: 'Test',
      body: 'Test body',
    });

    expect(result.ok).toBe(true);
    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(1);
  });

  it('devrait appeler setVapidDetails avec les bonnes valeurs', async () => {
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([]);

    await sendPushNotification('user1', {
      title: 'Test',
    });

    expect(webpush.setVapidDetails).toHaveBeenCalledWith(
      expect.stringContaining('mailto:'),
      'test-public-key',
      'test-private-key'
    );
  });

  it('devrait créer le payload avec les bonnes données', async () => {
    const mockSubscriptions = [
      {
        id: 'sub1',
        userId: 'user1',
        endpoint: 'https://push1.example.com',
        p256dh: 'key1',
        auth: 'auth1',
      },
    ];

    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue(mockSubscriptions as any);
    vi.mocked(webpush.sendNotification).mockResolvedValue({} as any);

    await sendPushNotification('user1', {
      title: 'Test Title',
      body: 'Test Body',
      url: '/events/123',
      tag: 'event-123',
    });

    const callArgs = vi.mocked(webpush.sendNotification).mock.calls[0];
    const payload = JSON.parse(callArgs[1] as string);

    expect(payload.title).toBe('Test Title');
    expect(payload.body).toBe('Test Body');
    expect(payload.data.url).toBe('/events/123');
    expect(payload.tag).toBe('event-123');
  });
});
