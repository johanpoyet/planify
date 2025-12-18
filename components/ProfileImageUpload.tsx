"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "@/lib/themeContext";
import ConfirmModal from "./ConfirmModal";

interface ProfileImageUploadProps {
  currentImageUrl?: string | null;
  onImageUpdate: (imageUrl: string | null) => void;
}

export default function ProfileImageUpload({ currentImageUrl, onImageUpdate }: ProfileImageUploadProps) {
  const { data: session } = useSession();
  const { primaryColor } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation côté client
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Type de fichier invalide. Utilisez JPG, PNG, GIF ou WebP.");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError("Fichier trop volumineux. Taille maximum : 5MB");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/user/profile-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setPreviewUrl(data.user.profileImageUrl);
        onImageUpdate(data.user.profileImageUrl);
      } else {
        setError(data.error || "Erreur lors de l'upload");
      }
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      setError("Erreur lors de l'upload de l'image");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setUploading(true);
    setError(null);
    setShowDeleteModal(false);

    try {
      const res = await fetch("/api/user/profile-image", {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        setPreviewUrl(null);
        onImageUpdate(null);
      } else {
        setError(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setError("Erreur lors de la suppression de l'image");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-950/50 border border-slate-700 rounded-2xl">
        {/* Aperçu de l'image */}
        <div className="relative">
          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Profil"
                className="w-24 h-24 rounded-2xl object-cover ring-2 ring-slate-700"
              />
            </div>
          ) : (
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-white font-bold text-3xl ring-2 ring-slate-700"
              style={{ backgroundColor: primaryColor }}
            >
              {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        {/* Contrôles */}
        <div className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />

            <button
              onClick={handleButtonClick}
              disabled={uploading}
              className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              {previewUrl ? "Modifier la photo" : "Ajouter une photo"}
            </button>

            {previewUrl && (
              <button
                onClick={handleDeleteClick}
                disabled={uploading}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Supprimer
              </button>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-2">
            JPG, PNG, GIF ou WebP. Maximum 5MB.
          </p>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
          <div className="flex gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-400">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Supprimer la photo de profil"
        description="Êtes-vous sûr de vouloir supprimer votre photo de profil ? Cette action est irréversible."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        loading={uploading}
        loadingLabel="Suppression..."
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
