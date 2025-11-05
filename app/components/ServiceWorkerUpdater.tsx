'use client';

import { useEffect } from 'react';

export default function ServiceWorkerUpdater() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Écouter les mises à jour du service worker
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] Nouveau Service Worker actif - rechargement de la page...');
        window.location.reload();
      });

      // Vérifier les mises à jour régulièrement
      const checkForUpdates = async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.update();
        }
      };

      // Vérifier immédiatement
      checkForUpdates();

      // Vérifier toutes les 30 secondes
      const interval = setInterval(checkForUpdates, 30000);

      return () => clearInterval(interval);
    }
  }, []);

  return null;
}
