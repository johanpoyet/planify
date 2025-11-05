'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function useEventInvitations() {
  const { data: session } = useSession();
  const [invitationsCount, setInvitationsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    const fetchInvitations = async () => {
      try {
        const res = await fetch('/api/events/invitations/count');
        if (res.ok) {
          const data = await res.json();
          setInvitationsCount(data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching event invitations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();

    // Polling toutes les 30 secondes pour mettre à jour le compteur
    const interval = setInterval(fetchInvitations, 30000);

    return () => clearInterval(interval);
  }, [session]);

  return { invitationsCount, loading };
}
