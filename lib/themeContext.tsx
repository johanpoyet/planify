'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { themeColors, ThemeColor, defaultThemeColor } from './theme';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  primaryColor: string;
  primaryHoverColor: string;
  primaryLightColor: string;
  // Classes Tailwind pour utilisation directe
  classes: {
    bg: string;
    bgHover: string;
    text: string;
    textLight: string;
    border: string;
    ring: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  readonly children: React.ReactNode;
  readonly initialColor?: ThemeColor;
  readonly initialMode?: ThemeMode;
}

// Mapping des couleurs vers les classes Tailwind
const colorToClasses: Record<ThemeColor, {
  bg: string;
  bgHover: string;
  text: string;
  textLight: string;
  border: string;
  ring: string;
}> = {
  blue: {
    bg: 'bg-blue-600',
    bgHover: 'hover:bg-blue-700',
    text: 'text-blue-600',
    textLight: 'text-blue-400',
    border: 'border-blue-500',
    ring: 'ring-blue-500',
  },
  purple: {
    bg: 'bg-purple-600',
    bgHover: 'hover:bg-purple-700',
    text: 'text-purple-600',
    textLight: 'text-purple-400',
    border: 'border-purple-500',
    ring: 'ring-purple-500',
  },
  emerald: {
    bg: 'bg-emerald-600',
    bgHover: 'hover:bg-emerald-700',
    text: 'text-emerald-600',
    textLight: 'text-emerald-400',
    border: 'border-emerald-500',
    ring: 'ring-emerald-500',
  },
  rose: {
    bg: 'bg-pink-600',
    bgHover: 'hover:bg-pink-700',
    text: 'text-pink-600',
    textLight: 'text-pink-400',
    border: 'border-pink-500',
    ring: 'ring-pink-500',
  },
  red: {
    bg: 'bg-red-600',
    bgHover: 'hover:bg-red-700',
    text: 'text-red-600',
    textLight: 'text-red-400',
    border: 'border-red-500',
    ring: 'ring-red-500',
  },
  orange: {
    bg: 'bg-orange-600',
    bgHover: 'hover:bg-orange-700',
    text: 'text-orange-600',
    textLight: 'text-orange-400',
    border: 'border-orange-500',
    ring: 'ring-orange-500',
  },
  yellow: {
    bg: 'bg-yellow-600',
    bgHover: 'hover:bg-yellow-700',
    text: 'text-yellow-600',
    textLight: 'text-yellow-400',
    border: 'border-yellow-500',
    ring: 'ring-yellow-500',
  },
};

export function ThemeProvider({ children, initialColor, initialMode }: ThemeProviderProps) {
  const [themeColor, setThemeColorState] = useState<ThemeColor>(initialColor || defaultThemeColor);
  const [themeMode, setThemeModeState] = useState<ThemeMode>(initialMode || 'dark');

  useEffect(() => {
    // Appliquer les variables CSS sur le document root
    const root = document.documentElement;
    const colors = themeColors[themeColor];

    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-hover', colors.primaryHover);
    root.style.setProperty('--color-primary-light', colors.primaryLight);

    // Ajouter aussi l'attribut data-theme pour le CSS
    root.setAttribute('data-theme', themeColor);
    root.setAttribute('data-mode', themeMode);

    // Appliquer la classe au body pour le mode clair/sombre
    if (themeMode === 'light') {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    } else {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    }
  }, [themeColor, themeMode]);

  const setThemeColor = async (color: ThemeColor) => {
    setThemeColorState(color);

    // Sauvegarder dans la base de données
    try {
      await fetch('/api/user/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeColor: color }),
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du thème:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);

    // Sauvegarder dans la base de données
    try {
      await fetch('/api/user/theme-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeMode: mode }),
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du mode:', error);
    }
  };

  const value = useMemo(() => ({
    themeColor,
    setThemeColor,
    themeMode,
    setThemeMode,
    primaryColor: themeColors[themeColor].primary,
    primaryHoverColor: themeColors[themeColor].primaryHover,
    primaryLightColor: themeColors[themeColor].primaryLight,
    classes: colorToClasses[themeColor],
  }), [themeColor, themeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
