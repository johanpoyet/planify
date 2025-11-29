'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/themeContext';
import { useFriendRequests } from '@/lib/useFriendRequests';
import { useEventInvitations } from '@/lib/useEventInvitations';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { pendingCount } = useFriendRequests();
  const { invitationsCount } = useEventInvitations();
  const { primaryColor, primaryLightColor, themeMode } = useTheme();

  const navItems = [
    {
      href: '/events',
      label: 'Accueil',
      active: pathname === '/events' || pathname === '/events/shared',
      svg: (isActive: boolean) => (
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ color: isActive ? primaryLightColor : (themeMode === 'dark' ? '#94a3b8' : '#64748b') }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: '/events/invitations',
      label: 'Notifications',
      active: pathname === '/events/invitations',
      badge: invitationsCount,
      svg: (isActive: boolean) => (
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ color: isActive ? primaryLightColor : (themeMode === 'dark' ? '#94a3b8' : '#64748b') }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      href: '/events/new',
      label: 'Nouveau',
      active: pathname === '/events/new',
      primary: true,
      svg: () => (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      href: '/friends',
      label: 'Amis',
      active: pathname === '/friends',
      badge: pendingCount,
      svg: (isActive: boolean) => (
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ color: isActive ? primaryLightColor : (themeMode === 'dark' ? '#94a3b8' : '#64748b') }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      href: '/settings',
      label: 'Paramètres',
      active: pathname === '/settings',
      svg: (isActive: boolean) => (
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ color: isActive ? primaryLightColor : (themeMode === 'dark' ? '#94a3b8' : '#64748b') }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t z-50 safe-area-bottom transition-colors"
      style={{
        backgroundColor: themeMode === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(226, 232, 240, 0.8)',
      }}
    >
      <div className="flex justify-around items-center h-20 px-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative ${
              item.primary ? '-mt-8' : ''
            }`}
          >
            {item.primary ? (
              <div className="relative group">
                <div 
                  className="flex items-center justify-center w-16 h-16 rounded-full shadow-2xl group-active:scale-95 transition"
                  style={{ backgroundColor: primaryColor }}
                >
                  {item.svg(false)}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 transition-all">
                <div className={`transition-all ${item.active ? 'scale-110' : 'scale-100'}`}>
                  {item.svg(item.active)}
                </div>
                <span
                  className="text-[10px] font-medium transition-colors"
                  style={{ color: item.active ? primaryLightColor : (themeMode === 'dark' ? '#64748b' : '#94a3b8') }}
                >
                  {item.label}
                </span>
                {/* Badge de notification */}
                {Boolean('badge' in item && item.badge && item.badge > 0) && (
                  <span className="absolute top-2 right-1/4 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1.5 shadow-xl animate-pulse">
                    {'badge' in item && item.badge && (item.badge > 9 ? '9+' : item.badge)}
                  </span>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
