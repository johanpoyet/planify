'use client';
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function BodyWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [shouldPad, setShouldPad] = useState(false);

  useEffect(() => {
    const isAuthPage = pathname?.startsWith('/auth/');
    const shouldShowNav = !!(session && !isAuthPage && status !== 'loading');
    setShouldPad(shouldShowNav);
  }, [session, pathname, status]);

  return (
    // <main> fournit le repère principal (landmark) attendu par le RGAA sur
    // toutes les pages ; il ne doit donc pas être dupliqué dans les pages enfants.
    <main
      className={`min-h-screen transition-colors ${shouldPad ? 'pb-20 md:pb-0 md:ml-[260px]' : ''}`}
      style={{ backgroundColor: 'var(--pf-bg)', color: 'var(--pf-text)' }}
    >
      {children}
    </main>
  );
}
