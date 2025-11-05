'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function useFriendRequests() {
  const { data: session } = useSession();
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
        }
      } catch (error) {
        console.error('Error fetching friend requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingRequests();

    // Polling toutes les 30 secondes pour mettre à jour le compteur
    const interval = setInterval(fetchPendingRequests, 30000);

    return () => clearInterval(interval);
  }, [session]);

  return { pendingCount, loading };
}
