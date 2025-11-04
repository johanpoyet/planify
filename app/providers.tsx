'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { registerServiceWorker } from '../lib/pwa';

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  useEffect(() => {
    // Enregistrer le Service Worker au chargement
    registerServiceWorker();
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
