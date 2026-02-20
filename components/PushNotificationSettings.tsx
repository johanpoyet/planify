'use client';
import React from 'react';

import { usePushNotifications } from '@/lib/usePushNotifications';
import { useTheme } from '@/lib/themeContext';

export default function PushNotificationSettings() {
  const { isSupported, isSubscribed, subscribe, unsubscribe, isLoading } = usePushNotifications();
  const { primaryColor } = useTheme();

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  if (!isSupported) {
    return (
      <div 
        className="p-4 rounded-2xl border"
        style={{
          backgroundColor: '#ca8a0420',
          borderColor: '#ca8a0440'
        }}
      >
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-yellow-200">
            Les notifications push ne sont pas supportées par votre navigateur.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-700 rounded-2xl">
      <div className="flex-1 pr-4">
        <h3 className="text-lg font-semibold text-white mb-1">
          Notifications Push
        </h3>
        <p className="text-sm text-slate-400">
          {isSubscribed
            ? "Recevez des notifications pour les invitations et demandes d'amis"
            : "Activez les notifications pour rester informé"}
        </p>
      </div>
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors flex-shrink-0 ${
          isLoading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        style={{ backgroundColor: isSubscribed ? primaryColor : "#334155" }}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
            isSubscribed ? "translate-x-7" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
