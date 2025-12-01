// Service Worker minimaliste pour Planify
// Ce SW gère UNIQUEMENT les notifications push - AUCUN cache

console.log('[SW] Service Worker Planify chargé');

// Installation : activation immédiate sans cache
self.addEventListener('install', (event) => {
  console.log('[SW] Installation du Service Worker (sans cache)');
  self.skipWaiting();
});

// Activation : nettoyage de tous les anciens caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation du Service Worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Supprimer TOUS les caches existants
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] Suppression du cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[SW] Tous les caches ont été supprimés');
      return self.clients.claim();
    })
  );
});

// PAS d'interception des requêtes fetch - le navigateur gère tout normalement

// Gestion des notifications push
self.addEventListener('push', (event) => {
  console.log('[SW] Push event reçu:', event);
  
  let notificationData = {
    title: 'Planify',
    body: 'Nouvelle notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    data: { url: '/' },
  };

  // Si des données sont envoyées avec le push
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        data: data.data || { url: '/' },
        tag: data.tag || 'planify-notification',
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      tag: notificationData.tag || 'planify-notification',
      requireInteraction: false,
    })
  );
});

// Gestion du clic sur la notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification cliquée:', event);
  
  event.notification.close();

  // Récupérer l'URL de la notification
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Chercher une fenêtre déjà ouverte avec la bonne URL
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Si une fenêtre est ouverte, naviguer vers l'URL
        for (const client of clientList) {
          if ('focus' in client && 'navigate' in client) {
            client.focus();
            return client.navigate(urlToOpen);
          }
        }
        
        // Sinon, ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
