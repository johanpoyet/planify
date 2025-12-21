'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

export function useEventInvitations() {
  const { data: session } = useSession();
  const [invitationsCount, setInvitationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const errorCountRef = useRef(0);

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
          errorCountRef.current = 0; // Reset error count on success
        } else if (res.status === 429) {
          // Rate limited - stop polling temporarily
          errorCountRef.current++;
          console.warn('Rate limited on invitations count, backing off...');
        }
      } catch (error) {
        console.error('Error fetching event invitations:', error);
        errorCountRef.current++;
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();

    // Polling réduit à 60 secondes (au lieu de 5s) pour réduire la charge serveur
    // Si trop d'erreurs consécutives, arrêter le polling
    const interval = setInterval(() => {
      if (errorCountRef.current < 3) {
        fetchInvitations();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [session]);

  return { invitationsCount, loading };
}
