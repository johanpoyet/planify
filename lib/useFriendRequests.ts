'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

export function useFriendRequests() {
  const { data: session } = useSession();
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const errorCountRef = useRef(0);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    const fetchPendingRequests = async () => {
      try {
        const res = await fetch('/api/friends?status=pending');
        if (res.ok) {
          const data = await res.json();
          // Ne compter que les demandes reçues (isReceiver: true)
          const receivedRequests = data.filter((request: any) => request.isReceiver === true);
          setPendingCount(receivedRequests.length);
          errorCountRef.current = 0; // Reset error count on success
        } else if (res.status === 429) {
          // Rate limited - stop polling temporarily
          errorCountRef.current++;
          console.warn('Rate limited on friend requests, backing off...');
        }
      } catch (error) {
        console.error('Error fetching friend requests:', error);
        errorCountRef.current++;
      } finally {
        setLoading(false);
      }
    };

    fetchPendingRequests();

    // Polling augmenté à 120 secondes (au lieu de 30s) pour réduire la charge serveur
    // Si trop d'erreurs consécutives, arrêter le polling
    const interval = setInterval(() => {
      if (errorCountRef.current < 3) {
        fetchPendingRequests();
      }
    }, 120000);

    return () => clearInterval(interval);
  }, [session]);

  return { pendingCount, loading };
}
