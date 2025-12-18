"use client";

import { use } from 'react';
import { useRouter } from 'next/navigation';
import PollCard from '@/components/PollCard';
import { useTheme } from '@/lib/themeContext';

interface Props { params: Promise<{ id: string }> }

export default function PollPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { primaryColor } = useTheme();

  return (
    <div className="min-h-screen bg-slate-950 pb-24 md:pb-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-slate-900/30 to-transparent"></div>
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl shadow-2xl p-4 sm:p-6 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700 flex-shrink-0"
              aria-label="Retour"
            >
              <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0" style={{ backgroundColor: primaryColor }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Sondage</h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">Votez pour votre option préférée</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl shadow-2xl p-4 sm:p-8">
          <PollCard pollId={id} />
        </div>
      </div>
    </div>
  );
}
