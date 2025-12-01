'use client';

import { useEffect } from 'react';

export default function CacheBuster() {
  useEffect(() => {
    // Force le rechargement du CSS si nécessaire
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Vérifier si on doit forcer le rechargement
      const lastClearCache = localStorage.getItem('lastClearCache');
      const currentVersion = 'v3'; // Incrémenter cette valeur après chaque mise à jour CSS
      
      if (lastClearCache !== currentVersion) {
        console.log('[Cache] Nettoyage du cache pour la version:', currentVersion);
        caches.keys().then(keys => {
          keys.forEach(key => caches.delete(key));
        });
        localStorage.setItem('lastClearCache', currentVersion);
        // Recharger la page une seule fois
        if (!sessionStorage.getItem('reloaded')) {
          sessionStorage.setItem('reloaded', '1');
          window.location.reload();
        }
      }
    }
  }, []);

  return null;
}
