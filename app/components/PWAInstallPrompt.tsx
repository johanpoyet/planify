'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // Enregistrement du Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('✅ Service Worker enregistré:', registration.scope);
          })
          .catch((error) => {
            console.error('❌ Erreur d\'enregistrement du Service Worker:', error);
          });
      });
    }

    // Gestion de l'événement d'installation PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Vérifie si l'app est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('✅ L\'application est déjà installée');
      setShowInstallButton(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Affiche la popup d'installation native
    deferredPrompt.prompt();

    // Attend le choix de l'utilisateur
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ Utilisateur a accepté l\'installation');
    } else {
      console.log('❌ Utilisateur a refusé l\'installation');
    }

    // Reset
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  if (!showInstallButton) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-2xl">📱</div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Installer Planify</h3>
          <p className="text-sm text-blue-100 mb-3">
            Installez l'application sur votre appareil pour un accès rapide
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-white text-blue-600 px-4 py-2 rounded font-medium hover:bg-blue-50 transition"
            >
              Installer
            </button>
            <button
              onClick={() => setShowInstallButton(false)}
              className="px-4 py-2 rounded font-medium hover:bg-blue-700 transition"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
