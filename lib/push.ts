// Envoi de notifications push
import webpush from 'web-push';
import { prisma } from './prisma';

type PushPayload = {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
};

// Initialiser web-push avec les clés VAPID
function initializeWebPush() {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;

  if (!pub || !priv) {
    return false;
  }

  webpush.setVapidDetails(
    `mailto:${process.env.SENDGRID_FROM || 'no-reply@planify.app'}`,
    pub,
    priv
  );

  return true;
}

export async function sendPushNotification(userId: string, payload: PushPayload) {
  // Vérifier la configuration VAPID
  if (!initializeWebPush()) {
    console.warn('sendPushNotification: VAPID keys not set — skipping push send');
    return { ok: false, reason: 'vapid_not_configured' };
  }

  try {
    // Récupérer toutes les subscriptions de l'utilisateur
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return { ok: false, reason: 'no_subscriptions' };
    }

    // Préparer le payload de notification
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body || '',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      data: {
        url: payload.url || '/',
      },
      tag: payload.tag || 'planify-notification',
    });

    // Envoyer à toutes les subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          await webpush.sendNotification(pushSubscription, notificationPayload);
          return { success: true, subscriptionId: sub.id };
        } catch (error: any) {
          console.error(`Error sending to subscription ${sub.id}:`, error);
          
          // Si la subscription est invalide (410 Gone), la supprimer
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.pushSubscription.delete({
              where: { id: sub.id },
            }).catch(err => console.error('Error deleting invalid subscription:', err));
          }
          
          throw error;
        }
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;

    return {
      ok: successCount > 0,
      successCount,
      failureCount,
      totalSubscriptions: subscriptions.length,
    };
  } catch (error) {
    console.error('sendPushNotification error:', error);
    return { ok: false, reason: 'error', error };
  }
}
