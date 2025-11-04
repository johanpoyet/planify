"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import NotificationTest from "@/components/NotificationTest";
import PushNotificationSettings from "@/components/PushNotificationSettings";

interface UserSettings {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  calendarVisibility: boolean;
}

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                ⚙️ Paramètres
              </h1>
              <p className="text-gray-600 mt-1">
                Gérez vos préférences et votre confidentialité
              </p>
            </div>
            <Link
              href="/events"
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              ← Retour
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Profil */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            👤 Profil
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Nom</p>
              <p className="text-lg text-gray-800">
                {settings.name || "Non défini"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-lg text-gray-800">{settings.email}</p>
            </div>
          </div>
        </div>

        {/* Visibilité du calendrier */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🔒 Confidentialité
          </h2>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                Visibilité du calendrier
              </h3>
              <p className="text-sm text-gray-600">
                {settings.calendarVisibility
                  ? "Vos amis peuvent voir vos événements partagés (visibilité 'amis')"
                  : "Seuls vos événements publics sont visibles"}
              </p>
            </div>
            <button
              onClick={handleToggleVisibility}
              disabled={saving}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                settings.calendarVisibility
                  ? "bg-blue-500"
                  : "bg-gray-300"
              } ${saving ? "opacity-50" : ""}`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  settings.calendarVisibility
                    ? "translate-x-7"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>ℹ️ Info :</strong> Ce paramètre contrôle si vos amis peuvent voir vos événements
              dont la visibilité est réglée sur "Amis". Les événements "Publics" restent toujours visibles,
              et les événements "Privés" ne sont jamais visibles.
            </p>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            🔔 Notifications
          </h2>
          <PushNotificationSettings />
        </div>

        {/* Test de notifications (dev) */}
        <NotificationTest />

        {/* Déconnexion */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🚪 Session
          </h2>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
