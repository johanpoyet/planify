'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PWATestPage() {
  const [pwaInfo, setPwaInfo] = useState({
    isStandalone: false,
    hasServiceWorker: false,
    swStatus: 'Vérification...',
    manifestLoaded: false,
    installable: false,
  });

  useEffect(() => {
    const checkPWA = async () => {
      // Vérifie si l'app est en mode standalone
      const isStandalone = globalThis.matchMedia('(display-mode: standalone)').matches;
      
      // Vérifie le Service Worker
      const hasServiceWorker = 'serviceWorker' in navigator;
      let swStatus = 'Non supporté';
      
      if (hasServiceWorker) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            if (registration.active) {
              swStatus = '✅ Actif';
            } else if (registration.installing) {
              swStatus = '⏳ Installation...';
            } else if (registration.waiting) {
              swStatus = '⏳ En attente...';
            }
          } else {
            swStatus = '❌ Non enregistré';
          }
        } catch (err) {
          swStatus = '❌ Erreur';
        }
      }
      
      // Vérifie le manifest
      let manifestLoaded = false;
      try {
        const response = await fetch('/manifest.json');
        manifestLoaded = response.ok;
      } catch {
        manifestLoaded = false;
      }
      
      // Vérifie l'installabilité
      const installable = !isStandalone && hasServiceWorker;
      
      setPwaInfo({
        isStandalone,
        hasServiceWorker,
        swStatus,
        manifestLoaded,
        installable,
      });
    };
    
    checkPWA();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">🔍 Test PWA Planify</h1>
            <Link 
              href="/events" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Retour
            </Link>
          </div>
          <p className="text-gray-600 mb-6">
            Cette page permet de vérifier que toutes les fonctionnalités PWA sont correctement configurées.
          </p>
        </div>

        <div className="space-y-4">
          {/* Mode Standalone */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Mode Standalone</h3>
                <p className="text-sm text-gray-600">L'app est installée et s'exécute en mode app</p>
              </div>
              <div className="text-2xl">
                {pwaInfo.isStandalone ? '✅' : '❌'}
              </div>
            </div>
          </div>

          {/* Service Worker */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Service Worker</h3>
                <p className="text-sm text-gray-600">
                  {pwaInfo.hasServiceWorker ? 'Supporté par le navigateur' : 'Non supporté'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Status: {pwaInfo.swStatus}
                </p>
              </div>
              <div className="text-2xl">
                {pwaInfo.hasServiceWorker ? '✅' : '❌'}
              </div>
            </div>
          </div>

          {/* Manifest */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Web App Manifest</h3>
                <p className="text-sm text-gray-600">Fichier manifest.json chargé</p>
              </div>
              <div className="text-2xl">
                {pwaInfo.manifestLoaded ? '✅' : '❌'}
              </div>
            </div>
          </div>

          {/* Installabilité */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Installable</h3>
                <p className="text-sm text-gray-600">
                  {pwaInfo.isStandalone 
                    ? 'Déjà installée' 
                    : pwaInfo.installable 
                      ? 'Peut être installée' 
                      : 'Configuration incomplète'}
                </p>
              </div>
              <div className="text-2xl">
                {pwaInfo.installable || pwaInfo.isStandalone ? '✅' : '❌'}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-3">📱 Comment installer l'app ?</h3>
          <div className="space-y-3 text-sm text-blue-800">
            <div>
              <strong>Chrome Desktop:</strong>
              <p>Cliquez sur l'icône + dans la barre d'URL</p>
            </div>
            <div>
              <strong>Chrome Android:</strong>
              <p>Menu → "Ajouter à l'écran d'accueil" ou bannière automatique</p>
            </div>
            <div>
              <strong>Safari iOS:</strong>
              <p>Bouton Partager → "Sur l'écran d'accueil"</p>
            </div>
          </div>
        </div>

        {/* Liens utiles */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">🔗 Liens utiles</h3>
          <div className="space-y-2 text-sm">
            <a 
              href="/manifest.json" 
              target="_blank" 
              className="block text-blue-600 hover:text-blue-700"
            >
              → Voir le manifest.json
            </a>
            <a 
              href="/sw.js" 
              target="_blank" 
              className="block text-blue-600 hover:text-blue-700"
            >
              → Voir le Service Worker
            </a>
            <a 
              href="/icons/icon-512x512.png" 
              target="_blank" 
              className="block text-blue-600 hover:text-blue-700"
            >
              → Voir l'icône (512x512)
            </a>
            <a 
              href="/icons/icon-1024x1024.png" 
              target="_blank" 
              className="block text-blue-600 hover:text-blue-700"
            >
              → Voir l'icône originale (1024x1024)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
