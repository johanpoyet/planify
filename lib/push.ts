// Stub d'envoi de notifications push
// Ce fichier évite l'erreur de build si la fonctionnalité de push n'est pas encore
// implémentée ou si les clés VAPID ne sont pas configurées en production.
import webpush from 'web-push';

type PushPayload = {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
};

export async function sendPushNotification(userId: string, payload: PushPayload) {
  // Si l'application n'a pas de stockage des subscriptions, retourner un résultat neutre.
  // Prévenir l'exécution d'un envoi réel lorsque les clés VAPID ne sont pas configurées.
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;

  if (!pub || !priv) {
    console.warn('sendPushNotification: VAPID keys not set — skipping push send');
    return { ok: false, reason: 'vapid_not_configured' };
  }

  // Configurer web-push si les clés existent. Pour l'instant, nous ne disposons
  // pas d'un stockage des subscriptions côté serveur (prisma schema ne le contient pas),
  // donc cette fonction ne tentera pas de récupérer une subscription dans la base.
  try {
    webpush.setVapidDetails(
      `mailto:${process.env.SENDGRID_FROM || 'no-reply@example.com'}`,
      pub,
      priv
    );

    // Aucune implémentation de stockage des subscriptions n'est fournie dans le
    // schéma Prisma actuel. On évite d'envoyer une notification réelle ici.
    console.info(
      `sendPushNotification: VAPID keys present but no subscription store — userId=${userId}`
    );
    return { ok: false, reason: 'no_subscription_store' };
  } catch (error) {
    console.error('sendPushNotification error:', error);
    return { ok: false, reason: 'error', error };
  }
}
