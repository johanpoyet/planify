'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function BodyWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [shouldPad, setShouldPad] = useState(false);

  useEffect(() => {
    const isAuthPage = pathname?.startsWith('/auth/');
    const shouldShowNav = session && !isAuthPage && status !== 'loading';
    setShouldPad(shouldShowNav);
  }, [session, pathname, status]);

  return (
    <div className={shouldPad ? 'pb-20 md:pb-0 md:pt-16' : ''}>
      {children}
    </div>
  );
}
