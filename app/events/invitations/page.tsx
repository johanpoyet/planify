'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

export default function InvitationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { primaryColor, primaryHoverColor, primaryLightColor } = useTheme()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [hiddenInvitations, setHiddenInvitations] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchInvitations()

      // Polling réduit à 30 secondes pour réduire la charge serveur
      const interval = setInterval(fetchInvitations, 30000)
      return () => clearInterval(interval)
    }
  }, [status])

  const fetchInvitations = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/events/invitations')
      if (res.ok) {
        const data = await res.json()
        setInvitations(data)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResponse = async (
    eventId: string,
    userId: string,
    action: 'accept' | 'decline'
  ) => {
    setProcessing(eventId)
    // Masquer immédiatement l'invitation
    setHiddenInvitations(prev => new Set(prev).add(eventId))
    
    try {
      const res = await fetch(`/api/events/${eventId}/participants/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (res.ok) {
        // Retirer l'invitation de la liste après un court délai
        setTimeout(() => {
          setInvitations((prev) => prev.filter((inv) => inv.eventId !== eventId))
        }, 300)
        
        // Si acceptée, afficher un message de succès
        if (action === 'accept') {
          setTimeout(() => router.push('/events'), 1000)
        }
      } else {
        // En cas d'erreur, réafficher l'invitation
        setHiddenInvitations(prev => {
          const newSet = new Set(prev)
          newSet.delete(eventId)
          return newSet
        })
        alert('Erreur lors de la réponse à l\'invitation')
      }
    } catch (error) {
      console.error('Erreur:', error)
      // En cas d'erreur, réafficher l'invitation
      setHiddenInvitations(prev => {
        const newSet = new Set(prev)
        newSet.delete(eventId)
        return newSet
      })
      alert('Erreur lors de la réponse à l\'invitation')
    } finally {
      setProcessing(null)
    }
  }

  // Fonction helper pour obtenir l'userId
  const getCurrentUserId = async (): Promise<string | null> => {
    try {
      const sessionRes = await fetch('/api/auth/session')
      const sessionData = await sessionRes.json()
      
      if (sessionData?.user?.email) {
        const userRes = await fetch(`/api/users?email=${sessionData.user.email}`)
        const userData = await userRes.json()
        return userData?.id || null
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du userId:', error)
    }
    return null
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl shadow-2xl mb-4 animate-pulse" style={{ backgroundColor: primaryColor }}>
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-slate-300 text-lg">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Subtle background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-slate-900/30 to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between mb-2">
            <Link
              href="/events"
              className="md:hidden p-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700"
            >
              <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex-1 md:ml-0 ml-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Notifications</h1>
              <p className="text-slate-400 text-sm mt-1">
                {invitations.length} invitation{invitations.length > 1 ? 's' : ''} en attente
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 pb-24 md:pb-8">
          {invitations.length === 0 ? (
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 p-8 sm:p-12 text-center">
              <div className="w-24 h-24 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-300 mb-3">Aucune notification</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                Vous n'avez aucune invitation en attente pour le moment
              </p>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/50 hover:bg-slate-800 text-white rounded-2xl transition-all border border-slate-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Retour à l'accueil</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => {
                const event = invitation.event
                if (!event) return null

                // Ne pas afficher les invitations masquées
                if (hiddenInvitations.has(event.id)) {
                  return null
                }

                const isProcessing = processing === event.id
                const eventDate = new Date(event.date)
                const isPoll = invitation.type === 'poll'

                return (
                  <div
                    key={invitation.id}
                    className="bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden animate-slide-up"
                  >
                    {/* Colored bar */}
                    <div className="h-1" style={{ backgroundColor: primaryColor }}></div>

                    <div className="p-6">
                      {/* Creator info */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold ring-2 ring-slate-700" style={{ backgroundColor: primaryColor }}>
                          {event.creator?.name?.[0]?.toUpperCase() ||
                            event.creator?.email[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-300 text-sm">
                            <span className="font-semibold text-white">
                              {event.creator?.name || event.creator?.email}
                            </span>{' '}
                            {isPoll ? 'vous a envoyé un sondage' : 'vous invite à un événement'}
                          </p>
                          <p className="text-slate-500 text-xs mt-1">
                            {(() => {
                              // Essayer d'utiliser createdAt, sinon l'ID de l'invitation, sinon la date de l'événement
                              const dateToUse = invitation.createdAt || event.date
                              if (!dateToUse) return ''

                              const createdDate = new Date(dateToUse)
                              if (isNaN(createdDate.getTime())) return ''

                              const diffMs = Date.now() - createdDate.getTime()

                              // Si la différence est négative (date future), ne rien afficher
                              if (diffMs < 0) return ''

                              const hours = Math.floor(diffMs / (1000 * 60 * 60))
                              if (hours < 1) {
                                const minutes = Math.floor(diffMs / (1000 * 60))
                                return `Il y a ${minutes} min`
                              }
                              if (hours < 24) {
                                return `Il y a ${hours}h`
                              }
                              const days = Math.floor(hours / 24)
                              return `Il y a ${days} jour${days > 1 ? 's' : ''}`
                            })()}
                          </p>
                        </div>
                      </div>

                      {/* Event details */}
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                        {event.description && (
                          <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                            {event.description}
                          </p>
                        )}

                        {/* Date and location */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <svg className="w-4 h-4 flex-shrink-0" style={{ color: primaryLightColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>
                              {eventDate.toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                              })}{' '}
                              à{' '}
                              {eventDate.toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <svg className="w-4 h-4 flex-shrink-0" style={{ color: primaryLightColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="line-clamp-1">{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-3">
                        {isPoll ? (
                          // Bouton pour aller voter sur le sondage
                          <button
                            onClick={() => router.push(`/polls/${invitation.pollId}`)}
                            className="flex-1 px-6 py-3 rounded-2xl font-medium text-white flex items-center justify-center gap-2 shadow-xl transition"
                            style={{ backgroundColor: primaryColor }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = primaryHoverColor)}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = primaryColor)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            Voter maintenant
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={async () => {
                                const userId = await getCurrentUserId()
                                if (userId) {
                                  handleResponse(event.id, userId, 'decline')
                                }
                              }}
                              disabled={isProcessing}
                              className="flex-1 px-6 py-3 bg-slate-800/50 hover:bg-slate-800 text-white rounded-2xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 flex items-center justify-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              {isProcessing ? 'Traitement...' : 'Refuser'}
                            </button>
                            <button
                              onClick={async () => {
                                const userId = await getCurrentUserId()
                                if (userId) {
                                  handleResponse(event.id, userId, 'accept')
                                }
                              }}
                              disabled={isProcessing}
                              className="flex-1 px-6 py-3 rounded-2xl font-medium text-white flex items-center justify-center gap-2 shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{ backgroundColor: primaryColor }}
                              onMouseEnter={(e) => !isProcessing && (e.currentTarget.style.backgroundColor = primaryHoverColor)}
                              onMouseLeave={(e) => !isProcessing && (e.currentTarget.style.backgroundColor = primaryColor)}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {isProcessing ? 'Traitement...' : 'Accepter'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
