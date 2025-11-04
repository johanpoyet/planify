'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [invitationsCount, setInvitationsCount] = useState(0);

  useEffect(() => {
    fetchInvitationsCount();
    
    // Rafraîchir toutes les 10 secondes
    const interval = setInterval(fetchInvitationsCount, 10000);
    
    // Rafraîchir aussi quand la page redevient visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchInvitationsCount();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchInvitationsCount = async () => {
    try {
      const res = await fetch('/api/events/invitations/count');
      if (res.ok) {
        const data = await res.json();
        setInvitationsCount(data.count || 0);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du nombre d\'invitations:', error);
    }
  };

  const navItems = [
    {
      href: '/events',
      label: 'Événements',
      icon: '📅',
      active: pathname === '/events' || pathname === '/events/shared',
    },
    {
      href: '/events/invitations',
      label: 'Invitations',
      icon: '�',
      active: pathname === '/events/invitations',
      badge: invitationsCount,
    },
    {
      href: '/events/new',
      label: 'Nouveau',
      icon: '➕',
      active: pathname === '/events/new',
      primary: true,
    },
    {
      href: '/friends',
      label: 'Amis',
      icon: '👥',
      active: pathname === '/friends',
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
              item.primary
                ? 'relative -mt-6'
                : ''
            }`}
          >
            <div
              className={`flex flex-col items-center justify-center transition-all relative ${
                item.primary
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-14 h-14 shadow-lg'
                  : item.active
                  ? 'text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              <span className={`${item.primary ? 'text-2xl' : 'text-xl'}`}>
                {item.icon}
              </span>
              {!item.primary && (
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              )}
              {/* Badge de notification */}
              {'badge' in item && item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
}
