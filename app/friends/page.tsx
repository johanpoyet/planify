"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/themeContext";
import { useToast } from "@/lib/toastContext";

interface Friend { id: string; name: string | null; email: string; }
interface Friendship { id: string; friend: Friend; status: string; isReceiver: boolean; createdAt: string; }

const AVATAR_COLORS = ['#7C5CFF', '#FF7A45', '#4FD18B', '#FF6BD6', '#4F8BFF', '#FFB454', '#5CE0E0'];
function getColor(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + (s.codePointAt(i) ?? 0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function FriendAvatar({ friend, size = 40 }: Readonly<{ friend: Friend; size?: number }>) {
  const display = friend.name || friend.email;
  const parts = display.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length >= 2
    ? (parts[0][0] + (parts.at(-1) ?? parts[0])[0]).toUpperCase()
    : display.slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: getColor(display), flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 600, color: '#fff',
    }}>
      {initials}
    </div>
  );
}

const IcoPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const IcoSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
  </svg>
);
const IcoX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);
const IcoMore = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="12" r="1.2" fill="currentColor"/>
    <circle cx="12" cy="12" r="1.2" fill="currentColor"/>
    <circle cx="19" cy="12" r="1.2" fill="currentColor"/>
  </svg>
);

type SetHidden = React.Dispatch<React.SetStateAction<Set<string>>>;
type Toast   = (msg: string, type: string) => void;
type Refresh = () => void;

async function acceptFriendship(id: string, setHiddenIds: SetHidden, toast: Toast, refresh: Refresh) {
  setHiddenIds(prev => new Set(prev).add(id));
  try {
    const res = await fetch(`/api/friends/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "accept" }) });
    if (res.ok) { toast("Demande acceptée !", "success"); setTimeout(refresh, 300); }
    else { setHiddenIds(prev => { const s = new Set(prev); s.delete(id); return s; }); toast("Erreur", "error"); }
  } catch {
    setHiddenIds(prev => { const s = new Set(prev); s.delete(id); return s; });
  }
}

async function rejectFriendship(
  id: string, setHiddenIds: SetHidden, toast: Toast, refresh: Refresh,
  setActionLoading: React.Dispatch<React.SetStateAction<boolean>>
) {
  setActionLoading(true);
  setHiddenIds(prev => new Set(prev).add(id));
  try {
    const res = await fetch(`/api/friends/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reject" }) });
    if (res.ok) { toast("Demande refusée", "success"); setTimeout(refresh, 300); }
    else { setHiddenIds(prev => { const s = new Set(prev); s.delete(id); return s; }); }
  } finally {
    setActionLoading(false);
  }
}

async function removeFriendship(
  id: string, toast: Toast, refresh: Refresh,
  setActionLoading: React.Dispatch<React.SetStateAction<boolean>>
) {
  setActionLoading(true);
  try {
    const res = await fetch(`/api/friends/${id}`, { method: "DELETE" });
    if (res.ok) { toast("Retiré", "success"); refresh(); }
    else toast("Erreur", "error");
  } finally {
    setActionLoading(false);
  }
}

export default function FriendsPage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const { primaryColor } = useTheme();
  const { showToast } = useToast();

  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [addEmail, setAddEmail] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);
  const [desktopSearch, setDesktopSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState<Friendship | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<Friendship | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (sessionStatus === "unauthenticated") router.push("/auth/login");
  }, [sessionStatus, router]);

  useEffect(() => {
    if (sessionStatus === "authenticated") fetchFriends();
  }, [sessionStatus]);

  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/friends?status=all");
      if (res.ok) {
        const data: Friendship[] = await res.json();
        setFriendships(data.filter(f => f.friend != null));
      }
    } finally {
      setLoading(false);
    }
  };

  const closeAddModal = () => { setShowAddModal(false); setAddEmail(""); setAddError(""); };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setAdding(true);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendEmail: addEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      closeAddModal();
      fetchFriends();
      showToast("Demande d'ami envoyée !", "success");
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setAdding(false);
    }
  };

  const handleAccept = (id: string) => acceptFriendship(id, setHiddenIds, showToast, fetchFriends);
  const handleReject = (id: string) => { setShowRejectConfirm(null); return rejectFriendship(id, setHiddenIds, showToast, fetchFriends, setActionLoading); };
  const handleRemove = (id: string) => { setShowRemoveConfirm(null); return removeFriendship(id, showToast, fetchFriends, setActionLoading); };

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--pf-bg)' }}>
        <p className="text-sm" style={{ color: 'var(--pf-text-dim)' }}>Chargement…</p>
      </div>
    );
  }

  const accepted = friendships.filter(f => f.status === "accepted");
  const pendingReceived = friendships
    .filter(f => f.status === "pending" && f.isReceiver)
    .filter(f => hiddenIds.has(f.id) === false);
  const pendingSent = friendships.filter(f => f.status === "pending" && f.isReceiver === false);
  const filteredFriends = desktopSearch
    ? accepted.filter(f => {
        const q = desktopSearch.toLowerCase();
        return (f.friend.name || "").toLowerCase().includes(q) || f.friend.email.toLowerCase().includes(q);
      })
    : accepted;
  const removeLabel = showRemoveConfirm?.status === "accepted" ? "Retirer" : "Confirmer";

  return (
    <div style={{ background: 'var(--pf-bg)', color: 'var(--pf-text)' }}>

      {/* ── MOBILE ─────────────────────────────────────────────────── */}
      <div className="md:hidden min-h-screen">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-3">
          <div>
            <div
              className="font-mono text-xs uppercase mb-0.5"
              style={{ color: 'var(--pf-text-muted)', letterSpacing: '0.08em' }}
            >
              {accepted.length} ami{accepted.length === 1 ? '' : 's'}
            </div>
            <h1 className="font-semibold" style={{ fontSize: 26, letterSpacing: '-0.025em' }}>Amis</h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center rounded-xl"
            style={{ width: 36, height: 36, background: 'var(--pf-surface)', border: '1px solid var(--pf-border)', color: 'var(--pf-text-dim)' }}
          >
            <IcoPlus />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-5 pb-4">
          <div
            className="flex items-center gap-2.5 rounded-xl px-3.5"
            style={{ height: 40, background: 'var(--pf-surface)', border: '1px solid var(--pf-border)' }}
          >
            <IcoSearch />
            <span className="text-sm" style={{ color: 'var(--pf-text-muted)' }}>Trouver un ami</span>
          </div>
        </div>

        {/* Pending received */}
        {pendingReceived.length > 0 && (
          <div className="px-5 pb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ letterSpacing: '-0.01em' }}>
                Demandes · {pendingReceived.length}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {pendingReceived.map(f => (
                <div
                  key={f.id}
                  className="rounded-2xl p-3 transition-all duration-300"
                  style={{
                    background: 'var(--pf-surface)',
                    border: '1px solid var(--pf-border)',
                    opacity: hiddenIds.has(f.id) ? 0 : 1,
                    transform: hiddenIds.has(f.id) ? 'translateY(-4px)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <FriendAvatar friend={f.friend} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--pf-text)' }}>
                        {f.friend.name || "Sans nom"}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--pf-text-muted)' }}>
                        {f.friend.email}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAccept(f.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
                      style={{ background: primaryColor, color: 'var(--pf-on-accent)' }}
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => setShowRejectConfirm(f)}
                      className="flex items-center justify-center rounded-lg flex-shrink-0"
                      style={{ width: 32, height: 32, background: 'var(--pf-surface-2)', color: 'var(--pf-text-muted)' }}
                    >
                      <IcoX />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends list */}
        <div className="px-5 pb-2">
          <p className="text-sm font-semibold" style={{ letterSpacing: '-0.01em' }}>Tes amis</p>
        </div>

        <div className="pb-28">
          {accepted.length === 0 ? (
            <div
              className="mx-5 mt-3 rounded-2xl p-10 text-center"
              style={{ background: 'var(--pf-surface)', border: '1px solid var(--pf-border)' }}
            >
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--pf-text-dim)' }}>
                Aucun ami pour l&apos;instant
              </p>
              <p className="text-xs" style={{ color: 'var(--pf-text-muted)' }}>
                Appuie sur + pour en ajouter.
              </p>
            </div>
          ) : (
            <div className="px-5">
              {accepted.map((f, i) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 py-3"
                  style={{ borderBottom: i < accepted.length - 1 ? '1px solid var(--pf-border)' : 'none' }}
                >
                  <FriendAvatar friend={f.friend} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--pf-text)' }}>
                      {f.friend.name || "Sans nom"}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--pf-text-muted)' }}>
                      {f.friend.email}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowRemoveConfirm(f)}
                    className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ width: 30, height: 30, color: 'var(--pf-text-muted)' }}
                  >
                    <IcoMore />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── DESKTOP ────────────────────────────────────────────────── */}
      <div className="hidden md:block">

        {/* Topbar */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-8"
          style={{ height: 56, borderBottom: '1px solid var(--pf-border)', background: 'var(--pf-bg)' }}
        >
          <div className="flex items-center gap-3">
            <h1 className="font-semibold" style={{ fontSize: 20, letterSpacing: '-0.02em' }}>Amis</h1>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: 'var(--pf-surface-2)', color: 'var(--pf-text-dim)', border: '1px solid var(--pf-border)' }}
            >
              {accepted.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 px-3 rounded-lg"
              style={{ width: 260, height: 36, background: 'var(--pf-surface)', border: '1px solid var(--pf-border)' }}
            >
              <IcoSearch />
              <input
                type="text"
                placeholder="Chercher un ami…"
                value={desktopSearch}
                onChange={e => setDesktopSearch(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm"
                style={{ color: 'var(--pf-text)' }}
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold"
              style={{ background: primaryColor, color: 'var(--pf-on-accent)' }}
            >
              <IcoPlus /> Ajouter un ami
            </button>
          </div>
        </div>

        {/* Split layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', minHeight: 'calc(100vh - 56px)' }}>

          {/* Left: main content */}
          <div className="overflow-y-auto" style={{ padding: '32px 40px' }}>

            {/* Pending received — 2-col cards */}
            {pendingReceived.length > 0 && (
              <div style={{ marginBottom: 36 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                  <h2 className="font-semibold" style={{ fontSize: 18, letterSpacing: '-0.015em' }}>
                    Demandes en attente
                  </h2>
                  <span className="text-xs" style={{ color: 'var(--pf-text-muted)' }}>
                    {pendingReceived.length} nouvelle{pendingReceived.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {pendingReceived.map(f => (
                    <div
                      key={f.id}
                      className="rounded-2xl transition-all duration-300"
                      style={{
                        padding: 16,
                        background: 'var(--pf-surface)',
                        border: '1px solid var(--pf-border)',
                        opacity: hiddenIds.has(f.id) ? 0 : 1,
                      }}
                    >
                      <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
                        <FriendAvatar friend={f.friend} size={44} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--pf-text)' }}>
                            {f.friend.name || "Sans nom"}
                          </p>
                          <p className="text-xs truncate" style={{ color: 'var(--pf-text-muted)' }}>
                            {f.friend.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(f.id)}
                          className="flex-1 py-2 rounded-xl text-sm font-semibold"
                          style={{ background: primaryColor, color: 'var(--pf-on-accent)' }}
                        >
                          Accepter
                        </button>
                        <button
                          onClick={() => setShowRejectConfirm(f)}
                          className="flex-1 py-2 rounded-xl text-sm font-medium"
                          style={{ background: 'var(--pf-surface-2)', border: '1px solid var(--pf-border)', color: 'var(--pf-text-dim)' }}
                        >
                          Décliner
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All friends — 2-col grid */}
            <div>
              <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                <h2 className="font-semibold" style={{ fontSize: 18, letterSpacing: '-0.015em' }}>
                  Tous tes amis
                </h2>
              </div>

              {filteredFriends.length === 0 ? (
                <div
                  className="rounded-2xl p-12 text-center"
                  style={{ background: 'var(--pf-surface)', border: '1px solid var(--pf-border)' }}
                >
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--pf-text-dim)' }}>
                    {desktopSearch ? 'Aucun ami trouvé' : "Aucun ami pour l'instant"}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--pf-text-muted)' }}>
                    {desktopSearch ? 'Essaie un autre nom.' : 'Utilise "Ajouter un ami" pour en inviter.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {filteredFriends.map(f => (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 rounded-xl"
                      style={{ padding: 12, background: 'var(--pf-surface)', border: '1px solid var(--pf-border)' }}
                    >
                      <FriendAvatar friend={f.friend} size={40} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--pf-text)' }}>
                          {f.friend.name || "Sans nom"}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--pf-text-muted)' }}>
                          {f.friend.email}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowRemoveConfirm(f)}
                        className="flex items-center justify-center rounded-lg flex-shrink-0 transition-colors"
                        style={{ width: 30, height: 30, color: 'var(--pf-text-muted)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--pf-surface-2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <IcoMore />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div
            className="overflow-y-auto"
            style={{ borderLeft: '1px solid var(--pf-border)', padding: '32px 24px', background: 'var(--pf-bg-2)' }}
          >
            <p className="font-semibold text-sm mb-3.5" style={{ letterSpacing: '-0.01em' }}>
              Ajouter un ami
            </p>
            <form onSubmit={handleAdd}>
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={addEmail}
                onChange={e => { setAddEmail(e.target.value); setAddError(""); }}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none mb-2"
                style={{ background: 'var(--pf-surface)', border: '1px solid var(--pf-border)', color: 'var(--pf-text)' }}
                onFocus={e => (e.currentTarget.style.borderColor = primaryColor)}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--pf-border)')}
              />
              {addError && (
                <p className="text-xs mb-2" style={{ color: 'var(--pf-danger)' }}>{addError}</p>
              )}
              <button
                type="submit"
                disabled={adding}
                className="w-full py-2.5 rounded-xl text-sm font-semibold mb-2 disabled:opacity-50"
                style={{ background: primaryColor, color: 'var(--pf-on-accent)' }}
              >
                {adding ? '…' : 'Envoyer la demande'}
              </button>
            </form>

            {pendingSent.length > 0 && (
              <>
                <div style={{ height: 1, background: 'var(--pf-border)', margin: '24px 0' }} />
                <p className="font-semibold text-sm mb-3" style={{ letterSpacing: '-0.01em' }}>
                  Demandes envoyées
                </p>
                <div className="flex flex-col gap-1">
                  {pendingSent.map(f => (
                    <div key={f.id} className="flex items-center gap-3 py-2">
                      <FriendAvatar friend={f.friend} size={32} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--pf-text)' }}>
                          {f.friend.name || "Sans nom"}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--pf-text-muted)' }}>En attente</p>
                      </div>
                      <button
                        onClick={() => setShowRemoveConfirm(f)}
                        className="text-xs px-2.5 py-1.5 rounded-lg flex-shrink-0"
                        style={{ background: 'var(--pf-surface)', border: '1px solid var(--pf-border)', color: 'var(--pf-text-dim)' }}
                      >
                        Annuler
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── ADD FRIEND MODAL ────────────────────────────────────────── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          role="none"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={e => { if (e.target === e.currentTarget) closeAddModal(); }}
          onKeyDown={e => { if (e.key === 'Escape') closeAddModal(); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'var(--pf-surface)', border: '1px solid var(--pf-border)' }}
          >
            <h3 className="font-semibold text-base mb-4" style={{ color: 'var(--pf-text)', letterSpacing: '-0.015em' }}>
              Ajouter un ami
            </h3>
            <form onSubmit={handleAdd}>
              <input
                type="email"
                required
                autoFocus
                placeholder="email@example.com"
                value={addEmail}
                onChange={e => { setAddEmail(e.target.value); setAddError(""); }}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none mb-3"
                style={{ background: 'var(--pf-surface-2)', border: '1px solid var(--pf-border)', color: 'var(--pf-text)' }}
                onFocus={e => (e.currentTarget.style.borderColor = primaryColor)}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--pf-border)')}
              />
              {addError && (
                <p className="text-xs mb-3" style={{ color: 'var(--pf-danger)' }}>{addError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--pf-surface-2)', border: '1px solid var(--pf-border)', color: 'var(--pf-text-dim)' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                  style={{ background: primaryColor, color: 'var(--pf-on-accent)' }}
                >
                  {adding ? '…' : 'Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── REJECT MODAL ────────────────────────────────────────────── */}
      {showRejectConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'var(--pf-surface)', border: '1px solid var(--pf-border)' }}
          >
            <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--pf-text)', letterSpacing: '-0.015em' }}>
              Refuser cette demande ?
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--pf-text-dim)' }}>
              La demande de{' '}
              <strong style={{ color: 'var(--pf-text)' }}>
                {showRejectConfirm.friend.name || showRejectConfirm.friend.email}
              </strong>{' '}
              sera refusée.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRejectConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--pf-surface-2)', border: '1px solid var(--pf-border)', color: 'var(--pf-text-dim)' }}
              >
                Annuler
              </button>
              <button
                onClick={() => handleReject(showRejectConfirm.id)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: 'var(--pf-warn)', color: '#0B0B0F' }}
              >
                {actionLoading ? '…' : 'Refuser'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REMOVE / CANCEL MODAL ───────────────────────────────────── */}
      {showRemoveConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'var(--pf-surface)', border: '1px solid var(--pf-border)' }}
          >
            <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--pf-text)', letterSpacing: '-0.015em' }}>
              {showRemoveConfirm.status === "accepted" ? "Retirer cet ami ?" : "Annuler cette demande ?"}
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--pf-text-dim)' }}>
              <strong style={{ color: 'var(--pf-text)' }}>
                {showRemoveConfirm.friend.name || showRemoveConfirm.friend.email}
              </strong>{' '}
              {showRemoveConfirm.status === "accepted"
                ? "sera retiré de ta liste d'amis."
                : "ne recevra plus ta demande."}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRemoveConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--pf-surface-2)', border: '1px solid var(--pf-border)', color: 'var(--pf-text-dim)' }}
              >
                Annuler
              </button>
              <button
                onClick={() => handleRemove(showRemoveConfirm.id)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: 'var(--pf-danger)', color: '#fff' }}
              >
                {actionLoading ? '…' : removeLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
