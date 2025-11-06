"use client";

import React from "react";
import { useTheme } from "@/lib/themeContext";

interface ConfirmModalProps {
  readonly isOpen: boolean;
  readonly title?: string;
  readonly description?: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly loading?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title = "Confirmer",
  description,
  confirmLabel = "Oui",
  cancelLabel = "Annuler",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { primaryColor, primaryHoverColor } = useTheme();

  if (!isOpen) return null;

  const handleOverlayKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black bg-opacity-50"
        aria-label="Fermer la fenêtre"
        onClick={onCancel}
        onKeyDown={handleOverlayKey}
      />

      <div className="relative bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 w-full max-w-md mx-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description && (
            <p className="text-sm text-slate-300 mt-2">{description}</p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-2xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-2xl text-white font-medium transition shadow-lg"
            style={{ backgroundColor: loading ? '#475569' : primaryColor }}
            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = primaryHoverColor; }}
            onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = primaryColor; }}
          >
            {loading ? "Création..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
