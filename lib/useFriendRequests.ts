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
  }, [session]);

  return { pendingCount, loading };
}
