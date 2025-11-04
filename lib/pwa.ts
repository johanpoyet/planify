// Utilitaires pour la Progressive Web App

/**
 * Vérifie si l'application tourne en mode standalone (installée)
 */
export function isStandalone(): boolean {
  if (typeof globalThis.window === 'undefined') return false;
  
  return (
    globalThis.matchMedia('(display-mode: standalone)').matches ||
    (globalThis.navigator as any).standalone ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Vérifie si le service worker est supporté
 */
export function isServiceWorkerSupported(): boolean {
  return typeof globalThis.window !== 'undefined' && 'serviceWorker' in navigator;
}

/**
 * Enregistre le service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    console.log('Service Worker non supporté');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker enregistré:', registration);
    return registration;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du Service Worker:', error);
    return null;
  }
}

/**
 * Désenregistre le service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const success = await registration.unregister();
    console.log('Service Worker désenregistré:', success);
    return success;
  } catch (error) {
    console.error('Erreur lors du désenregistrement du Service Worker:', error);
    return false;
  }
}

/**
 * Vérifie si les notifications sont supportées
 */
export function areNotificationsSupported(): boolean {
  return typeof globalThis !== 'undefined' && 'Notification' in globalThis;
}

/**
 * Demande la permission pour les notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  console.log('🔍 Vérification du support des notifications...');
  
  if (!areNotificationsSupported()) {
    console.warn('⚠️ Les notifications ne sont pas supportées');
    return 'denied';
  }

  console.log('✅ Notifications supportées, demande de permission...');

  try {
    const permission = await Notification.requestPermission();
    console.log('📋 Permission de notification reçue:', permission);
    return permission;
  } catch (error) {
    console.error('❌ Erreur lors de la demande de permission:', error);
    return 'denied';
  }
}

/**
 * Envoie une notification locale
 */
export async function sendLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!areNotificationsSupported()) {
    console.log('Les notifications ne sont pas supportées');
    return;
  }

  const permission = await requestNotificationPermission();
  
  if (permission !== 'granted') {
    console.log('Permission de notification refusée');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: 'planify-notification',
      requireInteraction: false,
      ...options,
    });
    
    console.log('Notification envoyée:', title);
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification:', error);
  }
}

/**
 * Obtient le statut de la permission de notification
 */
export function getNotificationPermission(): NotificationPermission {
  if (!areNotificationsSupported()) {
    return 'denied';
  }
  return Notification.permission;
}
