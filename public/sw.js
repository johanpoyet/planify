// Service Worker pour Planify
const CACHE_NAME = 'planify-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation du Service Worker');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Mise en cache des assets statiques');
      return cache.addAll(STATIC_CACHE_URLS).catch((err) => {
        console.error('[SW] Erreur lors de la mise en cache:', err);
      });
    })
  );
  // Force le nouveau SW à devenir actif immédiatement
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation du Service Worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Prend le contrôle de tous les clients immédiatement
  return self.clients.claim();
});

// Stratégie de gestion des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore les requêtes non-HTTP (chrome-extension://, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Stratégie: Network First pour les API, Cache First pour les assets
  if (url.pathname.startsWith('/api/')) {
    // Pour les API: toujours essayer le réseau en premier
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch((err) => {
          console.log('[SW] API non disponible:', url.pathname);
          return new Response(
            JSON.stringify({ error: 'Vous êtes hors ligne' }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
    );
  } else {
    // Pour les assets: Cache First, Network Fallback
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          // Cache les nouvelles ressources récupérées
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        });
      })
    );
  }
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
  console.log('[SW] Push event reçu:', event);
  
  let notificationData = {
    title: 'Planify',
    body: 'Nouvelle notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
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
        data: data.data || {},
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
      tag: 'planify-notification',
      requireInteraction: false,
    })
  );
});

// Gestion du clic sur la notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification cliquée:', event);
  
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si une fenêtre est déjà ouverte, la mettre au premier plan
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if ('focus' in client) {
            return client.focus();
          }
        }
        // Sinon, ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});
