"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/themeContext";
import Link from "next/link";
import ConfirmModal from "@/components/ConfirmModal";

interface EventType {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
];

export default function EventTypesPage() {
  const { status } = useSession();
  const router = useRouter();
  const { primaryColor, primaryHoverColor, primaryLightColor } = useTheme();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingType, setEditingType] = useState<EventType | null>(null);
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchEventTypes();
    }
  }, [status]);

  const fetchEventTypes = async () => {
    try {
      const res = await fetch("/api/event-types");
      if (res.ok) {
        const data = await res.json();
        setEventTypes(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des types d'événements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/event-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color: selectedColor }),
      });

      if (res.ok) {
        await fetchEventTypes();
        setShowCreateModal(false);
        setName("");
        setSelectedColor(PRESET_COLORS[0]);
      }
    } catch (error) {
      console.error("Erreur lors de la création:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingType || !name.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/event-types/${editingType.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color: selectedColor }),
      });

      if (res.ok) {
        await fetchEventTypes();
        setEditingType(null);
        setName("");
        setSelectedColor(PRESET_COLORS[0]);
      }
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (id: string) => {
    setTypeToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!typeToDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/event-types/${typeToDelete}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchEventTypes();
        setShowDeleteModal(false);
        setTypeToDelete(null);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    } finally {
      setDeleting(false);
    }
  };

  const openCreateModal = () => {
    setName("");
    setSelectedColor(PRESET_COLORS[0]);
    setEditingType(null);
    setShowCreateModal(true);
  };

  const openEditModal = (type: EventType) => {
    setName(type.name);
    setSelectedColor(type.color);
    setEditingType(type);
    setShowCreateModal(true);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl shadow-2xl mb-4 animate-pulse" style={{ backgroundColor: primaryColor }}>
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <p className="text-slate-300 text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 md:pb-8">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-slate-900/30 to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors group mb-4"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Retour aux paramètres</span>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Types d'événements</h1>
              <p className="text-slate-400">Organisez vos événements par catégories</p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-2xl font-medium text-white transition-all shadow-lg hover:scale-105 flex items-center gap-2"
              style={{ backgroundColor: primaryColor }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = primaryHoverColor}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouveau type
            </button>
          </div>
        </div>

        {/* Liste des types */}
        {eventTypes.length === 0 ? (
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 p-12 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${primaryColor}33` }}>
              <svg className="w-10 h-10" style={{ color: primaryLightColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">Aucun type d'événement</h3>
            <p className="text-slate-500 mb-6">Créez votre premier type pour organiser vos événements</p>
            <button
              onClick={openCreateModal}
              className="px-6 py-3 rounded-2xl font-medium text-white transition-all shadow-lg hover:scale-105"
              style={{ backgroundColor: primaryColor }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = primaryHoverColor}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
            >
              Créer un type
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {eventTypes.map((type) => (
              <div
                key={type.id}
                className="bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-700/50 p-6 hover:border-slate-600 transition-colors group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex-shrink-0"
                    style={{ backgroundColor: type.color }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">{type.name}</h3>
                    <p className="text-sm text-slate-500">{type.color}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(type)}
                    className="flex-1 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl font-medium transition-all border border-slate-700"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => openDeleteModal(type.id)}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-xl font-medium transition-all border border-red-500/30 hover:border-red-500"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Créer/Modifier */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowCreateModal(false)}>
          <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-700/50 max-w-md w-full p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-white mb-6">
              {editingType ? "Modifier le type" : "Nouveau type d'événement"}
            </h3>

            {/* Nom */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nom du type
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Travail, Perso, Important..."
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition"
                style={{ focusRingColor: primaryColor } as any}
                autoFocus
              />
            </div>

            {/* Couleur */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Couleur
              </label>
              <div className="grid grid-cols-9 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-xl transition-all ${
                      selectedColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 text-white rounded-2xl font-semibold transition-all border border-slate-700"
              >
                Annuler
              </button>
              <button
                onClick={editingType ? handleUpdate : handleCreate}
                disabled={saving || !name.trim()}
                className="flex-1 px-4 py-3 rounded-2xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: primaryColor }}
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
                {saving ? "Enregistrement..." : editingType ? "Modifier" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Supprimer le type d'événement"
        description="Les événements associés à ce type ne seront pas supprimés, mais n'auront plus de type assigné."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        loading={deleting}
        loadingLabel="Suppression..."
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setTypeToDelete(null);
        }}
      />
    </div>
  );
}
