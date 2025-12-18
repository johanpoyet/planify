"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import PushNotificationSettings from "@/components/PushNotificationSettings";
import ThemeSelector from "@/components/ThemeSelector";
import ProfileImageUpload from "@/components/ProfileImageUpload";
import { useTheme } from "@/lib/themeContext";

interface UserSettings {
  id: string;
  name: string | null;
  email: string;
  calendarVisibility: boolean;
  profileImageUrl?: string | null;
}

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { primaryColor, primaryLightColor } = useTheme();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSettings();
    }
  }, [status]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/user/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendarVisibility: !settings.calendarVisibility,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl shadow-2xl mb-4 animate-pulse" style={{ backgroundColor: primaryColor }}>
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-slate-300 text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 md:pb-8">
      {/* Subtle background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-slate-900/30 to-transparent"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl shadow-2xl p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8" style={{ color: primaryLightColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h1 className="text-3xl font-bold text-white">
              Paramètres
            </h1>
          </div>
          <p className="text-slate-400">
            Gérez vos préférences et votre confidentialité
          </p>
        </div>

        {/* Profil */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl shadow-2xl p-6 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6" style={{ color: primaryLightColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h2 className="text-2xl font-bold text-white">
              Profil
            </h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-slate-950/50 border border-slate-700 rounded-2xl">
              <p className="text-sm text-slate-400 mb-1">Nom</p>
              <p className="text-lg text-white font-medium">
                {settings.name || "Non défini"}
              </p>
            </div>
            <div className="p-4 bg-slate-950/50 border border-slate-700 rounded-2xl">
              <p className="text-sm text-slate-400 mb-1">Email</p>
              <p className="text-lg text-white font-medium">{settings.email}</p>
            </div>
          </div>
        </div>

        {/* Photo de profil */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl shadow-2xl p-6 animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6" style={{ color: primaryLightColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="text-2xl font-bold text-white">
              Photo de profil
            </h2>
          </div>
          <ProfileImageUpload
            currentImageUrl={settings.profileImageUrl}
            onImageUpdate={(imageUrl) => {
              setSettings(prev => prev ? { ...prev, profileImageUrl: imageUrl } : null);
            }}
          />
        </div>

        {/* Visibilité du calendrier */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl shadow-2xl p-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6" style={{ color: primaryLightColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-2xl font-bold text-white">
              Confidentialité
            </h2>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-700 rounded-2xl">
            <div className="flex-1 pr-4">
              <h3 className="text-lg font-semibold text-white mb-1">
                Visibilité du calendrier
              </h3>
              <p className="text-sm text-slate-400">
                {settings.calendarVisibility
                  ? "Vos amis peuvent voir vos événements partagés (visibilité 'amis')"
                  : "Seuls vos événements publics sont visibles"}
              </p>
            </div>
            <button
              onClick={handleToggleVisibility}
              disabled={saving}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors flex-shrink-0 ${
                saving ? "opacity-50" : ""
              }`}
              style={{ backgroundColor: settings.calendarVisibility ? primaryColor : "#334155" }}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                  settings.calendarVisibility
                    ? "translate-x-7"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="mt-4 p-4 rounded-2xl" style={{ 
            backgroundColor: `${primaryColor}1A`,
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: `${primaryColor}4D`
          }}>
            <div className="flex gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: primaryLightColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm" style={{ color: `${primaryLightColor}CC` }}>
                <strong>Info :</strong> Ce paramètre contrôle si vos amis peuvent voir vos événements
                dont la visibilité est réglée sur "Amis". Les événements "Publics" restent toujours visibles,
                et les événements "Privés" ne sont jamais visibles.
              </p>
            </div>
          </div>
        </div>

        {/* Types d'événements */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl shadow-2xl p-6 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-6 h-6" style={{ color: primaryLightColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <h2 className="text-2xl font-bold text-white">
              Événements
            </h2>
          </div>
          <Link
            href="/settings/event-types"
            className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-700 hover:border-slate-600 rounded-2xl transition-colors group"
          >
            <div>
              <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-slate-100">
                Types d'événements
              </h3>
              <p className="text-sm text-slate-400">
                Gérez vos catégories d'événements et leurs couleurs
              </p>
            </div>
            <svg className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Thème de couleur */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl shadow-2xl p-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-2 mb-6">
            <svg className="w-6 h-6" style={{ color: primaryLightColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <h2 className="text-2xl font-bold text-white">
              Apparence
            </h2>
          </div>
          <ThemeSelector />
        </div>

        {/* Notifications */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl shadow-2xl p-6 animate-slide-up" style={{ animationDelay: "0.25s" }}>
          <div className="flex items-center gap-2 mb-6">
            <svg className="w-6 h-6" style={{ color: primaryLightColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h2 className="text-2xl font-bold text-white">
              Notifications
            </h2>
          </div>
          <PushNotificationSettings />
        </div>
      </div>
    </div>
  );
}
