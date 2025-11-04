"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  visibility: string;
  createdById: string;
}

interface Participant {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EventDetailPage({ params }: PageProps) {
  const { status } = useSession();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
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
    if (!eventId || !confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/events");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Bouton retour */}
        <Link
          href="/events"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          ← Retour aux événements
        </Link>

        {/* Carte de l'événement */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-start justify-between mb-6">
            <h1 className="text-4xl font-bold text-gray-800">{event.title}</h1>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {getVisibilityLabel(event.visibility)}
            </span>
          </div>

          <div className="space-y-4">
            {/* Date */}
            <div className="flex items-start gap-3">
              <span className="text-2xl">🕒</span>
              <div>
                <p className="text-sm text-gray-500">Date et heure</p>
                <p className="text-lg text-gray-800">{formatDate(event.date)}</p>
              </div>
            </div>

            {/* Lieu */}
            {event.location && (
              <div className="flex items-start gap-3">
                <span className="text-2xl">📍</span>
                <div>
                  <p className="text-sm text-gray-500">Lieu</p>
                  <p className="text-lg text-gray-800">{event.location}</p>
                </div>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="flex items-start gap-3">
                <span className="text-2xl">📝</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-700 mt-1 whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              </div>
            )}

            {/* Participants */}
            {participants.length > 0 && (
              <div className="flex items-start gap-3 mt-6 pt-6 border-t border-gray-200">
                <span className="text-2xl">👥</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-3">
                    Participants ({participants.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                          {participant.user.name?.[0] || participant.user.email[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-800">
                          {participant.user.name || participant.user.email}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex gap-4">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
            >
              {deleting ? "Suppression..." : "🗑️ Supprimer"}
            </button>
            <Link
              href={`/events/${event.id}/edit`}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              ✏️ Modifier
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
