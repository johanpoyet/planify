"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/themeContext";
import { useToast } from "@/lib/toastContext";
import DateTimePicker from "@/components/DateTimePicker";

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  visibility: string;
  createdById: string;
  eventTypeId: string | null;
}

interface EventType {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditEventPage({ params }: PageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { primaryColor, primaryHoverColor, primaryLightColor } = useTheme();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    visibility: "friends",
    eventTypeId: "",
  });

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
      fetchEventTypes();
    }
  }, [status, eventId]);

  const fetchEvent = async () => {
    if (!eventId) return;

    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (res.ok) {
        const event: Event = await res.json();

        // Vérifier que l'utilisateur connecté est bien le créateur
        if (session?.user && (session.user as any).id !== event.createdById) {
          showToast("Vous n'êtes pas autorisé à modifier cet événement", "error");
          router.push(`/events/${eventId}`);
          return;
        }

        // Convertir la date au format datetime-local
        const date = new Date(event.date);
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);

        setFormData({
          title: event.title,
          description: event.description || "",
          date: localDate,
          location: event.location || "",
          visibility: event.visibility,
          eventTypeId: event.eventTypeId || "",
        });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la modification");
      }

      showToast("Événement modifié avec succès !", "success");
      
      // Rediriger vers la page de détails après un court délai
      setTimeout(() => {
        router.push(`/events/${eventId}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message);
      showToast(err.message || "Erreur lors de la modification", "error");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div 
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl shadow-2xl mb-4 animate-pulse"
            style={{ backgroundColor: primaryColor }}
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <p className="text-slate-300 text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Modifier l'événement
              </h1>
              <p className="text-slate-400 text-sm">
                Mettez à jour les détails de votre événement
              </p>
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
                disabled={saving}
                className="flex-1 px-6 py-3 text-white rounded-2xl transition font-medium shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: saving ? '#64748b' : primaryColor
                }}
                onMouseEnter={(e) => {
                  if (!saving) {
                    e.currentTarget.style.backgroundColor = primaryHoverColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!saving) {
                    e.currentTarget.style.backgroundColor = primaryColor;
                  }
                }}
              >
                {saving ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Enregistrer les modifications
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
