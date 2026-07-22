'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/lib/themeContext';

export default function LoginPage() {
  const router = useRouter();
  const { primaryColor } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setError('Email ou mot de passe incorrect');
      } else if (result?.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError('Une erreur est survenue');
      }
    } catch {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--pf-bg)' }}>
      {/* Left — brand panel (desktop only) */}
      <div
        className="hidden lg:flex flex-col justify-between flex-1 p-16"
        style={{ background: 'var(--pf-bg-2)', borderRight: '1px solid var(--pf-border)' }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center text-sm font-bold"
            style={{ width: 28, height: 28, borderRadius: 8, background: primaryColor, color: '#fff' }}
          >
            P
          </div>
          <span className="font-semibold text-base" style={{ color: 'var(--pf-text)', letterSpacing: '-0.02em' }}>Planify</span>
        </div>

        {/* Tagline */}
        <div style={{ maxWidth: 480 }}>
          <h1 className="font-semibold leading-tight mb-5" style={{ fontSize: 52, letterSpacing: '-0.035em', color: 'var(--pf-text)', lineHeight: 1.02 }}>
            Tous tes plans.<br />
            <span style={{ color: primaryColor }}>Un seul endroit.</span>
          </h1>
          <p style={{ fontSize: 17, color: 'var(--pf-text-dim)', lineHeight: 1.55 }}>
            Sondage pour décider d'une date, invitations en un tap, calendriers partagés — sans drama de groupe.
          </p>
        </div>

        {/* Preview card */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--pf-surface)', border: '1px solid var(--pf-border)', maxWidth: 380 }}
        >
          <div className="mb-4">
            <div className="text-xs font-mono mb-1" style={{ color: 'var(--pf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Sam 14 juin · 21:00
            </div>
            <div className="font-semibold" style={{ fontSize: 17, color: 'var(--pf-text)', letterSpacing: '-0.015em' }}>
              Anniversaire Camille
            </div>
            <div className="text-sm mt-1" style={{ color: 'var(--pf-text-dim)' }}>Bar Le Calbar · 11e</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex">
              {['CA', 'MO', 'LD', 'TM'].map((init, i) => (
                <div
                  key={init}
                  className="flex items-center justify-center text-xs font-semibold text-white rounded-full"
                  style={{
                    width: 28, height: 28,
                    background: ['#7C5CFF', '#FF7A45', '#4FD18B', '#FF6BD6'][i],
                    marginLeft: i > 0 ? -8 : 0,
                    border: '2px solid var(--pf-surface)',
                  }}
                >
                  {init}
                </div>
              ))}
            </div>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: 'var(--pf-accent-soft)', color: primaryColor }}
            >
              6 ok
            </span>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-col justify-center flex-1 px-8 py-12 lg:px-20" style={{ maxWidth: '100%' }}>
        {/* Mobile brand */}
        <div className="flex items-center gap-2.5 mb-12 lg:hidden">
          <div
            className="flex items-center justify-center text-sm font-bold"
            style={{ width: 28, height: 28, borderRadius: 8, background: primaryColor, color: '#fff' }}
          >
            P
          </div>
          <span className="font-semibold" style={{ color: 'var(--pf-text)', letterSpacing: '-0.02em' }}>Planify</span>
        </div>

        <div style={{ maxWidth: 380, width: '100%' }}>
          <h2 className="font-semibold mb-1.5" style={{ fontSize: 32, color: 'var(--pf-text)', letterSpacing: '-0.025em' }}>
            Re-bonjour.
          </h2>
          <p className="mb-9 text-sm" style={{ color: 'var(--pf-text-dim)' }}>Connecte-toi pour continuer.</p>

          {error && (
            <div
              className="mb-6 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(255,92,92,0.1)', border: '1px solid rgba(255,92,92,0.2)', color: 'var(--pf-danger)' }}
            >
              {error}
            </div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--pf-text-dim)' }}>Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="toi@example.com"
                className="w-full rounded-xl px-3.5 py-3 text-sm outline-none transition-all"
                style={{
                  background: 'var(--pf-surface)',
                  border: '1px solid var(--pf-border)',
                  color: 'var(--pf-text)',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = primaryColor; e.currentTarget.style.boxShadow = `0 0 0 3px var(--pf-accent-soft)`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--pf-border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-xs font-medium" style={{ color: 'var(--pf-text-dim)' }}>Mot de passe</label>
                {/* Variante claire de l'accent : la couleur pleine n'atteint pas
                    le contraste WCAG AA lorsqu'elle sert de texte sur fond sombre. */}
                <span className="text-xs font-medium cursor-pointer" style={{ color: 'var(--pf-accent-strong)' }}>Oublié ?</span>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl px-3.5 py-3 text-sm outline-none transition-all"
                style={{
                  background: 'var(--pf-surface)',
                  border: '1px solid var(--pf-border)',
                  color: 'var(--pf-text)',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = primaryColor; e.currentTarget.style.boxShadow = `0 0 0 3px var(--pf-accent-soft)`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--pf-border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all mt-2 disabled:opacity-50"
              style={{ background: primaryColor, color: '#fff' }}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: 'var(--pf-border)' }} />
            <span className="text-xs" style={{ color: 'var(--pf-text-muted)' }}>ou</span>
            <div className="flex-1 h-px" style={{ background: 'var(--pf-border)' }} />
          </div>

          <div className="text-center text-sm" style={{ color: 'var(--pf-text-dim)' }}>
            Pas encore de compte ?{' '}
            <Link href="/auth/register" className="font-medium" style={{ color: 'var(--pf-text)' }}>
              S'inscrire gratuitement
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
