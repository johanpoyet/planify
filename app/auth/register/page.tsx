'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/lib/themeContext';

export default function RegisterPage() {
  const router = useRouter();
  const { primaryColor, primaryHoverColor, primaryLightColor } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue');
        return;
      }

      // Inscription réussie, rediriger vers la page de connexion
      router.push('/auth/login?registered=true');
    } catch (err) {
      setError('Une erreur est survenue lors de l\'inscription');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        {/* Logo/Brand */}
        <div className="mb-8 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl shadow-2xl mb-4" style={{ backgroundColor: primaryColor }}>
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Planify</h1>
          <p className="text-slate-400 text-sm">Organisez vos moments ensemble</p>
        </div>

        {/* Register card */}
        <div className="w-full max-w-md animate-slide-up">
          <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800/50 p-8 sm:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Créer un compte
              </h2>
              <p className="text-slate-400 text-sm">
                Rejoignez-nous et commencez à planifier
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-500/10 backdrop-blur-sm border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl text-sm flex items-center gap-2 animate-shake">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Name input */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-slate-300">
                  Nom / Pseudo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 transition-colors" style={{ color: focusedInput === 'name' ? primaryLightColor : '#64748b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={(e) => {
                      setFocusedInput('name');
                      e.currentTarget.style.borderColor = primaryColor;
                    }}
                    onBlur={(e) => {
                      setFocusedInput(null);
                      e.currentTarget.style.borderColor = '#334155';
                    }}
                    className="block w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              {/* Email input */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 transition-colors" style={{ color: focusedInput === 'email' ? primaryLightColor : '#64748b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={(e) => {
                      setFocusedInput('email');
                      e.currentTarget.style.borderColor = primaryColor;
                    }}
                    onBlur={(e) => {
                      setFocusedInput(null);
                      e.currentTarget.style.borderColor = '#334155';
                    }}
                    className="block w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              {/* Password input */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 transition-colors" style={{ color: focusedInput === 'password' ? primaryLightColor : '#64748b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={(e) => {
                      setFocusedInput('password');
                      e.currentTarget.style.borderColor = primaryColor;
                    }}
                    onBlur={(e) => {
                      setFocusedInput(null);
                      e.currentTarget.style.borderColor = '#334155';
                    }}
                    className="block w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                    placeholder="Min. 6 caractères"
                  />
                </div>
              </div>

              {/* Confirm Password input */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 transition-colors" style={{ color: focusedInput === 'confirmPassword' ? primaryLightColor : '#64748b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onFocus={(e) => {
                      setFocusedInput('confirmPassword');
                      e.currentTarget.style.borderColor = primaryColor;
                    }}
                    onBlur={(e) => {
                      setFocusedInput(null);
                      e.currentTarget.style.borderColor = '#334155';
                    }}
                    className="block w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                    placeholder="Confirmer le mot de passe"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 text-white rounded-2xl font-semibold text-lg shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed mt-8"
                style={{ backgroundColor: primaryColor }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = primaryHoverColor)}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = primaryColor)}
              >
                <div className="flex items-center justify-center">
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-white font-semibold">Inscription...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-white font-semibold text-lg">S'inscrire</span>
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-900/40 text-slate-400">Déjà membre ?</span>
              </div>
            </div>

            {/* Login link */}
            <Link href="/auth/login" className="block">
              <button
                type="button"
                className="w-full px-6 py-3.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-white font-medium rounded-2xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>Se connecter</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </button>
            </Link>
          </div>

          {/* Footer text */}
          <p className="mt-6 text-center text-sm text-slate-500">
            En vous inscrivant, vous acceptez nos conditions d'utilisation
          </p>
        </div>
      </div>
    </div>
  );
}
