"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/themeContext";
import { useToast } from "@/lib/toastContext";

interface EventType {
  id: string;
  name: string;
  color: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  visibility: string;
  createdById: string;
  eventType?: EventType | null;
}

interface Participant {
  id: string;
  userId: string;
  status: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    profileImageUrl: string | null;
  };
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EventDetailPage({ params }: PageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { primaryColor, primaryHoverColor, primaryLightColor } = useTheme();
  const { showToast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setEventId(p.id));
  }, [params]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && eventId) {
      fetchEvent();
      fetchParticipants();
    }
  }, [status, eventId]);

  const fetchEvent = async () => {
    if (!eventId) return;
    
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data);
      } else {
        router.push("/events");
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l'événement:", error);
      router.push("/events");
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    if (!eventId) return;
    
    try {
      const res = await fetch(`/api/events/${eventId}/participants`);
      if (res.ok) {
        const data = await res.json();
        setParticipants(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des participants:", error);
    }
  };

  const handleDelete = async () => {
    if (!eventId) return;

    setDeleting(true);
    setShowDeleteModal(false);
    
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Événement supprimé avec succès", "success");
        setTimeout(() => {
          router.push("/events");
        }, 1000);
      } else {
        showToast("Erreur lors de la suppression", "error");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      showToast("Erreur lors de la suppression", "error");
    } finally {
      setDeleting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl shadow-lg mb-4 animate-pulse" style={{ backgroundColor: primaryColor }}>
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-slate-300 text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case "public":
        return "🌍 Public";
      case "friends":
        return "👥 Amis seulement";
      case "private":
        return "🔒 Privé";
      default:
        return visibility;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-slate-900/50 to-transparent"></div>
      </div>

      <div className="relative z-10">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 pb-24 md:pb-8">
          {/* Header avec bouton retour */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Retour</span>
            </button>
          </div>

          {/* Carte principale de l'événement */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-700/50 overflow-hidden">
            {/* Header de la carte */}
            <div className="p-6 sm:p-8 border-b border-slate-700/50">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <h1 className="text-3xl sm:text-4xl font-bold text-white">{event.title}</h1>
                <span 
                  className={`px-4 py-2 rounded-2xl text-sm font-medium flex items-center gap-2 w-fit ${
                    event.visibility === 'public' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    event.visibility === 'private' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : ''
                  }`}
                  style={event.visibility === 'friends' ? { 
                    backgroundColor: `${primaryColor}33`,
                    color: primaryLightColor,
                    borderColor: `${primaryColor}50`
                  } : {}}
                >
                  {getVisibilityLabel(event.visibility)}
                </span>
              </div>

              {/* Informations principales */}
              <div className="space-y-4">
                {/* Date */}
                <div className="flex items-start gap-4 bg-slate-800/40 rounded-2xl p-4 border border-slate-700/30">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}33` }}>
                    <svg className="w-6 h-6" style={{ color: primaryLightColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Date et heure</p>
                    <p className="text-white font-medium">{formatDate(event.date)}</p>
                  </div>
                </div>

                {/* Lieu */}
                {event.location && (
                  <div className="flex items-start gap-4 bg-slate-800/40 rounded-2xl p-4 border border-slate-700/30">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}33` }}>
                      <svg className="w-6 h-6" style={{ color: primaryLightColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Lieu</p>
                      <p className="text-white font-medium">{event.location}</p>
                    </div>
                  </div>
                )}

                {/* Type d'événement */}
                {event.eventType && (
                  <div className="flex items-start gap-4 bg-slate-800/40 rounded-2xl p-4 border border-slate-700/30">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${event.eventType.color}33` }}
                    >
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: event.eventType.color }}
                      ></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Type</p>
                      <p className="text-white font-medium">{event.eventType.name}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="p-6 sm:p-8 border-b border-slate-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}33` }}>
                    <svg className="w-5 h-5" style={{ color: primaryLightColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white">Description</h2>
                </div>
                <div className="bg-slate-800/30 rounded-2xl p-4">
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              </div>
            )}

            {/* Participants */}
            {participants.length > 0 && (
              <div className="p-6 sm:p-8 border-b border-slate-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}33` }}>
                    <svg className="w-5 h-5" style={{ color: primaryLightColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Participants <span className="text-slate-400">({participants.length})</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors bg-slate-800/40 border-slate-700/30 hover:border-slate-600/50 ${participant.status === "creator" ? "ring-2 ring-yellow-400 bg-yellow-900/30 border-yellow-400/40" : ""}`}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden"
                        style={{ backgroundColor: participant.status === "creator" ? "#facc15" : primaryColor }}
                      >
                        {participant.user.profileImageUrl ? (
                          <img
                            src={participant.user.profileImageUrl}
                            alt={participant.user.name || "Photo de profil"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{participant.user.name?.[0] || participant.user.email[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate flex items-center gap-2">
                          {participant.user.name || participant.user.email}
                          {participant.status === "creator" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-300 text-xs font-semibold ml-2">
                              <span className="text-lg">👑</span> Créateur
                            </span>
                          )}
                        </p>
                        {participant.user.name && (
                          <p className="text-slate-500 text-xs truncate">{participant.user.email}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions - Visible uniquement pour le créateur */}
            {session?.user && (session.user as any).id === event.createdById && (
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => router.push(`/events/${event.id}/edit`)}
                  className="flex-1 px-6 py-3 rounded-2xl font-semibold text-white transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2"
                  style={{ backgroundColor: primaryColor }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = primaryHoverColor}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Modifier
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deleting}
                  className="px-6 py-3 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-2xl font-semibold transition-all border border-red-500/30 hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {deleting ? "Suppression..." : "Supprimer"}
                  </button>
              </div>
            )}
          </div>
        </div>
      </div>      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-700/50 max-w-md w-full p-6 animate-slide-up">
            {/* Icon d'avertissement */}
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            {/* Titre */}
            <h3 className="text-xl font-bold text-white text-center mb-2">
              Supprimer l'événement ?
            </h3>

            {/* Message */}
            <p className="text-slate-400 text-center mb-6">
              Cette action est irréversible. L'événement "{event?.title}" sera définitivement supprimé.
            </p>

            {/* Boutons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 text-white rounded-2xl font-semibold transition-all border border-slate-700"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
