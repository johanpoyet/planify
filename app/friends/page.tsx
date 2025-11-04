"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                👥 Mes amis
              </h1>
              <p className="text-gray-600 mt-1">
                {acceptedFriends.length} ami{acceptedFriends.length > 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/events"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                ← Retour aux événements
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                🚪 Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Rechercher un ami */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🔍 Ajouter un ami
          </h2>
          <form onSubmit={handleSendRequest} className="flex gap-4">
            <input
              type="email"
              required
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Email de votre ami"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50"
            >
              {searching ? "Envoi..." : "Envoyer une demande"}
            </button>
          </form>
          {searchError && (
            <p className="text-red-600 mt-2">{searchError}</p>
          )}
        </div>

        {/* Filtres */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg transition ${
              filter === "all"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Tous ({friendships.length})
          </button>
          <button
            onClick={() => setFilter("accepted")}
            className={`px-4 py-2 rounded-lg transition ${
              filter === "accepted"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Amis ({acceptedFriends.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-lg transition ${
              filter === "pending"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            En attente ({pendingReceived.length + pendingSent.length})
          </button>
        </div>

        {/* Demandes reçues */}
        {pendingReceived.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              📬 Demandes reçues
            </h2>
            <div className="space-y-3">
              {pendingReceived.map((friendship) => (
                <div
                  key={friendship.id}
                  className="flex items-center justify-between p-4 bg-blue-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center text-xl">
                      👤
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {friendship.friend.name || "Sans nom"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {friendship.friend.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(friendship.id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                      ✓ Accepter
                    </button>
                    <button
                      onClick={() => handleReject(friendship.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
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
        {pendingSent.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              📤 Demandes envoyées
            </h2>
            <div className="space-y-3">
              {pendingSent.map((friendship) => (
                <div
                  key={friendship.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl">
                      👤
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {friendship.friend.name || "Sans nom"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {friendship.friend.email}
                      </p>
                      <p className="text-xs text-gray-500">En attente...</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(friendship.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                  >
                    Annuler
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liste des amis */}
        {acceptedFriends.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              ✅ Mes amis
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {acceptedFriends.map((friendship) => (
                <div
                  key={friendship.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl">
                      👤
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">
                        {friendship.friend.name || "Sans nom"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {friendship.friend.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(friendship.id)}
                    className="w-full px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-sm"
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          filter === "accepted" && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">👥</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Aucun ami pour le moment
              </h2>
              <p className="text-gray-600">
                Recherchez des amis par email pour commencer !
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
