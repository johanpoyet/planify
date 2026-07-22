'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/themeContext';
import { useFriendRequests } from '@/lib/useFriendRequests';
import { useEventInvitations } from '@/lib/useEventInvitations';

const AgendaIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/>
  </svg>
);
const FriendsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/>
    <circle cx="17" cy="9" r="2.5"/><path d="M16 14.5c2.6.4 5 2.6 5 5.5"/>
  </svg>
);
const PollsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12V7l7-4 7 4v5"/><path d="M3 20h18M5 20v-5h14v5"/><path d="m10 10 2 2 4-4"/>
  </svg>
);
const ProfileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3.5"/><path d="M4 20c0-4 3.5-7 8-7s8 3 8 7"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

interface NavItem {
  href: string;
  label: string;
  fab?: boolean;
  badge?: number;
  Icon?: React.ComponentType;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/events',     label: 'Agenda',   Icon: AgendaIcon  },
  { href: '/friends',    label: 'Amis',     Icon: FriendsIcon },
  { href: '/events/new', label: 'Créer',    fab: true         },
  { href: '/polls',      label: 'Sondages', Icon: PollsIcon   },
  { href: '/settings',   label: 'Profil',   Icon: ProfileIcon },
];

function pathMatches(href: string, pathname: string | null) {
  if (href === '/events') return pathname === '/events' || pathname === '/';
  return pathname?.startsWith(href) ?? false;
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { primaryColor } = useTheme();
  const { pendingCount } = useFriendRequests();
  const { invitationsCount } = useEventInvitations();

  const badges: Record<string, number> = {
    '/friends': pendingCount,
    '/polls': invitationsCount,
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
      style={{ background: 'var(--pf-bg)', borderTop: '1px solid var(--pf-border)' }}
    >
      <div className="flex justify-around items-center h-20 px-2">
        {NAV_ITEMS.map((item) => {
          const active = pathMatches(item.href, pathname);
          const badge = badges[item.href] ?? 0;

          if (item.fab) {
            return (
              <Link key={item.href} href={item.href} className="flex items-center justify-center -mt-3">
                <div
                  className="flex items-center justify-center transition-transform active:scale-95"
                  style={{ width: 48, height: 48, borderRadius: 14, background: primaryColor, color: 'var(--pf-on-accent)' }}
                >
                  <PlusIcon />
                </div>
              </Link>
            );
          }

          const iconColor = active ? 'var(--pf-text)' : 'var(--pf-text-muted)';
          const { Icon } = item;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative"
              style={{ color: iconColor }}
            >
              <div style={{ strokeWidth: active ? 2 : 1.6 }}>
                {Icon && <Icon />}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
              {badge > 0 && (
                <span
                  className="absolute top-2 right-1/4 text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
                  style={{ background: 'var(--pf-danger)', color: '#fff' }}
                >
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
