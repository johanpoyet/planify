"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/themeContext";
import { useToast } from "@/lib/toastContext";
import DateTimePicker from "@/components/DateTimePicker";
import ConfirmModal from "@/components/ConfirmModal";

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

interface EventType {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export default function NewEventPage() {
  const router = useRouter();
  const { primaryColor, primaryHoverColor, primaryLightColor } = useTheme();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [conflicts, setConflicts] = useState<Record<string, { id: string; title: string; date: string }[]>>({});
  const [loadingConflicts, setLoadingConflicts] = useState(false);
  const [conflictsChecked, setConflictsChecked] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const totalConflicts = Object.values(conflicts).reduce((acc, arr) => acc + (arr?.length || 0), 0);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    visibility: "friends", // par défaut : visible aux amis
    eventTypeId: "", // Type d'événement (optionnel)
  });

  useEffect(() => {
    fetchFriends();
    fetchEventTypes();
  }, []);

  // Vérifier les conflits quand la date ou la sélection d'amis change (debounce)
  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const shouldFetch = formData.date && selectedFriends.length > 0;

    const fetchConflicts = async () => {
      setLoadingConflicts(true);
      setConflictsChecked(false);
      try {
        const res = await fetch('/api/events/conflicts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: selectedFriends, date: formData.date }),
        });

        if (res.ok) {
          const data = await res.json();
          if (mounted) setConflicts(data.conflicts || {});
        } else {
          setConflicts({});
        }
      } catch (err) {
        console.error('Erreur fetch conflits', err);
        if (mounted) setConflicts({});
      } finally {
        if (mounted) setLoadingConflicts(false);
        if (mounted) setConflictsChecked(true);
      }
    };

    if (shouldFetch) {
      // debounce 300ms
      timer = setTimeout(fetchConflicts, 300);
    } else {
      // clear conflicts if no date or no selected friends
      setConflicts({});
      setConflictsChecked(false);
    }

    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [formData.date, selectedFriends]);

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

  const fetchEventTypes = async () => {
    try {
      const res = await fetch("/api/event-types");
      if (res.ok) {
        const data = await res.json();
        setEventTypes(data);
      }
    } catch (error) {
      console.error("Erreur chargement types d'événements:", error);
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
    // Ne pas démarrer la création tout de suite — vérifier s'il y a des conflits
    const totalConflicts = Object.values(conflicts).reduce((acc, arr) => acc + (arr?.length || 0), 0);
    if (totalConflicts > 0) {
      // afficher modal de confirmation
      setShowConfirmModal(true);
      return;
    }

    // pas de conflit -> procéder à la création
    await proceedCreateEvent();
  };

  // Fonction qui exécute la création réelle de l'événement
  const proceedCreateEvent = async () => {
    setLoading(true);
    setError("");
    try {
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
      }

      // Afficher le toast de succès
      const toastMessage = selectedFriends.length > 0
        ? `Événement créé et ${selectedFriends.length} invitation(s) envoyée(s) !`
        : "Événement créé avec succès !";
      
      showToast(toastMessage, "success");

      // Rediriger vers la liste des événements après un court délai pour voir le toast
      setTimeout(() => {
        router.push("/events");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
      showToast(err.message || "Erreur lors de la création de l'événement", "error");
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-24 md:pb-8">
      {/* Subtle background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-slate-900/30 to-transparent"></div>
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl shadow-2xl p-6 mb-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl"
              style={{ backgroundColor: primaryColor }}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Créer un événement
              </h1>
              <p className="text-slate-400 text-sm">
                Planifiez un nouveau moment avec vos amis
              </p>
            </div>
            <div className="ml-auto">
              <button
                type="button"
                onClick={() => router.push('/polls/new')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-sm text-white hover:bg-slate-800"
              >
                🗳️ Créer un sondage
              </button>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl shadow-2xl p-8 animate-slide-up">
          {error && (
            <div 
              className="mb-6 border rounded-2xl p-4 flex items-center gap-3 animate-shake"
              style={{
                backgroundColor: '#dc262620',
                borderColor: '#dc262640'
              }}
            >
              <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Titre */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
                Titre *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg 
                    className="w-5 h-5 transition-colors" 
                    style={{ color: focusedInput === 'title' ? primaryLightColor : '#64748b' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <input
                  id="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  onFocus={() => setFocusedInput('title')}
                  onBlur={() => setFocusedInput(null)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-2 transition"
                  style={{ 
                    borderColor: focusedInput === 'title' ? primaryLightColor : undefined 
                  }}
                  placeholder="Ex: Anniversaire de Marie"
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-2">
                Date et heure *
              </label>
              <DateTimePicker
                value={formData.date}
                onChange={(value) => setFormData({ ...formData, date: value })}
                onFocus={() => setFocusedInput('date')}
                onBlur={() => setFocusedInput(null)}
                required
              />
            </div>

            {/* Lieu */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-slate-300 mb-2">
                Lieu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg 
                    className="w-5 h-5 transition-colors" 
                    style={{ color: focusedInput === 'location' ? primaryLightColor : '#64748b' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  onFocus={() => setFocusedInput('location')}
                  onBlur={() => setFocusedInput(null)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-2 transition"
                  style={{ 
                    borderColor: focusedInput === 'location' ? primaryLightColor : undefined 
                  }}
                  placeholder="Ex: Restaurant Le Jardin, Paris"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <div className="relative">
                <div className="absolute top-3 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 transition-colors"
                    style={{ color: focusedInput === 'description' ? primaryLightColor : '#64748b' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </div>
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  onFocus={() => setFocusedInput('description')}
                  onBlur={() => setFocusedInput(null)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-2 transition resize-none"
                  style={{
                    borderColor: focusedInput === 'description' ? primaryLightColor : undefined
                  }}
                  placeholder="Détails de l'événement..."
                />
              </div>
            </div>

            {/* Type d'événement */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Type d'événement
              </label>
              <div className="flex flex-wrap gap-2">
                {/* Option "Aucun" */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, eventTypeId: "" })}
                  className={`px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 ${
                    formData.eventTypeId === ""
                      ? 'border-slate-500 bg-slate-500/20 text-white'
                      : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="text-sm font-medium">Aucun</span>
                </button>

                {/* Types d'événements disponibles */}
                {eventTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, eventTypeId: type.id })}
                    className={`px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 ${
                      formData.eventTypeId === type.id
                        ? 'border-2 scale-105'
                        : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                    }`}
                    style={formData.eventTypeId === type.id ? {
                      borderColor: type.color,
                      backgroundColor: `${type.color}33`
                    } : {}}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: type.color }}
                    ></div>
                    <span
                      className="text-sm font-medium"
                      style={formData.eventTypeId === type.id ? { color: type.color } : { color: '#cbd5e1' }}
                    >
                      {type.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Visibilité */}
            <div>
              <label htmlFor="visibility" className="block text-sm font-medium text-slate-300 mb-2">
                Visibilité
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, visibility: 'private' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.visibility === 'private'
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                  }`}
                >
                  <div className="text-2xl mb-2">🔒</div>
                  <div className={`text-sm font-medium ${
                    formData.visibility === 'private' ? 'text-purple-400' : 'text-slate-300'
                  }`}>
                    Privé
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Seulement moi</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, visibility: 'friends' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.visibility === 'friends'
                      ? 'border-2 bg-opacity-20'
                      : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                  }`}
                  style={formData.visibility === 'friends' ? {
                    borderColor: primaryColor,
                    backgroundColor: `${primaryColor}33`
                  } : {}}
                >
                  <div className="text-2xl mb-2">👥</div>
                  <div className={`text-sm font-medium ${
                    formData.visibility === 'friends' ? '' : 'text-slate-300'
                  }`}
                  style={formData.visibility === 'friends' ? { color: primaryLightColor } : {}}
                  >
                    Amis
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Amis seulement</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, visibility: 'public' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.visibility === 'public'
                      ? 'border-green-500 bg-green-500/20'
                      : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'
                  }`}
                >
                  <div className="text-2xl mb-2">🌍</div>
                  <div className={`text-sm font-medium ${
                    formData.visibility === 'public' ? 'text-green-400' : 'text-slate-300'
                  }`}>
                    Public
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Tout le monde</div>
                </button>
              </div>
            </div>

            {/* Inviter des amis */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <svg 
                  className="w-5 h-5" 
                  style={{ color: primaryLightColor }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <label className="text-sm font-medium text-slate-300">
                  Inviter des amis à cet événement
                </label>
              </div>
              {friends.length === 0 ? (
                <div 
                  className="p-4 rounded-2xl border"
                  style={{
                    backgroundColor: `${primaryColor}1A`,
                    borderColor: `${primaryColor}4D`
                  }}
                >
                  <p className="text-slate-400 text-sm">
                    Vous n'avez pas encore d'amis. Ajoutez-en depuis la page Amis !
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto bg-slate-950/50 border border-slate-700 rounded-2xl p-3">
                  {friends.map((friendship) => {
                    const isSelected = selectedFriends.includes(friendship.friend.id);
                    return (
                      <label
                        key={friendship.friend.id}
                        className="flex items-center gap-3 p-3 hover:bg-slate-800/50 rounded-xl cursor-pointer transition-all group"
                      >
                        {/* Input checkbox caché mais accessible */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleFriend(friendship.friend.id)}
                          className="sr-only"
                        />
                        
                        {/* Checkbox personnalisée animée */}
                        <div className="relative flex items-center justify-center">
                          <div 
                            className={`w-6 h-6 rounded-lg border-2 transition-all duration-300 ease-out flex items-center justify-center ${
                              isSelected 
                                ? 'scale-100 rotate-0' 
                                : 'scale-95'
                            }`}
                            style={{
                              borderColor: isSelected ? primaryColor : '#475569',
                              backgroundColor: isSelected ? primaryColor : 'transparent'
                            }}
                          >
                            <svg 
                              className={`w-4 h-4 text-white transition-all duration-300 ${
                                isSelected 
                                  ? 'opacity-100 scale-100 rotate-0' 
                                  : 'opacity-0 scale-50 -rotate-90'
                              }`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                              strokeWidth={3}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          {/* Effet de pulse lors de la sélection */}
                          {isSelected && (
                            <div 
                              className="absolute inset-0 rounded-lg animate-ping opacity-75"
                              style={{ backgroundColor: primaryColor }}
                            />
                          )}
                        </div>

                        <div className="flex items-center gap-3 flex-1">
                          {friendship.friend.image ? (
                            <img
                              src={friendship.friend.image}
                              alt={friendship.friend.name || ''}
                              className="w-10 h-10 rounded-2xl ring-2 ring-slate-700 group-hover:ring-slate-600 transition"
                            />
                          ) : (
                            <div 
                              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-bold ring-2 ring-slate-700 group-hover:ring-slate-600 transition"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {friendship.friend.name?.[0]?.toUpperCase() || friendship.friend.email[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-white">
                              {friendship.friend.name || friendship.friend.email}
                            </p>
                            {friendship.friend.name && (
                              <p className="text-xs text-slate-500">{friendship.friend.email}</p>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
              {selectedFriends.length > 0 && (
                <div 
                  className="mt-3 p-3 rounded-2xl border flex items-center gap-2"
                  style={{
                    backgroundColor: `${primaryColor}1A`,
                    borderColor: `${primaryColor}4D`
                  }}
                >
                  <svg 
                    className="w-5 h-5" 
                    style={{ color: primaryLightColor }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm" style={{ color: primaryLightColor }}>
                    {selectedFriends.length} ami(s) sélectionné(s)
                  </span>
                </div>
              )}

              {/* Conflits d'agenda des amis sélectionnés pour la date choisie */}
              {totalConflicts > 0 && (
                <div className="mt-3 p-3 rounded-2xl border" style={{ backgroundColor: '#2b2b2b' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-white">Conflits détectés</div>
                    <div className="text-xs text-slate-400">{loadingConflicts ? 'Chargement...' : 'Même jour'}</div>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {friends
                      .filter(f => selectedFriends.includes(f.friend.id))
                      .map(f => {
                        const list = conflicts[f.friend.id] || [];
                        if (list.length === 0) return null;
                        return (
                          <div key={f.friend.id} className="p-2 rounded-lg bg-slate-800/40">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-white">{f.friend.name || f.friend.email}</div>
                              <div className="text-xs text-slate-400">{list.length} événement(s)</div>
                            </div>
                            <div className="mt-2 text-xs text-slate-300">
                              {list.map(ev => (
                                <div key={ev.id} className="flex items-center justify-between">
                                  <div>{new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                  <div className="ml-3 truncate">{ev.title}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Message lorsque tous les amis sélectionnés sont disponibles */}
              {selectedFriends.length > 0 && formData.date && !loadingConflicts && totalConflicts === 0 && (
                <div className="mt-3 p-3 rounded-2xl border flex items-center gap-2" style={{ backgroundColor: '#063f1a', borderColor: '#065f3a' }}>
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-green-200">Tous les amis sélectionnés sont disponibles à la date choisie.</span>
                </div>
              )}
            </div>

            {/* Boutons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 bg-slate-800 text-slate-300 rounded-2xl hover:bg-slate-700 transition font-medium shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 text-white rounded-2xl transition font-medium shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: loading ? '#64748b' : primaryColor
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = primaryHoverColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = primaryColor;
                  }
                }}
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Création...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Créer l'événement
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Confirmation modal when conflicts exist */}
          <ConfirmModal
            isOpen={showConfirmModal}
            title="Conflits détectés"
            description={totalConflicts > 0 ? `Attention : ${totalConflicts} conflit(s) détecté(s) pour les amis sélectionnés le même jour. Voulez-vous quand même créer l'événement ?` : undefined}
            confirmLabel="Créer quand même"
            cancelLabel="Annuler"
            loading={loading}
            onConfirm={async () => {
              await proceedCreateEvent();
            }}
            onCancel={() => setShowConfirmModal(false)}
          />
        </div>
      </div>
    </div>
  );
}
