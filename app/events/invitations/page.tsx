'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/themeContext'

interface Invitation {
  id: string
  eventId: string
  pollId?: string
  status: string
  type?: 'event' | 'poll'
  createdAt?: string
  event: {
    id: string
    title: string
    description: string | null
    date: string
    location: string | null
    creator: {
      id: string
      name: string | null
      email: string
    } | null
  } | null
}

type FilterTab = 'all' | 'week' | 'later'

const AVATAR_COLORS = ['#7C5CFF', '#FF7A45', '#4FD18B', '#4F8BFF', '#FF6BD6', '#FFB454', '#5CE0E0', '#E8FF6B']

function getAvatarColor(name: string) {
  const idx = name.split('').reduce((acc, c) => acc + (c.codePointAt(0) ?? 0), 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

function isThisWeek(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  return date >= now && date <= weekFromNow
}

function formatEventMeta(date: Date, location: string | null) {
  const dateStr = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()
  const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return location ? `${dateStr} · ${timeStr} · ${location}` : `${dateStr} · ${timeStr}`
}

export default function InvitationsPage() {
  const { status } = useSession()
  const router = useRouter()
  const { primaryColor } = useTheme()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [hiddenInvitations, setHiddenInvitations] = useState<Set<string>>(new Set())
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') fetchInvitations()
  }, [status])

  const fetchInvitations = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/events/invitations')
      if (res.ok) {
        const data = await res.json()
        setInvitations(data)
        if (data.length > 0 && data[0].event) setSelectedId(data[0].event.id)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeInvitation = (eventId: string) => {
    setInvitations(prev => prev.filter(inv => inv.eventId !== eventId))
    setSelectedId(prev => {
      if (prev !== eventId) return prev
      const remaining = invitations.find(inv => inv.eventId !== eventId && inv.event)
      return remaining?.event?.id ?? null
    })
  }

  const revertHidden = (eventId: string) => {
    setHiddenInvitations(prev => { const s = new Set(prev); s.delete(eventId); return s })
  }

  const handleResponse = async (eventId: string, action: 'accept' | 'decline' | 'maybe') => {
    setProcessing(eventId)
    setHiddenInvitations(prev => new Set(prev).add(eventId))
    try {
      const sessionRes = await fetch('/api/auth/session')
      const sessionData = await sessionRes.json()
      if (!sessionData?.user?.email) return
      const userRes = await fetch(`/api/users?email=${sessionData.user.email}`)
      const userData = await userRes.json()
      const userId = userData?.id
      if (!userId) return

      const apiAction = action === 'maybe' ? 'accept' : action
      const res = await fetch(`/api/events/${eventId}/participants/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: apiAction }),
      })
      if (res.ok) {
        setTimeout(() => removeInvitation(eventId), 300)
        if (action === 'accept') setTimeout(() => router.push('/events'), 1000)
      } else {
        revertHidden(eventId)
      }
    } catch {
      revertHidden(eventId)
    } finally {
      setProcessing(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--pf-bg)' }}>
        <p className="text-sm" style={{ color: 'var(--pf-text-dim)' }}>Chargement…</p>
      </div>
    )
  }

  const hasEvent = (inv: Invitation): inv is Invitation & { event: NonNullable<Invitation['event']> } => !!inv.event
  const visible = invitations.filter(inv => hasEvent(inv) && !hiddenInvitations.has(inv.event.id))
  const thisWeek = visible.filter(inv => hasEvent(inv) && isThisWeek(inv.event.date))
  const later = visible.filter(inv => hasEvent(inv) && !isThisWeek(inv.event.date))
  let filtered: typeof visible
  if (activeFilter === 'week') filtered = thisWeek
  else if (activeFilter === 'later') filtered = later
  else filtered = visible
  const effectiveSelectedId = selectedId ?? visible[0]?.event?.id ?? null
  const selectedInvitation = visible.find(inv => inv.event?.id === effectiveSelectedId)

  return (
    <div style={{ background: 'var(--pf-bg)', color: 'var(--pf-text)' }}>

      {/* ── MOBILE ─────────────────────────────────────────────────── */}
      <div className="md:hidden min-h-screen">
        {/* Header */}
        <div className="px-5 pt-6 pb-3 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase mb-1" style={{ color: 'var(--pf-text-muted)', letterSpacing: '0.08em' }}>
              Boîte de réception
            </p>
            <h1 className="font-semibold" style={{ fontSize: 26, letterSpacing: '-0.025em' }}>Invitations</h1>
          </div>
          <button
            className="flex items-center justify-center rounded-lg"
            style={{ width: 36, height: 36, background: 'var(--pf-surface)', border: '1px solid var(--pf-border)', color: 'var(--pf-text-dim)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Filter chips */}
        <div className="px-5 pb-3">
          <div className="flex gap-2" style={{ overflowX: 'auto' }}>
            {([
              { key: 'all' as FilterTab, label: `Toutes · ${visible.length}` },
              { key: 'week' as FilterTab, label: `Cette semaine · ${thisWeek.length}` },
              { key: 'later' as FilterTab, label: `Plus tard · ${later.length}` },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap"
                style={activeFilter === tab.key ? {
                  background: `${primaryColor}24`,
                  color: primaryColor,
                  border: '1px solid transparent'
                } : {
                  background: 'var(--pf-surface-2)',
                  color: 'var(--pf-text-dim)',
                  border: '1px solid var(--pf-border)'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div className="px-4 pb-28" style={{ paddingTop: 4 }}>
          {filtered.length === 0 ? (
            <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--pf-surface)', border: '1px solid var(--pf-border)' }}>
              <div className="inline-flex items-center justify-center rounded-2xl mb-4" style={{ width: 56, height: 56, background: 'var(--pf-surface-2)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--pf-text-muted)' }}>
                  <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                </svg>
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--pf-text-dim)' }}>Aucune invitation</p>
              <p className="text-xs" style={{ color: 'var(--pf-text-muted)' }}>Tu n'as aucune invitation en attente pour le moment.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((invitation) => {
                const event = invitation.event
                const isProcessing = processing === event.id
                const isPoll = invitation.type === 'poll'
                const creatorName = event.creator?.name || event.creator?.email || '?'
                const firstName = creatorName.split(' ')[0]
                const avatarColor = getAvatarColor(creatorName)
                const eventDate = new Date(event.date)

                return (
                  <div
                    key={invitation.id}
                    className="rounded-2xl transition-all duration-300"
                    style={{
                      background: 'var(--pf-surface)',
                      border: '1px solid var(--pf-border)',
                      opacity: hiddenInvitations.has(event.id) ? 0 : 1,
                      transform: hiddenInvitations.has(event.id) ? 'translateY(-4px)' : 'none',
                    }}
                  >
                    <div className="p-4">
                      {/* Creator + event info */}
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className="flex items-center justify-center text-xs font-bold text-white rounded-full flex-shrink-0"
                          style={{ width: 36, height: 36, background: avatarColor }}
                        >
                          {creatorName[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm" style={{ color: 'var(--pf-text-dim)' }}>
                            <span className="font-semibold" style={{ color: 'var(--pf-text)' }}>{firstName}</span>
                            {' '}{isPoll ? 'vous a envoyé un sondage' : "t'invite à"}
                          </p>
                          <p className="font-semibold mt-0.5" style={{ fontSize: 16, letterSpacing: '-0.015em' }}>{event.title}</p>
                          <p className="font-mono text-xs mt-1" style={{ color: 'var(--pf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {formatEventMeta(eventDate, event.location)}
                          </p>
                        </div>
                      </div>

                      {/* Note */}
                      {event.description && (
                        <div
                          className="text-sm mb-3"
                          style={{
                            background: 'var(--pf-surface-2)',
                            padding: '10px 12px',
                            borderRadius: 8,
                            fontStyle: 'italic',
                            color: 'var(--pf-text-dim)',
                            lineHeight: 1.5,
                          }}
                        >
                          "{event.description.length > 80 ? event.description.slice(0, 80) + '…' : event.description}"
                        </div>
                      )}

                      {/* Actions */}
                      {isPoll ? (
                        <button
                          onClick={() => router.push(`/polls/${invitation.pollId}`)}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                          style={{ background: primaryColor }}
                        >
                          Voter maintenant
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResponse(event.id, 'accept')}
                            disabled={isProcessing}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
                            style={{ background: primaryColor }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            {isProcessing ? '…' : 'Je viens'}
                          </button>
                          <button
                            onClick={() => handleResponse(event.id, 'maybe')}
                            disabled={isProcessing}
                            className="flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
                            style={{ background: 'var(--pf-surface-2)', border: '1px solid var(--pf-border)', color: 'var(--pf-text-dim)' }}
                          >
                            {isProcessing ? '…' : 'Peut-être'}
                          </button>
                          <button
                            onClick={() => handleResponse(event.id, 'decline')}
                            disabled={isProcessing}
                            className="flex items-center justify-center rounded-xl disabled:opacity-50"
                            style={{ width: 42, height: 42, background: 'var(--pf-surface-2)', border: '1px solid var(--pf-border)', color: 'var(--pf-text-muted)', flexShrink: 0 }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── DESKTOP ────────────────────────────────────────────────── */}
      <div className="hidden md:block">
        {/* Topbar */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-8"
          style={{ height: 56, borderBottom: '1px solid var(--pf-border)', background: 'var(--pf-bg)' }}
        >
          <div className="flex items-center gap-3">
            <h1 className="font-semibold" style={{ fontSize: 20, letterSpacing: '-0.02em' }}>Invitations</h1>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: 'var(--pf-surface-2)', color: 'var(--pf-text-dim)', border: '1px solid var(--pf-border)' }}
            >
              {visible.length} en attente
            </span>
          </div>
          <div className="flex gap-2">
            <button
              className="text-sm font-medium px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--pf-surface)', border: '1px solid var(--pf-border)', color: 'var(--pf-text-dim)' }}
            >
              Tout marquer comme lu
            </button>
            <button
              className="text-sm font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              style={{ background: 'var(--pf-surface)', border: '1px solid var(--pf-border)', color: 'var(--pf-text-dim)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
              Filtrer
            </button>
          </div>
        </div>

        {/* Split layout */}
        <div className="flex" style={{ minHeight: 'calc(100vh - 56px)' }}>
          {/* Inbox list */}
          <div
            className="flex-shrink-0 overflow-y-auto"
            style={{ width: 420, borderRight: '1px solid var(--pf-border)' }}
          >
            {visible.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm" style={{ color: 'var(--pf-text-muted)' }}>Aucune invitation en attente</p>
              </div>
            ) : (
              visible.map((invitation) => {
                const event = invitation.event
                const creatorName = event.creator?.name || event.creator?.email || '?'
                const avatarColor = getAvatarColor(creatorName)
                const eventDate = new Date(event.date)
                const dateStr = eventDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
                const isSelected = effectiveSelectedId === event.id

                return (
                  <div
                    key={invitation.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(event.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedId(event.id) }}
                    className="relative cursor-pointer"
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid var(--pf-border)',
                      background: isSelected ? 'var(--pf-surface)' : 'transparent',
                    }}
                  >
                    {isSelected && (
                      <div style={{ position: 'absolute', left: 0, top: 16, bottom: 16, width: 2, background: primaryColor, borderRadius: 2 }} />
                    )}
                    <div className="flex items-start gap-3">
                      <div
                        className="flex items-center justify-center text-xs font-bold text-white rounded-full flex-shrink-0"
                        style={{ width: 36, height: 36, background: avatarColor }}
                      >
                        {creatorName[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold" style={{ color: 'var(--pf-text)' }}>{creatorName}</span>
                          <span className="font-mono text-xs" style={{ color: 'var(--pf-text-muted)' }}>{dateStr}</span>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--pf-text-dim)' }}>{event.title}</p>
                        {event.location && (
                          <p className="text-xs mt-0.5" style={{ color: 'var(--pf-text-muted)' }}>{event.location}</p>
                        )}
                        {event.description && (
                          <p className="text-xs mt-1.5" style={{ color: 'var(--pf-text-muted)', fontStyle: 'italic' }}>
                            "{event.description.length > 45 ? event.description.slice(0, 45) + '…' : event.description}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Detail view */}
          <div className="flex-1 overflow-y-auto" style={{ padding: '40px 56px', background: 'var(--pf-bg-2)' }}>
            {selectedInvitation?.event ? (
              <DesktopDetail
                key={effectiveSelectedId ?? ''}
                invitation={selectedInvitation}
                primaryColor={primaryColor}
                processing={processing}
                onResponse={handleResponse}
                onPoll={(pollId) => router.push(`/polls/${pollId}`)}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm" style={{ color: 'var(--pf-text-muted)' }}>
                  {visible.length === 0 ? 'Aucune invitation en attente' : 'Sélectionne une invitation'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

type WithEvent = Invitation & { event: NonNullable<Invitation['event']> }

interface Participant {
  id: string
  userId: string
  status: string
  user: { id: string; name: string | null; email: string } | null
}

function DesktopDetail({
  invitation,
  primaryColor,
  processing,
  onResponse,
  onPoll,
}: Readonly<{
  invitation: WithEvent
  primaryColor: string
  processing: string | null
  onResponse: (eventId: string, action: 'accept' | 'decline' | 'maybe') => void
  onPoll: (pollId: string) => void
}>) {
  const event = invitation.event
  const creatorName = event.creator?.name || event.creator?.email || '?'
  const avatarColor = getAvatarColor(creatorName)
  const eventDate = new Date(event.date)
  const isProcessing = processing === event.id
  const isPoll = invitation.type === 'poll'

  const [participants, setParticipants] = useState<Participant[]>([])

  const fetchParticipants = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${event.id}/participants`)
      if (res.ok) setParticipants(await res.json())
    } catch { /* silent */ }
  }, [event.id])

  useEffect(() => {
    fetchParticipants()
  }, [fetchParticipants])

  const handleResponseAndRefresh = useCallback(async (eventId: string, action: 'accept' | 'decline' | 'maybe') => {
    onResponse(eventId, action)
    // Refetch après un court délai pour que l'API enregistre la réponse
    setTimeout(() => { void fetchParticipants() }, 400)
  }, [onResponse, fetchParticipants])

  const going = participants.filter(p => p.status === 'accepted' || p.status === 'creator')
  const visibleAvatars = going.slice(0, 6)

  return (
    <div style={{ maxWidth: 560 }}>
      {/* Sender */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="flex items-center justify-center font-bold text-white rounded-full flex-shrink-0"
          style={{ width: 48, height: 48, background: avatarColor, fontSize: 16 }}
        >
          {creatorName[0].toUpperCase()}
        </div>
        <div>
          <p className="text-sm" style={{ color: 'var(--pf-text-dim)' }}>Invitation de</p>
          <p className="font-semibold" style={{ color: 'var(--pf-text)' }}>{creatorName}</p>
        </div>
      </div>

      {/* Title */}
      <h2
        className="font-semibold mb-5"
        style={{ fontSize: 36, letterSpacing: '-0.03em', lineHeight: 1.05, color: 'var(--pf-text)' }}
      >
        {event.title}
      </h2>

      {/* Date + location */}
      <div className="flex flex-wrap gap-4 mb-6">
        <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--pf-text-dim)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {eventDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · {eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
        {event.location && (
          <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--pf-text-dim)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {event.location}
          </span>
        )}
      </div>

      {/* RSVP card */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--pf-surface)', border: '1px solid var(--pf-border)' }}>
        <p className="text-sm font-semibold mb-4" style={{ color: 'var(--pf-text)' }}>Ta réponse</p>
        {isPoll ? (
          <button
            onClick={() => invitation.pollId && onPoll(invitation.pollId)}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: primaryColor }}
          >
            Voter maintenant
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => { void handleResponseAndRefresh(event.id, 'accept') }}
              disabled={isProcessing}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: primaryColor }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Je viens
            </button>
            <button
              onClick={() => { void handleResponseAndRefresh(event.id, 'maybe') }}
              disabled={isProcessing}
              className="flex-1 py-3 rounded-xl text-sm font-medium disabled:opacity-50"
              style={{ background: 'var(--pf-surface-2)', border: '1px solid var(--pf-border)', color: 'var(--pf-text-dim)' }}
            >
              Peut-être
            </button>
            <button
              onClick={() => { void handleResponseAndRefresh(event.id, 'decline') }}
              disabled={isProcessing}
              className="flex-1 py-3 rounded-xl text-sm font-medium disabled:opacity-50"
              style={{ background: 'var(--pf-surface-2)', border: '1px solid var(--pf-border)', color: 'var(--pf-text-dim)' }}
            >
              Je ne peux pas
            </button>
          </div>
        )}
      </div>

      {/* Qui y va déjà */}
      {going.length > 0 && (
        <div className="rounded-2xl mb-4" style={{ padding: 16, background: 'var(--pf-surface)', border: '1px solid var(--pf-border)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: 'var(--pf-text)' }}>Qui y va déjà</p>
            <span className="text-xs" style={{ color: 'var(--pf-text-muted)' }}>
              {going.length} sur {participants.length}
            </span>
          </div>
          <div style={{ display: 'flex' }}>
            {visibleAvatars.map((p, i) => {
              const name = p.user?.name || p.user?.email || '?'
              const color = getAvatarColor(name)
              return (
                <div
                  key={p.id}
                  title={name}
                  style={{
                    width: 28, height: 28,
                    borderRadius: '50%',
                    marginLeft: i === 0 ? 0 : -8,
                    border: '2px solid var(--pf-bg-2)',
                    background: color,
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 600, color: '#fff',
                  }}
                >
                  {(() => { const pts = name.trim().split(/\s+/).filter(Boolean); return pts.length >= 2 ? (pts[0][0]+pts[pts.length-1][0]).toUpperCase() : name.slice(0,2).toUpperCase(); })()}
                </div>
              )
            })}
            {going.length > 6 && (
              <div
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  marginLeft: -8, border: '2px solid var(--pf-bg-2)',
                  background: 'var(--pf-surface-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 600, color: 'var(--pf-text-dim)',
                  flexShrink: 0,
                }}
              >
                +{going.length - 6}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note */}
      {event.description && (
        <p className="text-sm" style={{ color: 'var(--pf-text-dim)', fontStyle: 'italic', lineHeight: 1.6 }}>
          Note : "{event.description}"
        </p>
      )}
    </div>
  )
}
