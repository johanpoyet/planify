"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/themeContext";
import { useToast } from "@/lib/toastContext";

/* ------------------------------------------------------------------ types */
interface PageProps {
  params: Promise<{ id: string }>;
}

/* --------------------------------------------------------------- constants */
const WEEKDAYS = [
  { key: "lun", label: "L" }, { key: "mar", label: "M" }, { key: "mer", label: "M" },
  { key: "jeu", label: "J" }, { key: "ven", label: "V" }, { key: "sam", label: "S" }, { key: "dim", label: "D" },
];

/* --------------------------------------------------------------- helpers */
function fmtDate(s: string) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(s));
}
function fmtTime(s: string) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(s));
}
function getDayBg(isSel: boolean, isTod: boolean, primaryColor: string): string {
  if (isSel) return primaryColor;
  if (isTod) return "var(--pf-surface-3)";
  return "transparent";
}
function getDayColor(isSel: boolean, isTod: boolean, primaryColor: string): string {
  if (isSel) return "#fff";
  if (isTod) return primaryColor;
  return "var(--pf-text)";
}

/* --------------------------------------------------------------- icons */
function IcoCal() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/></svg>;
}
function IcoClock() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>;
}
function IcoPin() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>;
}
function IcoVis() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}

/* --------------------------------------------------------- CalPicker */
function CalPicker({ value, onChange }: Readonly<{ value: string; onChange: (v: string) => void }>) {
  const { primaryColor } = useTheme();
  const [month, setMonth] = useState(value ? new Date(value) : new Date());
  const [selDate, setSelDate] = useState<Date | null>(value ? new Date(value) : null);
  const [time, setTime] = useState(value ? new Date(value).toTimeString().slice(0, 5) : "12:00");

  const toIso = (d: Date, t: string) => {
    const [h, m] = t.split(":").map(s => Number.parseInt(s, 10));
    const nd = new Date(d);
    if (!Number.isNaN(h) && !Number.isNaN(m)) nd.setHours(h, m); else nd.setHours(12, 0);
    return nd.toISOString().slice(0, 16);
  };
  const pick = (day: number) => {
    const d = new Date(month.getFullYear(), month.getMonth(), day);
    setSelDate(d); onChange(toIso(d, time));
  };
  const changeTime = (t: string) => { setTime(t); if (selDate) onChange(toIso(selDate, t)); };

  const fdow = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const blanks = fdow === 0 ? 6 : fdow - 1;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  return (
    <div style={{ background: "var(--pf-surface-2)", borderRadius: 12, padding: 12, border: "1px solid var(--pf-border)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, textTransform: "capitalize", color: "var(--pf-text)" }}>
          {month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {(["prev", "next"] as const).map(dir => (
            <button key={dir} type="button"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + (dir === "prev" ? -1 : 1)))}
              style={{ width: 24, height: 24, borderRadius: 8, background: "var(--pf-surface-3)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pf-text-dim)", cursor: "pointer" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={dir === "prev" ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"} />
              </svg>
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
        {WEEKDAYS.map(wd => (
          <div key={wd.key} style={{ textAlign: "center", fontSize: 9, fontWeight: 700, color: "var(--pf-text-muted)", padding: "3px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>{wd.label}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {(["a", "b", "c", "d", "e", "f"] as const).slice(0, blanks).map(k => <div key={`blank-${k}`} />)}
        {Array.from({ length: days }, (_, i) => i + 1).map(day => {
          const dd = new Date(month.getFullYear(), month.getMonth(), day);
          dd.setHours(0, 0, 0, 0);
          const isSel = selDate?.getDate() === day && selDate?.getMonth() === month.getMonth() && selDate?.getFullYear() === month.getFullYear();
          const isTod = today.getDate() === day && today.getMonth() === month.getMonth() && today.getFullYear() === month.getFullYear();
          return (
            <button key={`d-${day}`} type="button" onClick={() => pick(day)}
              style={{
                aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 8, fontSize: 12, fontWeight: isSel || isTod ? 600 : 400, border: "none", cursor: "pointer",
                background: getDayBg(!!isSel, isTod, primaryColor),
                color: getDayColor(!!isSel, isTod, primaryColor),
              }}>{day}</button>
          );
        })}
      </div>
      <div style={{ borderTop: "1px solid var(--pf-border)", marginTop: 10, paddingTop: 10 }}>
        <label htmlFor="edit-time" style={{ display: "block", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--pf-text-muted)", marginBottom: 5 }}>Heure</label>
        <input id="edit-time" type="time" value={time} onChange={e => changeTime(e.target.value)}
          style={{ width: "100%", background: "var(--pf-surface)", border: `1px solid ${primaryColor}`, borderRadius: 8, padding: "7px 10px", color: "var(--pf-text)", colorScheme: "dark", fontSize: 14, outline: "none" }} />
      </div>
    </div>
  );
}

/* --------------------------------------------------------- MFieldRow (mobile) */
function MFieldRow({ icon, label, value, placeholder, divider = false, onClick }:
  Readonly<{ icon: React.ReactNode; label: string; value?: string | null; placeholder?: string; divider?: boolean; onClick?: () => void }>) {
  return (
    <button type="button" onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderTop: divider ? "1px solid var(--pf-border)" : "none", background: "transparent", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}>
      <span style={{ color: "var(--pf-text-muted)", display: "flex", flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--pf-text-muted)" }}>{label}</span>
        <span style={{ display: "block", fontSize: 13, fontWeight: 500, marginTop: 1, color: value ? "var(--pf-text)" : "var(--pf-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value ?? placeholder}
        </span>
      </span>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--pf-text-muted)", flexShrink: 0 }}>
        <path d="m9 5 7 7-7 7" />
      </svg>
    </button>
  );
}

/* --------------------------------------------------------- DFormField (desktop) */
function DFormField({ label, span = 1, children }: Readonly<{ label: string; span?: number; children: React.ReactNode }>) {
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--pf-text-muted)", marginBottom: 6 }}>{label}</div>
      <div style={{ background: "var(--pf-surface)", border: "1px solid var(--pf-border)", borderRadius: 10, padding: "12px 14px", fontSize: 14, fontWeight: 500 }}>
        {children}
      </div>
    </div>
  );
}

/* --------------------------------------------------------- VisChip */
function VisChip({ label, active, onClick }: Readonly<{ label: string; active: boolean; onClick: () => void }>) {
  return (
    <button type="button" onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 999,
        fontSize: 13, fontWeight: 500, cursor: "pointer",
        background: active ? "var(--pf-accent-soft)" : "transparent",
        border: `1px solid ${active ? "transparent" : "var(--pf-border)"}`,
        color: active ? "var(--pf-accent)" : "var(--pf-text-dim)",
      }}>
      {label}
    </button>
  );
}

/* ================================================================ PAGE */
export default function EditEventPage({ params }: PageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { primaryColor } = useTheme();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState<"date" | "location" | "visibility" | null>(null);
  const locationRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "", description: "", date: "", location: "", visibility: "friends",
  });

  useEffect(() => { params.then(p => setEventId(p.id)); }, [params]);
  useEffect(() => { if (status === "unauthenticated") router.push("/auth/login"); }, [status, router]);
  useEffect(() => {
    if (mobileOpen === "location") setTimeout(() => locationRef.current?.focus(), 50);
  }, [mobileOpen]);

  useEffect(() => {
    if (status !== "authenticated" || !eventId) return;

    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok) { router.push("/events"); return; }
        const event = await res.json();

        if (session?.user && (session.user as { id?: string }).id !== event.createdById) {
          showToast("Non autorisé", "error");
          router.push(`/events/${eventId}`);
          return;
        }

        const d = new Date(event.date);
        const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setFormData({
          title: event.title,
          description: event.description ?? "",
          date: localDate,
          location: event.location ?? "",
          visibility: event.visibility,
        });
      } catch {
        router.push("/events");
      } finally {
        setLoading(false);
      }
    };

    void fetchEvent();
  }, [status, eventId, session, router, showToast]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formData.title.trim() || !eventId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Erreur");
      showToast("Événement modifié !", "success");
      setTimeout(() => router.push(`/events/${eventId}`), 1000);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setSaving(false);
    }
  };

  const visLabel = formData.visibility === "private" ? "Privé — invités seulement" : "Amis";
  const canSave = formData.title.trim().length > 0 && !saving;

  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--pf-bg)" }}>
        <p style={{ fontSize: 13, color: "var(--pf-text-dim)" }}>Chargement…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--pf-bg)" }}>

      {/* ---- sticky header ---- */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", position: "sticky", top: 0, zIndex: 10, background: "var(--pf-bg)", borderBottom: "1px solid var(--pf-border)" }}>
        <button type="button" onClick={() => router.back()}
          style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--pf-surface)", border: "1px solid var(--pf-border)", borderRadius: 10, color: "var(--pf-text-dim)", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--pf-text)", letterSpacing: "-0.01em" }}>Modifier l&apos;événement</span>
        <button type="button" onClick={() => { void handleSubmit(); }} disabled={!canSave}
          style={{ padding: "7px 16px", borderRadius: 10, background: primaryColor, color: 'var(--pf-on-accent)', fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", opacity: canSave ? 1 : 0.4 }}>
          {saving ? "…" : "Enregistrer"}
        </button>
      </div>

      {/* ================================================================ MOBILE (< md) */}
      <div className="md:hidden" style={{ padding: "24px 16px 120px" }}>

        {/* Title */}
        <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
          placeholder="Nom de l'événement"
          style={{ background: "transparent", border: "none", outline: "none", fontSize: 26, fontWeight: 600, letterSpacing: "-0.025em", color: "var(--pf-text)", marginBottom: 24, display: "block", width: "100%" }} />

        {/* Field rows card */}
        <div style={{ background: "var(--pf-surface)", border: "1px solid var(--pf-border)", borderRadius: 16, overflow: "hidden", marginBottom: 14 }}>
          <MFieldRow icon={<IcoCal />} label="Date" value={formData.date ? fmtDate(formData.date) : null} placeholder="Choisir une date"
            onClick={() => setMobileOpen(p => p === "date" ? null : "date")} />
          <MFieldRow icon={<IcoClock />} label="Heure" value={formData.date ? fmtTime(formData.date) : null} placeholder="—" divider
            onClick={() => setMobileOpen(p => p === "date" ? null : "date")} />
          <MFieldRow icon={<IcoPin />} label="Lieu" value={formData.location || null} placeholder="Ajouter un lieu" divider
            onClick={() => setMobileOpen(p => p === "location" ? null : "location")} />
          <MFieldRow icon={<IcoVis />} label="Visibilité" value={visLabel} divider
            onClick={() => setMobileOpen(p => p === "visibility" ? null : "visibility")} />
        </div>

        {/* Inline expanded panels */}
        {mobileOpen === "date" && (
          <div style={{ marginBottom: 14 }}>
            <CalPicker value={formData.date} onChange={v => setFormData({ ...formData, date: v })} />
          </div>
        )}
        {mobileOpen === "location" && (
          <div style={{ marginBottom: 14 }}>
            <input ref={locationRef} type="text" value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="Restaurant, adresse…"
              style={{ width: "100%", background: "var(--pf-surface)", border: "1px solid var(--pf-border)", borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "var(--pf-text)", outline: "none", boxSizing: "border-box" }} />
          </div>
        )}
        {mobileOpen === "visibility" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <VisChip label="Privé" active={formData.visibility === "private"} onClick={() => setFormData({ ...formData, visibility: "private" })} />
            <VisChip label="Amis" active={formData.visibility === "friends"} onClick={() => setFormData({ ...formData, visibility: "friends" })} />
          </div>
        )}

        {/* Description */}
        <div style={{ background: "var(--pf-surface)", border: "1px solid var(--pf-border)", borderRadius: 16, padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--pf-text-muted)", marginBottom: 6 }}>Description</div>
          <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Détails de l'événement…" rows={3}
            style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", color: "var(--pf-text)", fontFamily: "inherit", fontSize: 14, minHeight: 70 }} />
        </div>
      </div>

      {/* ================================================================ DESKTOP (≥ md) */}
      <div className="hidden md:grid" style={{ gridTemplateColumns: "1fr 380px", minHeight: "calc(100vh - 57px)" }}>

        {/* LEFT: form */}
        <div style={{ padding: "40px 56px", overflowY: "auto", borderRight: "1px solid var(--pf-border)" }}>
          <div style={{ maxWidth: 640 }}>

            <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Nom de l'événement"
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 40, fontWeight: 600, letterSpacing: "-0.035em", color: "var(--pf-text)", marginBottom: 8, padding: 0, display: "block" }} />

            <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ajouter une description courte…"
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 16, color: "var(--pf-text-dim)", marginBottom: 36, padding: 0, display: "block" }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>

              <DFormField label="Date">
                <button type="button" onClick={() => setMobileOpen(p => p === "date" ? null : "date")}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", width: "100%", background: "transparent", border: "none", padding: 0 }}>
                  <span style={{ color: formData.date ? "var(--pf-text)" : "var(--pf-text-muted)" }}>
                    {formData.date ? fmtDate(formData.date) : "Choisir une date"}
                  </span>
                  <IcoCal />
                </button>
              </DFormField>

              <DFormField label="Heure">
                <button type="button" onClick={() => setMobileOpen(p => p === "date" ? null : "date")}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", width: "100%", background: "transparent", border: "none", padding: 0 }}>
                  <span style={{ fontFamily: "monospace", color: formData.date ? "var(--pf-text)" : "var(--pf-text-muted)" }}>
                    {formData.date ? fmtTime(formData.date) : "—"}
                  </span>
                  <IcoClock />
                </button>
              </DFormField>

              {mobileOpen === "date" && (
                <div style={{ gridColumn: "span 2" }}>
                  <CalPicker value={formData.date} onChange={v => setFormData({ ...formData, date: v })} />
                </div>
              )}

              <DFormField label="Lieu" span={2}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Bar Le Calbar · adresse"
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, fontWeight: 500, color: "var(--pf-text)" }} />
                  <IcoPin />
                </div>
              </DFormField>

              <DFormField label="Visibilité" span={2}>
                <div style={{ display: "flex", gap: 8 }}>
                  <VisChip label="Privé — invités" active={formData.visibility === "private"} onClick={() => setFormData({ ...formData, visibility: "private" })} />
                  <VisChip label="Amis" active={formData.visibility === "friends"} onClick={() => setFormData({ ...formData, visibility: "friends" })} />
                </div>
              </DFormField>

            </div>
          </div>
        </div>

        {/* RIGHT: live preview */}
        <div style={{ padding: "32px 28px", background: "var(--pf-bg-2)", overflowY: "auto" }}>
          <div style={{ fontSize: 11, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--pf-text-muted)", marginBottom: 16 }}>Aperçu</div>

          <div style={{ background: "var(--pf-surface)", border: "1px solid var(--pf-border)", borderRadius: 16, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ height: 3, background: primaryColor }} />
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em", color: formData.title ? "var(--pf-text)" : "var(--pf-text-muted)", marginBottom: 12, minHeight: 28 }}>
                {formData.title || "Nom de l'événement"}
              </div>
              {formData.date && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "var(--pf-text-dim)" }}>
                  <IcoCal />
                  <span style={{ fontSize: 13 }}>{fmtDate(formData.date)} · {fmtTime(formData.date)}</span>
                </div>
              )}
              {formData.location && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "var(--pf-text-dim)" }}>
                  <IcoPin />
                  <span style={{ fontSize: 13 }}>{formData.location}</span>
                </div>
              )}
              {formData.description && (
                <p style={{ fontSize: 13, color: "var(--pf-text-muted)", marginTop: 10, lineHeight: 1.5 }}>{formData.description}</p>
              )}
            </div>
          </div>

          <div style={{ padding: 12, background: "var(--pf-surface)", border: "1px solid var(--pf-border)", borderRadius: 10, fontSize: 12, color: "var(--pf-text-dim)", lineHeight: 1.5 }}>
            <strong style={{ color: "var(--pf-text)" }}>Note</strong> · Les participants confirmés seront notifiés des modifications.
          </div>
        </div>
      </div>
    </div>
  );
}
