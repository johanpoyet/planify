'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { registerServiceWorker } from '../lib/pwa';
import { ThemeProvider, ThemeMode } from '../lib/themeContext';
import { ToastProvider } from '../lib/toastContext';
import { ThemeColor } from '../lib/theme';

function ThemeLoader({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [themeColor, setThemeColor] = useState<ThemeColor>('blue');
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Enregistrer le Service Worker uniquement en production
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker().catch((err) => {
        console.warn('Service Worker registration failed:', err);
      });
    }

    // CORRECTIF: Ne charger le thème que si l'utilisateur est authentifié
    if (status === 'authenticated') {
      Promise.all([
        fetch('/api/user/theme').then((res) => res.json()),
        fetch('/api/user/theme-mode').then((res) => res.json()),
      ])
        .then(([themeData, modeData]) => {
          if (themeData.themeColor) {
            setThemeColor(themeData.themeColor);
          }
          if (modeData.themeMode) {
            setThemeMode(modeData.themeMode);
          }
        })
        .catch((err) => {
          console.warn('Failed to load theme preferences:', err);
          // En cas d'erreur, utiliser le thème par défaut
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (status === 'unauthenticated') {
      // Si non authentifié, utiliser les valeurs par défaut
      setIsLoading(false);
    }
    // Si status === 'loading', on attend
  }, [status]);

  if (isLoading || status === 'loading') {
    return null;
  }

  return (
    <ThemeProvider initialColor={themeColor} initialMode={themeMode}>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <SessionProvider>
      <ThemeLoader>{children}</ThemeLoader>
    </SessionProvider>
  );
}
