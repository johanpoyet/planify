'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from '@/lib/themeContext'
import { useFriendRequests } from '@/lib/useFriendRequests'
import { useEventInvitations } from '@/lib/useEventInvitations'

export default function DesktopNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { primaryColor } = useTheme()
  const { pendingCount } = useFriendRequests()
  const { invitationsCount } = useEventInvitations()
  const [showLogoutMenu, setShowLogoutMenu] = useState(false)

  if (!session || pathname?.startsWith('/auth')) return null

  const isActive = (path: string) => {
    if (path === '/events') return pathname === '/events' || pathname === '/'
    return pathname?.startsWith(path)
  }

  const mainNav = [
    {
      href: '/events',
      label: 'Agenda',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/>
        </svg>
      ),
    },
    {
      href: '/events/invitations',
      label: 'Invitations',
      badge: invitationsCount,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 13h5l1 3h6l1-3h5"/><path d="M5 13 7 5h10l2 8v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6z"/>
        </svg>
      ),
    },
    {
      href: '/polls',
      label: 'Sondages',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12V7l7-4 7 4v5"/><path d="M3 20h18M5 20v-5h14v5"/><path d="m10 10 2 2 4-4"/>
        </svg>
      ),
    },
  ]

  const socialNav = [
    {
      href: '/friends',
      label: 'Amis',
      badge: pendingCount,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5c2.6.4 5 2.6 5 5.5"/>
        </svg>
      ),
    },
    {
      href: '/events/shared',
      label: 'Agenda partagé',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.5 10.5 7-4M8.5 13.5l7 4"/>
        </svg>
      ),
    },
  ]

  const NavItem = ({ href, label, icon, badge }: { href: string; label: string; icon: React.ReactNode; badge?: number }) => {
    const active = isActive(href)
    return (
      <Link
        href={href}
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
        style={{
          color: active ? 'var(--pf-text)' : 'var(--pf-text-dim)',
          background: active ? 'var(--pf-surface-2)' : 'transparent',
          letterSpacing: '-0.005em',
        }}
      >
        {icon}
        <span style={{ flex: 1 }}>{label}</span>
        {badge != null && badge > 0 && (
          <span
            className="text-xs px-1.5 py-0.5 rounded-md font-medium"
            style={{
              background: active ? 'var(--pf-accent-soft)' : 'var(--pf-surface-3)',
              color: active ? 'var(--pf-accent)' : 'var(--pf-text-dim)',
            }}
          >
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </Link>
    )
  }

  const userName = session.user?.name || session.user?.email || 'Utilisateur'
  const userHandle = session.user?.email?.split('@')[0] || 'user'
  const initials = userName.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join('')

  return (
    <nav
      className="hidden md:flex fixed top-0 left-0 bottom-0 z-50 flex-col"
      style={{
        width: 260,
        background: 'var(--pf-bg)',
        borderRight: '1px solid var(--pf-border)',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom: '1px solid var(--pf-border)' }}>
        <div
          className="flex items-center justify-center font-bold text-sm"
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: primaryColor,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          P
        </div>
        <span className="font-semibold text-base" style={{ color: 'var(--pf-text)', letterSpacing: '-0.02em' }}>Planify</span>
      </div>

      {/* Main nav */}
      <div className="flex flex-col gap-0.5 px-3 pt-3">
        {mainNav.map(item => (
          <NavItem key={item.href} {...item} />
        ))}
        <div
          className="text-xs font-semibold uppercase px-3 pt-4 pb-2"
          style={{ color: 'var(--pf-text-muted)', letterSpacing: '0.08em' }}
        >
          Social
        </div>
        {socialNav.map(item => (
          <NavItem key={item.href} {...item} />
        ))}
      </div>

      <div style={{ flex: 1 }} />

      {/* Settings */}
      <div className="px-3 pb-2">
        <NavItem
          href="/settings"
          label="Paramètres"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.13.31.2.65.2 1"/>
            </svg>
          }
        />
      </div>

      {/* User footer */}
      <div
        className="flex items-center gap-2.5 px-4 py-3.5 relative"
        style={{ borderTop: '1px solid var(--pf-border)' }}
      >
        <div
          className="flex items-center justify-center text-xs font-semibold text-white rounded-full flex-shrink-0"
          style={{ width: 32, height: 32, background: primaryColor }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--pf-text)', letterSpacing: '-0.005em' }}>
            {session.user?.name || 'Utilisateur'}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--pf-text-muted)' }}>
            @{userHandle}
          </p>
        </div>
        <button
          onClick={() => setShowLogoutMenu(!showLogoutMenu)}
          className="p-1 rounded-md transition-colors flex-shrink-0"
          style={{ color: 'var(--pf-text-muted)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        </button>

        {showLogoutMenu && (
          <div
            className="absolute bottom-full left-3 right-3 mb-2 border rounded-xl shadow-2xl overflow-hidden z-50"
            style={{
              background: 'var(--pf-surface)',
              borderColor: 'var(--pf-border)',
            }}
          >
            <button
              onClick={async () => {
                setShowLogoutMenu(false)
                await signOut({ callbackUrl: '/auth/login', redirect: true })
              }}
              className="w-full px-4 py-3 text-left flex items-center gap-2 text-sm transition-colors"
              style={{ color: 'var(--pf-text-dim)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--pf-surface-2)'
                e.currentTarget.style.color = 'var(--pf-danger)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--pf-text-dim)'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
