"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/themeContext";

interface Friend {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Friendship {
  id: string;
  friend: Friend;
  status: string;
  isReceiver: boolean;
  createdAt: string;
}

export default function FriendsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { primaryColor, primaryHoverColor, primaryLightColor } = useTheme();
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState<"all" | "accepted" | "pending">("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchFriends();
    }
  }, [status, filter]);

  const fetchFriends = async () => {
    try {
      const res = await fetch(`/api/friends?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setFriendships(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des amis:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");
    setSearching(true);

    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendEmail: searchEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi");
      }

      setSearchEmail("");
      fetchFriends();
      alert("Demande envoyée avec succès !");
    } catch (err: any) {
      setSearchError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleAccept = async (friendshipId: string) => {
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });

      if (res.ok) {
        fetchFriends();
      }
    } catch (error) {
      console.error("Erreur lors de l'acceptation:", error);
    }
  };

  const handleReject = async (friendshipId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir refuser cette demande ?")) {
      return;
    }

    try {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });

      if (res.ok) {
        fetchFriends();
      }
    } catch (error) {
      console.error("Erreur lors du refus:", error);
    }
  };

  const handleRemove = async (friendshipId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir retirer cet ami ?")) {
      return;
    }

    try {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchFriends();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-xl text-slate-300 animate-pulse">Chargement...</div>
      </div>
    );
  }

  const acceptedFriends = friendships.filter((f) => f.status === "accepted");
  const pendingReceived = friendships.filter(
    (f) => f.status === "pending" && f.isReceiver
  );
  const pendingSent = friendships.filter(
    (f) => f.status === "pending" && !f.isReceiver
  );

  return (
    <div className="min-h-screen bg-slate-950 pb-24 md:pb-8">
      {/* Subtle background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-slate-900/30 to-transparent"></div>
      </div>

      <div className="relative max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl shadow-2xl p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8" style={{ color: primaryLightColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h1 className="text-3xl font-bold text-white">
              Mes amis
            </h1>
          </div>
          <p className="text-slate-400">
            {acceptedFriends.length} ami{acceptedFriends.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Rechercher un ami */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl shadow-2xl p-6 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6" style={{ color: primaryLightColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-white">
              Ajouter un ami
            </h2>
          </div>
          <form onSubmit={handleSendRequest} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Email de votre ami"
              className="flex-1 px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition"
              style={{ borderColor: '#334155' }}
              onFocus={(e) => e.currentTarget.style.borderColor = primaryColor}
              onBlur={(e) => e.currentTarget.style.borderColor = '#334155'}
            />
            <button
              type="submit"
              disabled={searching}
              className="px-6 py-3 text-white font-semibold rounded-2xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
              style={{ backgroundColor: primaryColor }}
              onMouseEnter={(e) => !searching && (e.currentTarget.style.backgroundColor = primaryHoverColor)}
              onMouseLeave={(e) => !searching && (e.currentTarget.style.backgroundColor = primaryColor)}
            >
              {searching ? "Envoi..." : "Envoyer"}
            </button>
          </form>
          {searchError && (
            <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
              <p className="text-red-300 text-sm">{searchError}</p>
            </div>
          )}
        </div>

        {/* Filtres */}
        <div className="flex gap-2 overflow-x-auto pb-2 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <button
            onClick={() => setFilter("all")}
            className={`px-5 py-2.5 rounded-2xl font-medium transition whitespace-nowrap ${
              filter === "all"
                ? "text-white shadow-xl"
                : "bg-slate-900/60 text-slate-300 border border-slate-700 hover:border-slate-600"
            }`}
            style={filter === "all" ? { backgroundColor: primaryColor } : {}}
          >
            Tous ({friendships.length})
          </button>
          <button
            onClick={() => setFilter("accepted")}
            className={`px-5 py-2.5 rounded-2xl font-medium transition whitespace-nowrap ${
              filter === "accepted"
                ? "text-white shadow-xl"
                : "bg-slate-900/60 text-slate-300 border border-slate-700 hover:border-slate-600"
            }`}
            style={filter === "accepted" ? { backgroundColor: primaryColor } : {}}
          >
            Amis ({acceptedFriends.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-5 py-2.5 rounded-2xl font-medium transition whitespace-nowrap ${
              filter === "pending"
                ? "text-white shadow-xl"
                : "bg-slate-900/60 text-slate-300 border border-slate-700 hover:border-slate-600"
            }`}
            style={filter === "pending" ? { backgroundColor: primaryColor } : {}}
          >
            En attente ({pendingReceived.length + pendingSent.length})
          </button>
        </div>

        {/* Demandes reçues */}
        {pendingReceived.length > 0 && (filter === "all" || filter === "pending") && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl shadow-2xl p-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6" style={{ color: primaryLightColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h2 className="text-2xl font-bold text-white">
                Demandes reçues
              </h2>
            </div>
            <div className="space-y-3">
              {pendingReceived.map((friendship) => (
                <div
                  key={friendship.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-950/50 border border-blue-500/20 rounded-2xl hover:border-blue-500/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl shadow-lg">
                      👤
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {friendship.friend.name || "Sans nom"}
                      </p>
                      <p className="text-sm text-slate-400">
                        {friendship.friend.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleAccept(friendship.id)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition shadow-lg shadow-green-500/30"
                    >
                      ✓ Accepter
                    </button>
                    <button
                      onClick={() => handleReject(friendship.id)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-slate-800/80 text-slate-300 font-medium rounded-xl hover:bg-slate-700 transition border border-slate-700"
                    >
                      ✗ Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Demandes envoyées */}
        {pendingSent.length > 0 && (filter === "all" || filter === "pending") && (
          <div className="backdrop-blur-xl bg-slate-900/40 border border-purple-500/20 rounded-3xl shadow-2xl p-6 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6" style={{ color: primaryLightColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <h2 className="text-2xl font-bold text-white">
                Demandes envoyées
              </h2>
            </div>
            <div className="space-y-3">
              {pendingSent.map((friendship) => (
                <div
                  key={friendship.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-950/50 border border-slate-700 rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-xl">
                      👤
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {friendship.friend.name || "Sans nom"}
                      </p>
                      <p className="text-sm text-slate-400">
                        {friendship.friend.email}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">En attente...</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(friendship.id)}
                    className="w-full sm:w-auto px-4 py-2 bg-slate-800/80 text-slate-300 font-medium rounded-xl hover:bg-slate-700 transition border border-slate-700 text-sm"
                  >
                    Annuler
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liste des amis */}
        {acceptedFriends.length > 0 && (filter === "all" || filter === "accepted") ? (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl shadow-2xl p-6 animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-2xl font-bold text-white">
                Mes amis
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {acceptedFriends.map((friendship) => (
                <div
                  key={friendship.id}
                  className="p-4 bg-slate-950/50 border border-slate-700 rounded-2xl hover:border-slate-600 transition group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl shadow-lg" style={{ backgroundColor: primaryColor }}>
                      👤
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">
                        {friendship.friend.name || "Sans nom"}
                      </p>
                      <p className="text-sm text-slate-400 truncate">
                        {friendship.friend.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(friendship.id)}
                    className="w-full px-4 py-2 bg-slate-800/80 text-slate-300 font-medium rounded-xl hover:bg-slate-700 hover:text-red-400 transition border border-slate-700 text-sm"
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          filter === "accepted" && (
            <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl shadow-2xl p-12 text-center animate-fade-in">
              <div className="text-6xl mb-4 opacity-50">👥</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Aucun ami pour le moment
              </h2>
              <p className="text-slate-400">
                Recherchez des amis par email pour commencer !
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
