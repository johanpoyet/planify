'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from '@/lib/themeContext'
import { useState } from 'react'

export default function DesktopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { primaryColor, primaryHoverColor } = useTheme()
  const [showLogoutMenu, setShowLogoutMenu] = useState(false)

  // Ne pas afficher la nav sur les pages d'authentification
  if (!session || pathname?.startsWith('/auth')) {
    return null
  }

  const isActive = (path: string) => {
    if (path === '/events') {
      return pathname === '/events' || pathname === '/'
    }
    return pathname?.startsWith(path)
  }

  return (
    <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/events" className="flex items-center gap-2 group">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-105 transition"
              style={{ backgroundColor: primaryColor }}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">
              Planify
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <Link
              href="/events"
              className="flex items-center gap-2 px-4 py-2 rounded-2xl font-medium transition text-slate-300 hover:text-white hover:bg-slate-800/50"
              style={isActive('/events') ? { backgroundColor: primaryColor, color: 'white' } : {}}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Accueil</span>
            </Link>

            <Link
              href="/events/invitations"
              className="relative flex items-center gap-2 px-4 py-2 rounded-2xl font-medium transition text-slate-300 hover:text-white hover:bg-slate-800/50"
              style={isActive('/events/invitations') ? { backgroundColor: primaryColor, color: 'white' } : {}}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span>Notifications</span>
            </Link>

            {/* Gros bouton + central comme en mobile */}
            <Link
              href="/events/new"
              className="relative mx-2 group"
            >
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110"
                style={{ backgroundColor: primaryColor }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = primaryHoverColor}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
              >
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </Link>

            <Link
              href="/friends"
              className="flex items-center gap-2 px-4 py-2 rounded-2xl font-medium transition text-slate-300 hover:text-white hover:bg-slate-800/50"
              style={isActive('/friends') ? { backgroundColor: primaryColor, color: 'white' } : {}}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Amis</span>
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 rounded-2xl font-medium transition text-slate-300 hover:text-white hover:bg-slate-800/50"
              style={isActive('/settings') ? { backgroundColor: primaryColor, color: 'white' } : {}}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Paramètres</span>
            </Link>
          </div>

          {/* User profile */}
          <div className="relative flex items-center gap-3">
            <button
              onClick={() => setShowLogoutMenu(!showLogoutMenu)}
              className="flex items-center gap-3 hover:opacity-80 transition"
            >
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || ''}
                  className="w-10 h-10 rounded-2xl ring-2 ring-slate-700"
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold ring-2 ring-slate-700"
                  style={{ backgroundColor: primaryColor }}
                >
                  {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-white">{session.user?.name || 'Utilisateur'}</p>
                <p className="text-xs text-slate-400">{session.user?.email}</p>
              </div>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Logout dropdown */}
            {showLogoutMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50">
                <button
                  onClick={async () => {
                    await signOut({ redirect: false })
                    router.push('/auth/login')
                  }}
                  className="w-full px-4 py-3 text-left text-slate-300 hover:bg-slate-800 hover:text-white transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Déconnexion</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
