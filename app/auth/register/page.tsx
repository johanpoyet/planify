'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/lib/themeContext';

export default function RegisterPage() {
  const router = useRouter();
  const { primaryColor } = useTheme();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }
    if (formData.password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères'); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Une erreur est survenue'); return; }
      router.push('/auth/login?registered=true');
    } catch {
      setError("Une erreur est survenue lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'var(--pf-surface)',
    border: '1px solid var(--pf-border)',
    color: 'var(--pf-text)',
  };

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = primaryColor;
    e.currentTarget.style.boxShadow = '0 0 0 3px var(--pf-accent-soft)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'var(--pf-border)';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--pf-bg)' }}>
      <div style={{ maxWidth: 400, width: '100%' }}>
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-10">
          <div
            className="flex items-center justify-center text-sm font-bold"
            style={{ width: 28, height: 28, borderRadius: 8, background: primaryColor, color: '#fff' }}
          >
            P
          </div>
          <span className="font-semibold" style={{ color: 'var(--pf-text)', letterSpacing: '-0.02em' }}>Planify</span>
        </div>

        <h2 className="font-semibold mb-1.5" style={{ fontSize: 28, color: 'var(--pf-text)', letterSpacing: '-0.025em' }}>
          Crée ton compte
        </h2>
        <p className="text-sm mb-8" style={{ color: 'var(--pf-text-dim)' }}>
          Ça prend 30 secondes.
        </p>

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
            <label htmlFor="name" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--pf-text-dim)' }}>Nom complet</label>
            <input
              id="name" name="name" type="text" required
              value={formData.name} onChange={handleChange}
              placeholder="Sam Léonard"
              className="w-full rounded-xl px-3.5 py-3 text-sm outline-none transition-all"
              style={inputStyle} onFocus={onFocus} onBlur={onBlur}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--pf-text-dim)' }}>Adresse email</label>
            <input
              id="email" name="email" type="email" required
              value={formData.email} onChange={handleChange}
              placeholder="toi@example.com"
              className="w-full rounded-xl px-3.5 py-3 text-sm outline-none transition-all"
              style={inputStyle} onFocus={onFocus} onBlur={onBlur}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--pf-text-dim)' }}>Mot de passe</label>
            <input
              id="password" name="password" type="password" required
              value={formData.password} onChange={handleChange}
              placeholder="Min. 6 caractères"
              className="w-full rounded-xl px-3.5 py-3 text-sm outline-none transition-all"
              style={inputStyle} onFocus={onFocus} onBlur={onBlur}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--pf-text-dim)' }}>Confirmer le mot de passe</label>
            <input
              id="confirmPassword" name="confirmPassword" type="password" required
              value={formData.confirmPassword} onChange={handleChange}
              placeholder="••••••••"
              className="w-full rounded-xl px-3.5 py-3 text-sm outline-none transition-all"
              style={inputStyle} onFocus={onFocus} onBlur={onBlur}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all mt-2 disabled:opacity-50"
            style={{ background: primaryColor, color: '#fff' }}
          >
            {loading ? 'Création…' : 'Continuer →'}
          </button>
        </form>

        <p className="text-xs text-center mt-4" style={{ color: 'var(--pf-text-muted)' }}>
          En continuant tu acceptes nos conditions d'utilisation.
        </p>

        <div className="text-center text-sm mt-6" style={{ color: 'var(--pf-text-dim)' }}>
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="font-medium" style={{ color: 'var(--pf-text)' }}>
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
