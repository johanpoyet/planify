'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Invitation {
  id: string
  eventId: string
  status: string
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
      image: string | null
    } | null
  } | null
}

export default function InvitationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchInvitations()
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
    try {
      const res = await fetch(`/api/events/${eventId}/participants/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (res.ok) {
        // Retirer l'invitation de la liste
        setInvitations((prev) => prev.filter((inv) => inv.eventId !== eventId))
        
        // Si acceptée, rediriger vers les événements
        if (action === 'accept') {
          router.push('/events')
        }
      } else {
        alert('Erreur lors de la réponse à l\'invitation')
      }
    } catch (error) {
      console.error('Erreur:', error)
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-20">
      {/* En-tête responsive */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 safe-area-top">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/events"
              className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="hidden sm:inline">Retour</span>
            </Link>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              📬 Invitations en attente
            </h1>
            <div className="w-6 sm:w-20"></div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {invitations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">Aucune invitation en attente</p>
            <Link
              href="/events"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
            >
              Retour aux événements
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {invitations.map((invitation) => {
              const event = invitation.event
              if (!event) return null

              const isProcessing = processing === event.id

              return (
                <div
                  key={invitation.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Barre de couleur - on utilise une couleur par défaut */}
                  <div className="h-2 bg-blue-500"></div>

                  <div className="p-4">
                    {/* Info créateur */}
                    <div className="flex items-center gap-2 mb-3">
                      {event.creator?.image ? (
                        <img
                          src={event.creator.image}
                          alt={event.creator.name || ''}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                          {event.creator?.name?.[0] ||
                            event.creator?.email[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-gray-900">
                            {event.creator?.name || event.creator?.email}
                          </span>{' '}
                          vous invite à
                        </p>
                      </div>
                    </div>

                  {/* Titre et description */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {event.title}
                  </h3>
                  {event.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  {/* Date et lieu */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg
                        className="w-4 h-4 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>
                        {new Date(event.date).toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        à{' '}
                        {new Date(event.date).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg
                          className="w-4 h-4 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        const userId = await getCurrentUserId()
                        if (userId) {
                          handleResponse(event.id, userId, 'decline')
                        }
                      }}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-feedback"
                    >
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
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md touch-feedback"
                    >
                      {isProcessing ? 'Traitement...' : 'Accepter'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        )}
      </div>
    </div>
  )
}
