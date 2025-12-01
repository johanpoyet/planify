"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Creator {
  id: string;
  name: string | null;
  email: string;
}

interface SharedEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  visibility: string;
  createdById: string;
  creator: Creator;
}

export default function SharedEventsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<SharedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchEvents();
    }
  }, [status]);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events/shared");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des événements:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </div>
    );
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

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "public":
        return "🌍";
      case "friends":
        return "👥";
      default:
        return "📅";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                🌐 Événements partagés
              </h1>
              <p className="text-gray-600 mt-1">
                Découvrez les événements de vos amis
              </p>
            </div>
            <Link
              href="/events"
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              ← Mes événements
            </Link>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {events.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Aucun événement partagé
            </h2>
            <p className="text-gray-600 mb-6">
              Vos amis n'ont pas encore d'événements publics ou partagés avec vous.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/friends"
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                👥 Voir mes amis
              </Link>
              <Link
                href="/events/new"
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition"
              >
                + Créer un événement
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Titre et créateur */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">
                        {getVisibilityIcon(event.visibility)}
                      </span>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {event.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Par {event.creator.name || event.creator.email}
                        </p>
                      </div>
                    </div>

                    {/* Date */}
                    <p className="text-gray-600 mb-2">
                      🕒 {formatDate(event.date)}
                    </p>

                    {/* Lieu */}
                    {event.location && (
                      <p className="text-gray-600 mb-2">
                        📍 {event.location}
                      </p>
                    )}

                    {/* Description */}
                    {event.description && (
                      <p className="text-gray-700 mt-3">{event.description}</p>
                    )}

                    {/* Badge visibilité */}
                    <div className="mt-4">
                      <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {event.visibility === "public"
                          ? "🌍 Public"
                          : "👥 Amis uniquement"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
