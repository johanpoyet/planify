"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import CalendarView from "../components/CalendarView";

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  visibility: string;
  createdById: string;
}

export default function EventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [invitationsCount, setInvitationsCount] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchEvents();
      fetchInvitationsCount();
    }
  }, [status]);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
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

  const fetchInvitationsCount = async () => {
    try {
      const res = await fetch("/api/events/invitations/count");
      if (res.ok) {
        const data = await res.json();
        setInvitationsCount(data.count || 0);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du compteur d'invitations:", error);
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
      case "private":
        return "🔒";
      default:
        return "📅";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pb-4">
      {/* Header Responsive */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                📅 Mes événements
              </h1>
              <p className="text-sm text-gray-600 mt-0.5">
                {session?.user?.name || session?.user?.email}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link
                href="/events/new"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <span className="text-lg">➕</span>
                <span>Nouvel événement</span>
              </Link>
              <Link
                href="/events/invitations"
                className="relative px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition text-sm font-medium flex items-center gap-2 shadow-sm hover:shadow"
              >
                <span className="text-lg">📬</span>
                <span>Invitations</span>
                {invitationsCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1.5">
                    {invitationsCount > 9 ? '9+' : invitationsCount}
                  </span>
                )}
              </Link>
              <Link
                href="/events/shared"
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium flex items-center gap-2 shadow-sm hover:shadow"
              >
                <span className="text-lg">🌐</span>
                <span>Partagés</span>
              </Link>
              <Link
                href="/friends"
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm font-medium flex items-center gap-2 shadow-sm hover:shadow"
              >
                <span className="text-lg">👥</span>
                <span>Amis</span>
              </Link>
              <Link
                href="/settings"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium flex items-center gap-2 shadow-sm hover:shadow"
              >
                <span className="text-lg">⚙️</span>
                <span>Paramètres</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium flex items-center gap-2 shadow-sm hover:shadow"
              >
                <span className="text-lg">🚪</span>
                <span>Déconnexion</span>
              </button>
            </div>
          </div>

          {/* Toggle vue liste/calendrier */}
          <div className="flex gap-2 max-w-xs">
            <button
              onClick={() => setViewMode("list")}
              className={`flex-1 px-4 py-2 rounded-lg transition text-sm font-medium ${
                viewMode === "list"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              📋 Liste
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex-1 px-4 py-2 rounded-lg transition text-sm font-medium ${
                viewMode === "calendar"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              📆 Calendrier
            </button>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {viewMode === "list" ? (
          events.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-8 text-center">
              <div className="text-5xl mb-3">📭</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Aucun événement
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Commencez par créer votre premier événement !
              </p>
            </div>
          ) : (
            // Vue liste - Responsive
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="block bg-white rounded-xl shadow-sm hover:shadow-md p-4 transition-all hover:scale-[1.02]"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">
                      {getVisibilityIcon(event.visibility)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 mb-1 truncate">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        🕒 {formatDate(event.date)}
                      </p>
                      {event.location && (
                        <p className="text-sm text-gray-600 mb-1 truncate">
                          📍 {event.location}
                        </p>
                      )}
                      {event.description && (
                        <p className="text-sm text-gray-700 line-clamp-2 mt-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <svg 
                      className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          // Vue calendrier
          <CalendarView events={events} />
        )}
      </div>
    </div>
  );
}
