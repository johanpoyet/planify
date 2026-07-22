"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import PushNotificationSettings from "@/components/PushNotificationSettings";
import ThemeSelector from "@/components/ThemeSelector";
import { useTheme } from "@/lib/themeContext";

interface UserSettings {
  id: string;
  name: string | null;
  email: string;
  calendarVisibility: boolean;
}

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { primaryColor } = useTheme();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") fetchSettings();
  }, [status]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/user/settings");
      if (res.ok) setSettings(await res.json());
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
        body: JSON.stringify({ calendarVisibility: !settings.calendarVisibility }),
      });
      if (res.ok) setSettings(await res.json());
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--pf-bg)' }}>
        <p className="text-sm" style={{ color: 'var(--pf-text-dim)' }}>Chargement…</p>
      </div>
    );
  }

  if (!settings) return null;

  const Section = ({ children }: { children: React.ReactNode }) => (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--pf-surface)', border: '1px solid var(--pf-border)' }}
    >
      {children}
    </div>
  );

  const SectionHeader = ({ label }: { label: string }) => (
    <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--pf-border)' }}>
      <p className="text-xs font-semibold uppercase" style={{ color: 'var(--pf-text-muted)', letterSpacing: '0.08em' }}>{label}</p>
    </div>
  );

  const Row = ({ children }: { children: React.ReactNode }) => (
    <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--pf-border)' }}>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--pf-bg)' }}>
      {/* Header */}
      <div className="px-5 pt-6 pb-4 md:px-8 md:pt-8">
        <p className="text-xs font-mono uppercase mb-1" style={{ color: 'var(--pf-text-muted)', letterSpacing: '0.08em' }}>
          Compte
        </p>
        <h1 className="font-semibold" style={{ fontSize: 26, color: 'var(--pf-text)', letterSpacing: '-0.025em' }}>
          Paramètres
        </h1>
      </div>

      <div className="px-4 pb-28 md:pb-10 md:px-8 max-w-2xl flex flex-col gap-4">

        {/* Profil */}
        <Section>
          <SectionHeader label="Profil" />
          <Row>
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'var(--pf-text-muted)' }}>Nom</p>
              <p className="text-sm font-medium" style={{ color: 'var(--pf-text)' }}>{settings.name || "Non défini"}</p>
            </div>
          </Row>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--pf-border)' }}>
            <p className="text-xs mb-0.5" style={{ color: 'var(--pf-text-muted)' }}>Email</p>
            <p className="text-sm font-medium" style={{ color: 'var(--pf-text)' }}>{settings.email}</p>
          </div>
          <div className="px-5 py-4 flex items-center gap-4">
            <div
              className="flex items-center justify-center font-bold text-white rounded-full flex-shrink-0"
              style={{
                width: 52, height: 52,
                background: primaryColor,
                fontSize: 18,
                letterSpacing: '-0.01em',
              }}
            >
              {(settings.name || settings.email)
                .trim().split(/\s+/).filter(Boolean)
                .reduce((acc: string[], w, i, arr) =>
                  i === 0 || i === arr.length - 1 ? [...acc, w[0].toUpperCase()] : acc, []
                ).slice(0, 2).join('')
              }
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--pf-text)' }}>{settings.name || settings.email}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--pf-text-muted)' }}>Avatar généré depuis le nom</p>
            </div>
          </div>
        </Section>

        {/* Confidentialité */}
        <Section>
          <SectionHeader label="Confidentialité" />
          <div className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--pf-text)' }}>Visibilité du calendrier</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--pf-text-muted)' }}>
                  {settings.calendarVisibility
                    ? "Tes amis peuvent voir tes événements partagés"
                    : "Seuls tes événements publics sont visibles"}
                </p>
              </div>
              <button
                onClick={handleToggleVisibility}
                disabled={saving}
                aria-label="Rendre mon calendrier visible par mes amis"
                role="switch"
                aria-checked={settings.calendarVisibility}
                className="flex-shrink-0 relative inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:opacity-50"
                style={{ backgroundColor: settings.calendarVisibility ? primaryColor : 'var(--pf-surface-3)' }}
              >
                <span
                  className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform"
                  style={{ transform: settings.calendarVisibility ? 'translateX(22px)' : 'translateX(4px)' }}
                />
              </button>
            </div>
          </div>
        </Section>

        {/* Événements */}
        <Section>
          <SectionHeader label="Événements" />
          <Link
            href="/settings/event-types"
            className="flex items-center justify-between px-5 py-4 transition-colors"
            style={{ color: 'inherit' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--pf-surface-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--pf-text)' }}>Types d'événements</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--pf-text-muted)' }}>Gérer les catégories et leurs couleurs</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--pf-text-muted)', flexShrink: 0 }}>
              <path d="m9 5 7 7-7 7"/>
            </svg>
          </Link>
        </Section>

        {/* Apparence */}
        <Section>
          <SectionHeader label="Apparence" />
          <div className="px-5 py-4">
            <ThemeSelector />
          </div>
        </Section>

        {/* Notifications */}
        <Section>
          <SectionHeader label="Notifications" />
          <div className="px-5 py-4">
            <PushNotificationSettings />
          </div>
        </Section>
      </div>
    </div>
  );
}
