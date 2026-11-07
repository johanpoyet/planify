'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTheme } from '@/lib/themeContext';
import { PlanifyMark } from '@/app/components/PlanifyLogo';

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
    // Le repère <main> est porté par BodyWrapper : on évite ici un landmark imbriqué.
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl shadow-2xl mb-4 animate-pulse" style={{ backgroundColor: primaryColor, color: 'var(--pf-on-accent)' }}>
          <PlanifyMark size={52} />
        </div>
        <p className="mt-4 text-slate-300 text-lg">Chargement...</p>
      </div>
    </div>
  );
}
