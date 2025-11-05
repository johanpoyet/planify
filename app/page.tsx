'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTheme } from '@/lib/themeContext';

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();
  const { primaryColor } = useTheme();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'authenticated') {
      router.push('/events');
    } else {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Afficher un loader pendant la redirection
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl shadow-2xl mb-4 animate-pulse" style={{ backgroundColor: primaryColor }}>
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="mt-4 text-slate-300 text-lg">Chargement...</p>
      </div>
    </main>
  );
}
