// 🎨 Configuration des thèmes de couleurs

export const themeColors = {
  blue: {
    name: 'Bleu',
    primary: '#2563eb',    // blue-600
    primaryHover: '#1d4ed8', // blue-700
    primaryLight: '#60a5fa', // blue-400
    ring: 'ring-blue-500/30',
    gradient: 'from-blue-500 to-blue-600',
    shadow: 'shadow-blue-500/30',
    border: 'border-blue-500/30',
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
