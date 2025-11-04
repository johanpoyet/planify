"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
}

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    visibility: "friends", // par défaut : visible aux amis
  });

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/friends?status=accepted");
      if (res.ok) {
        const data = await res.json();
        setFriends(data);
      }
    } catch (error) {
      console.error("Erreur chargement amis:", error);
    }
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Créer l'événement
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la création");
      }

      // Si des amis sont sélectionnés, les ajouter comme participants
      if (selectedFriends.length > 0) {
        await fetch(`/api/events/${data.id}/participants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: selectedFriends }),
        });
        
        console.log(`✉️ ${selectedFriends.length} invitation(s) envoyée(s) !`);
      }

      // Rediriger vers la liste des événements
      router.push("/events");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            📅 Créer un événement
          </h1>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Anniversaire de Marie"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date et heure *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Lieu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lieu
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Restaurant Le Jardin, Paris"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Détails de l'événement..."
              />
            </div>

            {/* Visibilité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibilité
              </label>
              <select
                value={formData.visibility}
                onChange={(e) =>
                  setFormData({ ...formData, visibility: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="private">🔒 Privé (seulement moi)</option>
                <option value="friends">👥 Amis seulement</option>
                <option value="public">🌍 Public (tout le monde)</option>
              </select>
            </div>

            {/* Inviter des amis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                👥 Inviter des amis à cet événement
              </label>
              {friends.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  Vous n'avez pas encore d'amis. Ajoutez-en depuis la page Amis !
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {friends.map((friendship) => (
                    <label
                      key={friendship.friend.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFriends.includes(friendship.friend.id)}
                        onChange={() => toggleFriend(friendship.friend.id)}
                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                          {friendship.friend.name?.[0] || friendship.friend.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {friendship.friend.name || friendship.friend.email}
                          </p>
                          {friendship.friend.name && (
                            <p className="text-xs text-gray-500">{friendship.friend.email}</p>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {selectedFriends.length > 0 && (
                <p className="text-sm text-blue-600 mt-2">
                  ✓ {selectedFriends.length} ami(s) sélectionné(s)
                </p>
              )}
            </div>

            {/* Boutons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50"
              >
                {loading ? "Création..." : "Créer l'événement"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
