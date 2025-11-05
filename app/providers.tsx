'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { registerServiceWorker } from '../lib/pwa';
import { ThemeProvider } from '../lib/themeContext';
import { ThemeColor } from '../lib/theme';

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const [themeColor, setThemeColor] = useState<ThemeColor>('blue');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Enregistrer le Service Worker au chargement
    registerServiceWorker();

    // Charger la couleur de thème de l'utilisateur
    fetch('/api/user/theme')
      .then((res) => res.json())
      .then((data) => {
        if (data.themeColor) {
          setThemeColor(data.themeColor);
        }
      })
      .catch(() => {
        // En cas d'erreur, utiliser le thème par défaut
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    // Afficher un écran de chargement minimal pendant la récupération du thème
    return null;
  }

  return (
    <SessionProvider>
      <ThemeProvider initialColor={themeColor}>{children}</ThemeProvider>
    </SessionProvider>
  );
}
