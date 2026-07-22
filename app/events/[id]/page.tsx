"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/themeContext";
import { useToast } from "@/lib/toastContext";

/* ------------------------------------------------------------------ types */
interface PageProps { params: Promise<{ id: string }>; }

interface Participant {
  id: string; userId: string; status: string;
  user: { id: string; name: string | null; email: string };
}

/* --------------------------------------------------------------- constants */
const WEEKDAYS = [
  { key: "lun", label: "L" }, { key: "mar", label: "M" }, { key: "mer", label: "M" },
  { key: "jeu", label: "J" }, { key: "ven", label: "V" }, { key: "sam", label: "S" }, { key: "dim", label: "D" },
];
const AVATAR_COLORS = ["#7C5CFF","#FF7A45","#4FD18B","#FF6BD6","#4F8BFF","#FFB454"];

/* --------------------------------------------------------------- helpers */
function fmtDate(s: string) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(s));
}
function fmtTime(s: string) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(s));
}
function fcolor(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + (s.codePointAt(i) ?? 0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
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
function getStatusBadge(status: string): { background: string; color: string } {
  if (status === "creator") return { background: "rgba(255,180,84,0.15)", color: "#FFB454" };
  if (status === "accepted") return { background: "rgba(79,209,139,0.12)", color: "#4FD18B" };
  if (status === "declined") return { background: "rgba(255,92,92,0.12)", color: "var(--pf-danger)" };
  return { background: "var(--pf-surface-2)", color: "var(--pf-text-muted)" };
}
function getStatusLabel(status: string): string {
  if (status === "creator") return "Créateur";
  if (status === "accepted") return "Accepté";
  if (status === "declined") return "Refusé";
  return "En attente";
}

function IcoTrash() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>;
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
        <label htmlFor="detail-time" style={{ display: "block", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--pf-text-muted)", marginBottom: 5 }}>Heure</label>
        <input id="detail-time" type="time" value={time} onChange={e => changeTime(e.target.value)}
          style={{ width: "100%", background: "var(--pf-surface)", border: `1px solid ${primaryColor}`, borderRadius: 8, padding: "7px 10px", color: "var(--pf-text)", colorScheme: "dark", fontSize: 14, outline: "none" }} />
      </div>
    </div>
  );
}

/* --------------------------------------------------------- MFieldRow (editable) */
function MFieldRow({ icon, label, value, placeholder, divider = false, onClick }:
  Readonly<{ icon: React.ReactNode; label: string; value?: string | null; placeholder?: string; divider?: boolean; onClick?: () => void }>) {
  return (
    <button type="button" onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderTop: divider ? "1px solid var(--pf-border)" : "none", background: "transparent", border: "none", cursor: onClick ? "pointer" : "default", width: "100%", textAlign: "left" }}>
      <span style={{ color: "var(--pf-text-muted)", display: "flex", flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--pf-text-muted)" }}>{label}</span>
        <span style={{ display: "block", fontSize: 13, fontWeight: 500, marginTop: 1, color: value ? "var(--pf-text)" : "var(--pf-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value ?? placeholder}
        </span>
      </span>
      {onClick && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--pf-text-muted)", flexShrink: 0 }}>
          <path d="m9 5 7 7-7 7" />
        </svg>
      )}
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

/* --------------------------------------------------------- ParticipantRow */
function ParticipantRow({ participant }: Readonly<{ participant: Participant }>) {
  const name = participant.user.name || participant.user.email;
  const isCreator = participant.status === "creator";
  const avatarColor = isCreator ? "#FFB454" : fcolor(name);
  const badgeStyle = getStatusBadge(participant.status);
  const badgeLabel = getStatusLabel(participant.status);
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
  const avatarInner = <span>{initials}</span>;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0, overflow: "hidden" }}>
        {avatarInner}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--pf-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
        {participant.user.name && (
          <div style={{ fontSize: 11, color: "var(--pf-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{participant.user.email}</div>
        )}
      </div>
      <span style={{ ...badgeStyle, fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 999, flexShrink: 0 }}>{badgeLabel}</span>
    </div>
  );
}

/* ================================================================ PAGE */
export default function EventDetailPage({ params }: Readonly<PageProps>) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { primaryColor } = useTheme();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState(""); // for delete modal
  const [isOwner, setIsOwner] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [mobileOpen, setMobileOpen] = useState<"date" | "location" | "visibility" | null>(null);
  const locationRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "", description: "", date: "", location: "", visibility: "friends",
  });

  const [showInvite, setShowInvite] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [friends, setFriends] = useState<{ id: string; name: string | null; email: string }[]>([]);
  const [inviting, setInviting] = useState<string | null>(null);

  useEffect(() => { params.then(p => setEventId(p.id)); }, [params]);
  useEffect(() => { if (status === "unauthenticated") router.push("/auth/login"); }, [status, router]);
  useEffect(() => { if (mobileOpen === "location") setTimeout(() => locationRef.current?.focus(), 50); }, [mobileOpen]);

  useEffect(() => {
    if (status !== "authenticated" || !eventId) return;

    const load = async () => {
      try {
        const [evtRes, partRes] = await Promise.all([
          fetch(`/api/events/${eventId}`),
          fetch(`/api/events/${eventId}/participants`),
        ]);
        if (!evtRes.ok) { router.push("/events"); return; }
        const evt = await evtRes.json();

        const userId = (session?.user as { id?: string })?.id;
        setIsOwner(userId === evt.createdById);
        setEventTitle(evt.title);

        const d = new Date(evt.date);
        const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setFormData({
          title: evt.title,
          description: evt.description ?? "",
          date: localDate,
          location: evt.location ?? "",
          visibility: evt.visibility,
        });

        if (partRes.ok) setParticipants(await partRes.json());
      } catch {
        router.push("/events");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [status, eventId, session, router]);

  useEffect(() => {
    if (!isOwner) return;
    fetch("/api/friends?status=accepted")
      .then(r => r.ok ? r.json() : [])
      .then((data: { friend?: { id: string; name: string | null; email: string } }[]) =>
        setFriends(Array.isArray(data) ? data.flatMap(f => f.friend ? [f.friend] : []) : [])
      )
      .catch(() => {});
  }, [isOwner]);

  const addParticipant = async (userId: string) => {
    if (!eventId) return;
    setInviting(userId);
    try {
      const res = await fetch(`/api/events/${eventId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [userId] }),
      });
      if (res.ok) {
        const partRes = await fetch(`/api/events/${eventId}/participants`);
        if (partRes.ok) setParticipants(await partRes.json());
        setFriendSearch("");
        setShowInvite(false);
        showToast("Invitation envoyée !", "success");
      } else {
        showToast("Erreur lors de l'invitation", "error");
      }
    } catch {
      showToast("Erreur lors de l'invitation", "error");
    } finally {
      setInviting(null);
    }
  };

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
      setTimeout(() => router.push("/events"), 800);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!eventId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Événement supprimé", "success");
        setTimeout(() => router.push("/events"), 800);
      } else {
        showToast("Erreur lors de la suppression", "error");
      }
    } catch {
      showToast("Erreur lors de la suppression", "error");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const visLabel = formData.visibility === "private" ? "Privé — invités seulement" : "Amis";
  const canSave = isOwner && formData.title.trim().length > 0 && !saving;
  const dateDisplay = formData.date ? fmtDate(formData.date) : "Choisir une date";
  const timeDisplay = formData.date ? fmtTime(formData.date) : "—";
  const dateColor = formData.date ? "var(--pf-text)" : "var(--pf-text-muted)";
  const dateReadOnly = formData.date ? fmtDate(formData.date) : "—";
  const timeReadOnly = formData.date ? fmtTime(formData.date) : "—";

  if (status === "loading" || loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--pf-bg)" }}>
        <p style={{ fontSize: 13, color: "var(--pf-text-dim)" }}>Chargement…</p>
      </div>
    );
  }

  /* ---- Participants panel (shared between mobile + desktop) ---- */
  const alreadyInEvent = new Set(participants.map(p => p.userId));
  const filteredFriends = friends.filter(f =>
    !alreadyInEvent.has(f.id) &&
    (friendSearch.trim() === "" ||
      (f.name ?? "").toLowerCase().includes(friendSearch.toLowerCase()) ||
      f.email.toLowerCase().includes(friendSearch.toLowerCase()))
  );

  const participantsPanel = (
    <>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--pf-text-muted)" }}>
          Participants · {participants.length}
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={() => { setShowInvite(v => !v); setFriendSearch(""); }}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: showInvite ? "var(--pf-surface-3)" : "var(--pf-surface-2)",
              border: "1px solid var(--pf-border)",
              color: "var(--pf-text-dim)", cursor: "pointer",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            Inviter
          </button>
        )}
      </div>

      {/* Invite search panel */}
      {isOwner && showInvite && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ position: "relative" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--pf-text-muted)", pointerEvents: "none" }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={friendSearch}
              onChange={e => setFriendSearch(e.target.value)}
              placeholder="Chercher un ami…"
              autoFocus
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "8px 12px 8px 32px",
                background: "var(--pf-surface)", border: "1px solid var(--pf-border)",
                borderRadius: 10, fontSize: 13, color: "var(--pf-text)", outline: "none",
              }}
            />
          </div>

          {/* Friend suggestions */}
          {filteredFriends.length > 0 ? (
            <div style={{ marginTop: 6, background: "var(--pf-surface)", border: "1px solid var(--pf-border)", borderRadius: 10, overflow: "hidden" }}>
              {filteredFriends.slice(0, 6).map(f => {
                const name = f.name || f.email;
                const isAdding = inviting === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    disabled={isAdding}
                    onClick={() => { void addParticipant(f.id); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, width: "100%",
                      padding: "9px 12px", background: "transparent", border: "none",
                      borderBottom: "1px solid var(--pf-border)", cursor: "pointer",
                      textAlign: "left", opacity: isAdding ? 0.5 : 1,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--pf-surface-2)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, color: "#fff",
                      background: fcolor(name),
                    }}>
                      {(() => {
                        const p = name.trim().split(/\s+/).filter(Boolean);
                        return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
                      })()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--pf-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                      {f.name && <div style={{ fontSize: 11, color: "var(--pf-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.email}</div>}
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--pf-text-muted)", flexShrink: 0 }}>
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                );
              })}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: "var(--pf-text-muted)", marginTop: 8, textAlign: "center" }}>
              {friends.length === 0 ? "Aucun ami à inviter" : "Aucun résultat"}
            </p>
          )}
        </div>
      )}

      {/* List */}
      {participants.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--pf-text-muted)" }}>Aucun participant pour l&apos;instant.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {participants.map(p => <ParticipantRow key={p.id} participant={p} />)}
        </div>
      )}
    </>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--pf-bg)" }}>

      {/* ---- sticky header ---- */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", position: "sticky", top: 0, zIndex: 10, background: "var(--pf-bg)", borderBottom: "1px solid var(--pf-border)" }}>
        <button type="button" onClick={() => router.back()}
          style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--pf-surface)", border: "1px solid var(--pf-border)", borderRadius: 10, color: "var(--pf-text-dim)", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5-7 7 7 7" /></svg>
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--pf-text)", letterSpacing: "-0.01em" }}>Événement</span>
        {isOwner ? (
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" onClick={() => setShowDeleteModal(true)}
              style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,92,92,0.1)", border: "1px solid rgba(255,92,92,0.2)", borderRadius: 10, color: "var(--pf-danger)", cursor: "pointer" }}>
              <IcoTrash />
            </button>
            <button type="button" onClick={() => { void handleSubmit(); }} disabled={!canSave}
              style={{ padding: "7px 16px", borderRadius: 10, background: primaryColor, color: 'var(--pf-on-accent)', fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", opacity: canSave ? 1 : 0.4 }}>
              {saving ? "…" : "Enregistrer"}
            </button>
          </div>
        ) : (
          <div style={{ width: 80 }} />
        )}
      </div>

      {/* ================================================================ MOBILE (< md) */}
      <div className="md:hidden" style={{ padding: "24px 16px 120px" }}>

        {/* Title */}
        {isOwner ? (
          <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="Nom de l'événement"
            style={{ background: "transparent", border: "none", outline: "none", fontSize: 26, fontWeight: 600, letterSpacing: "-0.025em", color: "var(--pf-text)", marginBottom: 24, display: "block", width: "100%" }} />
        ) : (
          <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.025em", color: "var(--pf-text)", marginBottom: 24 }}>{formData.title}</h1>
        )}

        {/* Field rows card */}
        <div style={{ background: "var(--pf-surface)", border: "1px solid var(--pf-border)", borderRadius: 16, overflow: "hidden", marginBottom: 14 }}>
          <MFieldRow icon={<IcoCal />} label="Date" value={formData.date ? fmtDate(formData.date) : null} placeholder="Choisir une date"
            onClick={isOwner ? () => setMobileOpen(p => p === "date" ? null : "date") : undefined} />
          <MFieldRow icon={<IcoClock />} label="Heure" value={formData.date ? fmtTime(formData.date) : null} placeholder="—" divider
            onClick={isOwner ? () => setMobileOpen(p => p === "date" ? null : "date") : undefined} />
          <MFieldRow icon={<IcoPin />} label="Lieu" value={formData.location || null} placeholder={isOwner ? "Ajouter un lieu" : "—"} divider
            onClick={isOwner ? () => setMobileOpen(p => p === "location" ? null : "location") : undefined} />
          <MFieldRow icon={<IcoVis />} label="Visibilité" value={visLabel} divider
            onClick={isOwner ? () => setMobileOpen(p => p === "visibility" ? null : "visibility") : undefined} />
        </div>

        {/* Inline panels (owner only) */}
        {isOwner && mobileOpen === "date" && (
          <div style={{ marginBottom: 14 }}>
            <CalPicker value={formData.date} onChange={v => setFormData({ ...formData, date: v })} />
          </div>
        )}
        {isOwner && mobileOpen === "location" && (
          <div style={{ marginBottom: 14 }}>
            <input ref={locationRef} type="text" value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="Restaurant, adresse…"
              style={{ width: "100%", background: "var(--pf-surface)", border: "1px solid var(--pf-border)", borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "var(--pf-text)", outline: "none", boxSizing: "border-box" }} />
          </div>
        )}
        {isOwner && mobileOpen === "visibility" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <VisChip label="Privé" active={formData.visibility === "private"} onClick={() => setFormData({ ...formData, visibility: "private" })} />
            <VisChip label="Amis" active={formData.visibility === "friends"} onClick={() => setFormData({ ...formData, visibility: "friends" })} />
          </div>
        )}

        {/* Description */}
        <div style={{ background: "var(--pf-surface)", border: "1px solid var(--pf-border)", borderRadius: 16, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--pf-text-muted)", marginBottom: 6 }}>Description</div>
          {isOwner ? (
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Détails de l'événement…" rows={3}
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", color: "var(--pf-text)", fontFamily: "inherit", fontSize: 14, minHeight: 70 }} />
          ) : (
            <p style={{ fontSize: 14, color: "var(--pf-text-dim)", lineHeight: 1.5, margin: 0 }}>
              {formData.description || <span style={{ color: "var(--pf-text-muted)" }}>Aucune description</span>}
            </p>
          )}
        </div>

        {/* Participants */}
        <div style={{ background: "var(--pf-surface)", border: "1px solid var(--pf-border)", borderRadius: 16, padding: 14 }}>
          {participantsPanel}
        </div>
      </div>

      {/* ================================================================ DESKTOP (≥ md) */}
      <div className="hidden md:grid" style={{ gridTemplateColumns: "1fr 380px", minHeight: "calc(100vh - 57px)" }}>

        {/* LEFT: form */}
        <div style={{ padding: "40px 56px", overflowY: "auto", borderRight: "1px solid var(--pf-border)" }}>
          <div style={{ maxWidth: 640 }}>

            {isOwner ? (
              <>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nom de l'événement"
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 40, fontWeight: 600, letterSpacing: "-0.035em", color: "var(--pf-text)", marginBottom: 8, padding: 0, display: "block" }} />
                <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ajouter une description courte…"
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 16, color: "var(--pf-text-dim)", marginBottom: 36, padding: 0, display: "block" }} />
              </>
            ) : (
              <>
                <h1 style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.035em", color: "var(--pf-text)", marginBottom: 8, lineHeight: 1.1 }}>{formData.title}</h1>
                <p style={{ fontSize: 16, color: "var(--pf-text-dim)", marginBottom: 36 }}>{formData.description || " "}</p>
              </>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>

              <DFormField label="Date">
                {isOwner ? (
                  <button type="button" onClick={() => setMobileOpen(p => p === "date" ? null : "date")}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", width: "100%", background: "transparent", border: "none", padding: 0 }}>
                    <span style={{ color: dateColor }}>
                      {dateDisplay}
                    </span>
                    <IcoCal />
                  </button>
                ) : (
                  <span style={{ color: "var(--pf-text)" }}>{dateReadOnly}</span>
                )}
              </DFormField>

              <DFormField label="Heure">
                {isOwner ? (
                  <button type="button" onClick={() => setMobileOpen(p => p === "date" ? null : "date")}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", width: "100%", background: "transparent", border: "none", padding: 0 }}>
                    <span style={{ fontFamily: "monospace", color: dateColor }}>
                      {timeDisplay}
                    </span>
                    <IcoClock />
                  </button>
                ) : (
                  <span style={{ fontFamily: "monospace", color: "var(--pf-text)" }}>{timeReadOnly}</span>
                )}
              </DFormField>

              {isOwner && mobileOpen === "date" && (
                <div style={{ gridColumn: "span 2" }}>
                  <CalPicker value={formData.date} onChange={v => setFormData({ ...formData, date: v })} />
                </div>
              )}

              <DFormField label="Lieu" span={2}>
                {isOwner ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Bar Le Calbar · adresse"
                      style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, fontWeight: 500, color: "var(--pf-text)" }} />
                    <IcoPin />
                  </div>
                ) : (
                  <span style={{ color: "var(--pf-text)" }}>{formData.location || "—"}</span>
                )}
              </DFormField>

              <DFormField label="Visibilité" span={2}>
                {isOwner ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <VisChip label="Privé — invités" active={formData.visibility === "private"} onClick={() => setFormData({ ...formData, visibility: "private" })} />
                    <VisChip label="Amis" active={formData.visibility === "friends"} onClick={() => setFormData({ ...formData, visibility: "friends" })} />
                  </div>
                ) : (
                  <span style={{ color: "var(--pf-text)" }}>{visLabel}</span>
                )}
              </DFormField>

            </div>
          </div>
        </div>

        {/* RIGHT: participants */}
        <div style={{ padding: "32px 28px", background: "var(--pf-bg-2)", overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1 }}>
            {participantsPanel}
          </div>

          {isOwner && (
            <div style={{ paddingTop: 16, borderTop: "1px solid var(--pf-border)", marginTop: 16 }}>
              <button type="button" onClick={() => setShowDeleteModal(true)} disabled={deleting}
                style={{ width: "100%", padding: "10px 16px", borderRadius: 10, background: "rgba(255,92,92,0.08)", border: "1px solid rgba(255,92,92,0.2)", color: "var(--pf-danger)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <IcoTrash />
                Supprimer l&apos;événement
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ---- Delete modal ---- */}
      {showDeleteModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.6)" }}
          className="md:items-center">
          <div style={{ width: "100%", maxWidth: 360, background: "var(--pf-surface)", border: "1px solid var(--pf-border)", borderRadius: 20, padding: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,92,92,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <IcoTrash />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, textAlign: "center", color: "var(--pf-text)", marginBottom: 6 }}>Supprimer l&apos;événement ?</p>
            <p style={{ fontSize: 12, textAlign: "center", color: "var(--pf-text-muted)", marginBottom: 18 }}>
              &ldquo;{eventTitle}&rdquo; sera définitivement supprimé.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setShowDeleteModal(false)}
                style={{ flex: 1, padding: "10px 0", borderRadius: 12, background: "var(--pf-surface-2)", border: "1px solid var(--pf-border)", color: "var(--pf-text-dim)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                Annuler
              </button>
              <button type="button" onClick={() => { void handleDelete(); }} disabled={deleting}
                style={{ flex: 1, padding: "10px 0", borderRadius: 12, background: "var(--pf-danger)", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: deleting ? 0.5 : 1 }}>
                {deleting ? "…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
