'use client';

import { useEffect, useState } from 'react';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier si les notifications push sont supportées
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkSubscription = async () => {
    try {
      setIsLoading(true);
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      
      if (sub) {
        // Vérifier si cette subscription existe dans la base de données
        const response = await fetch('/api/push/check-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: sub.endpoint,
          }),
        });
        
        const { exists } = await response.json();
        
        if (exists) {
          setSubscription(sub);
          setIsSubscribed(true);
        } else {
          // La subscription existe localement mais pas en BDD, la nettoyer
          await sub.unsubscribe();
          setSubscription(null);
          setIsSubscribed(false);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'abonnement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Demander la permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        throw new Error('Permission de notification refusée');
      }

      // Récupérer la clé publique VAPID
      const response = await fetch('/api/push/vapid-public-key');
      const { publicKey } = await response.json();

      // Convertir la clé publique en Uint8Array
      const convertedVapidKey = urlBase64ToUint8Array(publicKey);

      // S'abonner aux notifications push
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // Enregistrer l'abonnement sur le serveur
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: sub.toJSON(),
        }),
      });

      setSubscription(sub);
      setIsSubscribed(true);

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'abonnement:', error);
      return false;
    }
  };

  const unsubscribe = async () => {
    try {
      if (!subscription) {
        return false;
      }

      // Désabonner localement
      await subscription.unsubscribe();

      // Supprimer du serveur
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });

      setSubscription(null);
      setIsSubscribed(false);

      return true;
    } catch (error) {
      console.error('Erreur lors du désabonnement:', error);
      return false;
    }
  };

  return {
    isSupported,
    isSubscribed,
    subscription,
    subscribe,
    unsubscribe,
    isLoading,
  };
}

// Fonction utilitaire pour convertir la clé VAPID
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
