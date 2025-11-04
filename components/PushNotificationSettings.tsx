'use client';

import { usePushNotifications } from '@/lib/usePushNotifications';

export default function PushNotificationSettings() {
  const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          ⚠️ Les notifications push ne sont pas supportées par votre navigateur.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Notifications Push</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Recevez des notifications pour les demandes d'amis et les invitations aux événements
          </p>
        </div>
        <button
          onClick={isSubscribed ? unsubscribe : subscribe}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isSubscribed
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isSubscribed ? 'Désactiver' : 'Activer'}
        </button>
      </div>
      
      {isSubscribed && (
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">
            ✅ Les notifications sont activées sur cet appareil
          </p>
        </div>
      )}
    </div>
  );
}
