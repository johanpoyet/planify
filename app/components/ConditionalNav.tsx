'use client';
import React from 'react';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import MobileBottomNav from './MobileBottomNav';

export default function ConditionalNav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Ne pas afficher la navigation sur les pages d'authentification
  const isAuthPage = pathname?.startsWith('/auth/');

  // Ne pas afficher la navigation si non connecté ou sur une page d'auth
  if (status === 'loading') {
    return null;
  }

  if (!session || isAuthPage) {
    return null;
  }

  return <MobileBottomNav />;
}
