'use client';

import { useState, useEffect } from 'react';
import { 
  areNotificationsSupported, 
  getNotificationPermission, 
  sendLocalNotification,
  requestNotificationPermission 
} from '@/lib/pwa';

function getPermissionStyle(permission: NotificationPermission): string {
  if (permission === 'granted') {
    return 'bg-green-100 text-green-800';
  }
  if (permission === 'denied') {
    return 'bg-red-100 text-red-800';
  }
  return 'bg-gray-100 text-gray-800';
}

function getPermissionLabel(permission: NotificationPermission): string {
  if (permission === 'granted') {
    return '✓ Accordée';
  }
  if (permission === 'denied') {
    return '✗ Refusée';
  }
  return '? Non demandée';
}

export default function NotificationTest() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    // Détection du support
    setIsSupported(areNotificationsSupported());
    
    // Détection iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    
    // Détection du mode standalone (app installée)
    const standalone = globalThis.matchMedia('(display-mode: standalone)').matches || 
                      (navigator as any).standalone || 
                      document.referrer.includes('android-app://');
    setIsStandalone(standalone);
    
    // Récupération de la permission
    if (areNotificationsSupported()) {
      setPermission(getNotificationPermission());
    }
    
    // Info de debug
    setDebugInfo(`
      Support: ${areNotificationsSupported()}
      iOS: ${iOS}
      Standalone: ${standalone}
      Permission: ${getNotificationPermission()}
      Notification in globalThis: ${'Notification' in globalThis}
    `);
  }, []);

  const handleRequestPermission = async () => {
    const newPermission = await requestNotificationPermission();
    setPermission(newPermission);
  };

  const handleSendNotification = async () => {
    await sendLocalNotification('Test de notification', {
      body: 'Ceci est une notification de test depuis Planify ! 🎉',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
    });
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm font-semibold mb-2">
          ⚠️ Les notifications ne sont pas supportées
        </p>
        <details className="text-xs text-yellow-700">
          <summary className="cursor-pointer">Informations de debug</summary>
          <pre className="mt-2 whitespace-pre-wrap">{debugInfo}</pre>
        </details>
      </div>
    );
  }

  // Sur iOS, les notifications ne fonctionnent que si l'app est installée
  if (isIOS && !isStandalone) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm font-semibold mb-2">
          📱 Installation requise sur iOS
        </p>
        <p className="text-blue-700 text-sm mb-3">
          Sur iOS, les notifications ne fonctionnent que si l'application est installée sur l'écran d'accueil.
        </p>
        <div className="bg-white rounded p-3 text-xs text-blue-900">
          <p className="font-semibold mb-1">Pour installer :</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Appuyez sur le bouton Partager (carré avec flèche)</li>
            <li>Sélectionnez "Sur l'écran d'accueil"</li>
            <li>Appuyez sur "Ajouter"</li>
            <li>Ouvrez l'app depuis l'écran d'accueil</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🔔 Test des notifications push
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Statut de la permission:
          </span>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
            getPermissionStyle(permission)
          }`}>
            {getPermissionLabel(permission)}
          </span>
        </div>

        {permission === 'default' && (
          <button
            onClick={handleRequestPermission}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Demander la permission
          </button>
        )}

        {permission === 'granted' && (
          <button
            onClick={handleSendNotification}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Envoyer une notification de test
          </button>
        )}

        {permission === 'denied' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800 font-semibold mb-2">
              ❌ Notifications refusées
            </p>
            {isIOS ? (
              <div className="text-xs text-red-700 space-y-2">
                <p>Sur iOS, il n'est actuellement pas possible de demander à nouveau la permission une fois refusée.</p>
                <p className="font-semibold">Solutions :</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Supprimer complètement l'app de l'écran d'accueil</li>
                  <li>Aller dans Réglages → Safari → Avancé → Données de sites web</li>
                  <li>Supprimer les données pour ce site</li>
                  <li>Réinstaller l'app</li>
                </ol>
                <p className="mt-2 font-semibold">⚠️ Note : Les notifications push sur iOS PWA ont des limitations importantes.</p>
              </div>
            ) : (
              <div className="text-xs text-red-700 space-y-2">
                <p>Pour réactiver les notifications :</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Cliquez sur l'icône de cadenas dans la barre d'adresse</li>
                  <li>Cliquez sur "Paramètres du site" ou "Autorisations"</li>
                  <li>Changez "Notifications" en "Autoriser"</li>
                  <li>Rechargez la page</li>
                </ol>
              </div>
            )}
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-red-600">Informations de debug</summary>
              <pre className="mt-2 text-xs whitespace-pre-wrap bg-red-100 p-2 rounded">{debugInfo}</pre>
            </details>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          💡 Les notifications vous permettront de recevoir des rappels pour vos événements.
        </p>
        {isIOS && (
          <p className="text-xs text-orange-600 mt-2 font-semibold">
            ⚠️ iOS : Les notifications nécessitent iOS 16.4+ et peuvent avoir des limitations.
          </p>
        )}
      </div>
    </div>
  );
}
