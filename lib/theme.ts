// 🎨 Configuration des thèmes de couleurs

export const themeColors = {
  blue: {
    name: 'Bleu',
    primary: '#7454F5',
    primaryHover: '#6A48FF',
    primaryLight: '#9277FF',
    ring: 'ring-indigo-500/30',
    gradient: 'from-indigo-500 to-violet-600',
    shadow: 'shadow-indigo-500/30',
    border: 'border-indigo-500/30',
    emoji: '🔵'
  },
  purple: {
    name: 'Violet',
    primary: '#9333ea',    // purple-600
    primaryHover: '#7e22ce', // purple-700
    primaryLight: '#a78bfa', // purple-400
    ring: 'ring-purple-500/30',
    gradient: 'from-purple-500 to-purple-600',
    shadow: 'shadow-purple-500/30',
    border: 'border-purple-500/30',
    emoji: '🟣'
  },
  emerald: {
    name: 'Vert',
    primary: '#059669',    // emerald-600
    primaryHover: '#047857', // emerald-700
    primaryLight: '#34d399', // emerald-400
    ring: 'ring-emerald-500/30',
    gradient: 'from-emerald-500 to-emerald-600',
    shadow: 'shadow-emerald-500/30',
    border: 'border-emerald-500/30',
    emoji: '🟢'
  },
  rose: {
    name: 'Rose',
    primary: '#db2777',    // pink-600
    primaryHover: '#be185d', // pink-700
    primaryLight: '#f472b6', // pink-400
    ring: 'ring-pink-500/30',
    gradient: 'from-pink-500 to-pink-600',
    shadow: 'shadow-pink-500/30',
    border: 'border-pink-500/30',
    emoji: '💖'
  },
  red: {
    name: 'Rouge',
    primary: '#dc2626',    // red-600
    primaryHover: '#b91c1c', // red-700
    primaryLight: '#f87171', // red-400
    ring: 'ring-red-500/30',
    gradient: 'from-red-500 to-red-600',
    shadow: 'shadow-red-500/30',
    border: 'border-red-500/30',
    emoji: '🔴'
  },
  orange: {
    name: 'Orange',
    primary: '#ea580c',    // orange-600
    primaryHover: '#c2410c', // orange-700
    primaryLight: '#fb923c', // orange-400
    ring: 'ring-orange-500/30',
    gradient: 'from-orange-500 to-orange-600',
    shadow: 'shadow-orange-500/30',
    border: 'border-orange-500/30',
    emoji: '🟠'
  },
  yellow: {
    name: 'Jaune',
    primary: '#ca8a04',    // yellow-600
    primaryHover: '#a16207', // yellow-700
    primaryLight: '#facc15', // yellow-400
    ring: 'ring-yellow-500/30',
    gradient: 'from-yellow-500 to-yellow-600',
    shadow: 'shadow-yellow-500/30',
    border: 'border-yellow-500/30',
    emoji: '🟡'
  },
} as const;

export type ThemeColor = keyof typeof themeColors;

export const defaultThemeColor: ThemeColor = 'blue';

// ---------------------------------------------------------------------------
// Contraste : choix de la couleur de texte posee sur la couleur d'accent
// ---------------------------------------------------------------------------

/** Couleur de texte foncee utilisee sur les accents clairs. */
export const ON_ACCENT_DARK = '#12121A';
export const ON_ACCENT_LIGHT = '#FFFFFF';

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

/** Rapport de contraste WCAG entre deux couleurs (1 a 21). */
export function contrastRatio(a: string, b: string): number {
  const [la, lb] = [relativeLuminance(a), relativeLuminance(b)];
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Retourne la couleur de texte offrant le meilleur contraste sur la couleur
 * fournie. Les accents clairs (vert, orange, jaune) recoivent un texte fonce :
 * le blanc n'y atteindrait pas le seuil AA de 4,5:1 exige pour du texte normal.
 */
export function onAccentColor(background: string): string {
  return contrastRatio(ON_ACCENT_LIGHT, background) >=
    contrastRatio(ON_ACCENT_DARK, background)
    ? ON_ACCENT_LIGHT
    : ON_ACCENT_DARK;
}
