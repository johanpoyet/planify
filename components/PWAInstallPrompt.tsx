'use client';
import React from 'react';

import { useEffect, useState } from 'react';

// Composant pour proposer l'installation de la PWA
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 max-w-sm z-50 border border-gray-200">
      <div className="flex items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            Installer Planify
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Installez l'application pour un accès rapide et hors ligne
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
            >
              Installer
            </button>
            <button
              onClick={() => setShowInstallPrompt(false)}
              className="px-4 py-2 text-gray-700 text-sm rounded-lg hover:bg-gray-100"
            >
              Plus tard
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowInstallPrompt(false)}
          className="text-gray-400 hover:text-gray-600 ml-2"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
