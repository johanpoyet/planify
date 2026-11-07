'use client';

import { useTheme } from '@/lib/themeContext';

/**
 * Symbole Planify : un P dont la barre est faite de trois points (les amis)
 * relies par une seule ligne (le plan). Prend la couleur du texte parent.
 */
export function PlanifyMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <g transform="translate(6 0)">
        <g fill="currentColor">
          <circle cx="30" cy="24" r="8" />
          <circle cx="30" cy="50" r="8" />
          <circle cx="30" cy="76" r="8" />
        </g>
        <path
          d="M30 24 H54 a13 13 0 0 1 0 26 H30"
          fill="none"
          stroke="currentColor"
          strokeWidth={9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/**
 * Icone Planify : le symbole sur un carre arrondi a la couleur du theme,
 * comme l'icone de l'application. Le symbole utilise --pf-on-accent pour
 * rester lisible quelle que soit la teinte choisie par l'utilisateur.
 */
export function PlanifyIcon({ size = 28, className }: { size?: number; className?: string }) {
  const { primaryColor } = useTheme();
  return (
    <span
      className={`inline-flex items-center justify-center flex-shrink-0 ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        background: primaryColor,
        color: 'var(--pf-on-accent)',
      }}
      aria-hidden="true"
    >
      <PlanifyMark size={Math.round(size * 0.66)} />
    </span>
  );
}

/** Logo complet : icone + nom « Planify » en DM Sans Bold. */
export default function PlanifyLogo({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
      <PlanifyIcon size={size} />
      <span
        style={{
          fontFamily: 'var(--font-brand), system-ui, sans-serif',
          fontWeight: 700,
          fontSize: Math.round(size * 0.58),
          letterSpacing: '-0.03em',
          color: 'var(--pf-text)',
        }}
      >
        Planify
      </span>
    </span>
  );
}
