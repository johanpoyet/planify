"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/lib/themeContext";
import { useSession } from "next-auth/react";

// ── Types ─────────────────────────────────────────────────────────────────
interface PollOptionData { id: string; text: string; }
interface VoterInfo { id: string; name: string | null; email: string; }
interface Vote { id: string; optionId: string; userId: string; createdAt: string; user: VoterInfo | null; }
interface PollInfo { id: string; question: string; deadline: string | null; status: string; }
interface PollData { poll: PollInfo; options: PollOptionData[]; votes: Vote[]; }
type Message = { text: string; type: "success" | "error" };
type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

// ── Helpers ───────────────────────────────────────────────────────────────
const COLORS = ["#7C5CFF","#FF7A45","#4FD18B","#FF6BD6","#4F8BFF","#FFB454","#5CE0E0","#FF5C5C"];

function getColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + (seed.codePointAt(i) ?? 0)) >>> 0;
  return COLORS[h % COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2
    ? (parts[0][0] + (parts.at(-1) ?? parts[0])[0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function fmtDate(ds: string): string {
  return new Date(ds).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtRelative(ds: string): string {
  const diff = Date.now() - new Date(ds).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
}

function voterName(v: VoterInfo | null): string {
  return v?.name ?? v?.email ?? "Anonyme";
}

// ── Sub-components ────────────────────────────────────────────────────────
function MiniAvatar({ name, size }: Readonly<{ name: string; size: number }>) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: getColor(name),
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.36), fontWeight: 700, color: "#fff", flexShrink: 0,
      border: "1.5px solid var(--pf-bg)",
    }}>
      {getInitials(name)}
    </div>
  );
}

function VoterStack({ voters, max = 5 }: Readonly<{ voters: string[]; max?: number }>) {
  const shown = voters.slice(0, max);
  const extra = voters.length - max;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {shown.map((name, i) => (
        <div key={name + i} style={{ marginLeft: i === 0 ? 0 : -6, zIndex: shown.length - i }}>
          <MiniAvatar name={name} size={20} />
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          marginLeft: -6, width: 20, height: 20, borderRadius: "50%",
          background: "var(--pf-surface-2)", border: "1.5px solid var(--pf-bg)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 700, color: "var(--pf-text-muted)",
        }}>
          +{extra}
        </div>
      )}
    </div>
  );
}

// ── Standalone async functions ────────────────────────────────────────────
async function loadPollData(
  pollId: string,
  userEmail: string | null | undefined,
  setPollData: SetState<PollData | null>,
  setHasVoted: SetState<boolean>,
  setCurrentVote: SetState<string | null>,
  setSelected: SetState<string | null>,
  setIsEditing: SetState<boolean>,
): Promise<void> {
  const data: PollData = await fetch(`/api/polls/${pollId}`).then(r => r.json());
  setPollData(data);
  if (data.votes && userEmail) {
    const userData: { id: string } = await fetch("/api/user").then(r => r.json());
    const userVote = data.votes.find(v => v.userId === userData.id);
    if (userVote) {
      setHasVoted(true);
      setCurrentVote(userVote.optionId);
      setSelected(userVote.optionId);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }
}

async function submitVote(
  pollId: string,
  optionId: string,
  hadVoted: boolean,
  setLoading: SetState<boolean>,
  setMessage: SetState<Message | null>,
  setHasVoted: SetState<boolean>,
  setCurrentVote: SetState<string | null>,
  setIsEditing: SetState<boolean>,
  setPollData: SetState<PollData | null>,
): Promise<void> {
  setLoading(true);
  setMessage(null);
  try {
    const res = await fetch("/api/polls/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pollId, optionId }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error || "Erreur");
    setMessage({ text: hadVoted ? "Vote modifié !" : "Vote enregistré !", type: "success" });
    setHasVoted(true);
    setCurrentVote(optionId);
    setIsEditing(false);
    const refreshed: PollData = await fetch(`/api/polls/${pollId}`).then(r => r.json());
    setPollData(refreshed);
  } catch (err: unknown) {
    setMessage({ text: err instanceof Error ? err.message : "Erreur", type: "error" });
  } finally {
    setLoading(false);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
export default function PollCard({ pollId }: Readonly<{ pollId: string }>) {
  const { data: session } = useSession();
  const { primaryColor } = useTheme();

  const [pollData, setPollData] = useState<PollData | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState<Message | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [currentVote, setCurrentVote] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setLoadingData(true);
    loadPollData(pollId, session?.user?.email, setPollData, setHasVoted, setCurrentVote, setSelected, setIsEditing)
      .catch(() => setPollData(null))
      .finally(() => setLoadingData(false));
  }, [pollId, session]);

  const handleVote = () => {
    if (selected === null) { setMessage({ text: "Choisissez une option", type: "error" }); return; }
    void submitVote(pollId, selected, hasVoted, setLoading, setMessage, setHasVoted, setCurrentVote, setIsEditing, setPollData);
  };

  const handleEnableEditing = () => { setIsEditing(true); setMessage(null); };
  const handleCancelEditing = () => { setSelected(currentVote); setIsEditing(false); setMessage(null); };

  /* ── Loading ──────────────────────────────────────────────────────────── */
  if (loadingData) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
        <svg style={{ animation: "spin 1s linear infinite", color: primaryColor }} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
      </div>
    );
  }

  if (!pollData?.poll) {
    return (
      <div style={{ textAlign: "center", padding: "64px 0" }}>
        <p style={{ fontSize: 14, color: "var(--pf-text-dim)" }}>Sondage introuvable</p>
      </div>
    );
  }

  const { poll, options, votes } = pollData;
  const totalVotes = votes.length;
  const optionMap = Object.fromEntries(options.map(o => [o.id, o.text]));

  const optionVoteList = (optId: string) => votes.filter(v => v.optionId === optId);
  const optionVotes = (optId: string) => optionVoteList(optId).length;
  const pct = (optId: string) => totalVotes > 0 ? Math.round((optionVotes(optId) / totalVotes) * 100) : 0;

  const submitLabel = loading ? "…" : (hasVoted ? "Valider la modification" : "Confirmer mon vote");
  const isActive = loading || selected === null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Meta ────────────────────────────────────────────────────────── */}
      <div>
        <p style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: primaryColor, marginBottom: 10 }}>
          Sondage{poll.deadline !== null ? ` · ${fmtDate(poll.deadline)}` : ""}
        </p>
        <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.2, color: "var(--pf-text)" }}>
          {poll.question}
        </h2>
        <p style={{ fontSize: 13, color: "var(--pf-text-muted)", marginTop: 8 }}>
          {totalVotes} vote{totalVotes === 1 ? "" : "s"} · {poll.status === "resolved" ? "Résolu" : poll.status === "cancelled" ? "Annulé" : "En cours"}
        </p>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid var(--pf-border)", margin: 0 }} />

      {/* ── Options heading ──────────────────────────────────────────────── */}
      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--pf-text)" }}>
        {isEditing ? "Choisis ta préférence" : "Résultats"}
      </p>

      {/* ── Option cards ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {options.map(opt => {
          const isSelected = selected === opt.id;
          const optVotes = optionVoteList(opt.id);
          const voteCnt = optVotes.length;
          const pctVal = pct(opt.id);
          const maxPct = Math.max(...options.map(o => pct(o.id)));
          const isLeading = pctVal > 0 && pctVal === maxPct;
          const voterNames = optVotes.map(v => voterName(v.user));

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => { if (isEditing) setSelected(opt.id); }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: 16, borderRadius: 14,
                background: isSelected ? "var(--pf-accent-soft)" : "var(--pf-surface)",
                border: `1px solid ${isSelected ? primaryColor : "var(--pf-border)"}`,
                cursor: isEditing ? "pointer" : "default",
                transition: "background 0.15s, border-color 0.15s",
              }}
            >
              {/* Top row: radio + text + pct */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                  border: `1.5px solid ${isSelected ? primaryColor : "var(--pf-border)"}`,
                  background: isSelected ? primaryColor : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isSelected && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--pf-text)" }}>{opt.text}</span>
                <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600, flexShrink: 0, color: isSelected ? primaryColor : (isLeading ? "var(--pf-text)" : "var(--pf-text-muted)") }}>
                  {pctVal}%
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ height: 5, borderRadius: 3, background: "var(--pf-surface-2)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 3, width: `${pctVal}%`,
                  background: isSelected ? primaryColor : (isLeading ? "var(--pf-text-dim)" : "var(--pf-border)"),
                  transition: "width 0.3s ease",
                }} />
              </div>

              {/* Voter avatars + count */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                {voteCnt > 0 ? (
                  <VoterStack voters={voterNames} />
                ) : (
                  <span style={{ fontSize: 11, color: "var(--pf-text-muted)" }}>Aucun vote</span>
                )}
                {voteCnt > 0 && (
                  <span style={{ fontSize: 11, color: "var(--pf-text-muted)" }}>
                    {voteCnt} vote{voteCnt === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Message ──────────────────────────────────────────────────────── */}
      {message !== null && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 16px", borderRadius: 12, fontSize: 13,
          background: message.type === "success" ? "rgba(79,209,139,0.08)" : "rgba(239,68,68,0.08)",
          border: `1px solid ${message.type === "success" ? "rgba(79,209,139,0.25)" : "rgba(239,68,68,0.25)"}`,
          color: message.type === "success" ? "#4FD18B" : "#ef4444",
        }}>
          {message.type === "success" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
          )}
          {message.text}
        </div>
      )}

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      {isEditing ? (
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={handleVote}
            disabled={isActive}
            style={{
              flex: 2, padding: "12px 0", borderRadius: 12, fontSize: 14, fontWeight: 600,
              background: isActive ? "var(--pf-surface-2)" : primaryColor,
              color: isActive ? "var(--pf-text-muted)" : "#fff",
              border: "none", cursor: isActive ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loading && (
              <svg style={{ animation: "spin 1s linear infinite" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
            )}
            {submitLabel}
          </button>
          {hasVoted && (
            <button
              type="button"
              onClick={handleCancelEditing}
              disabled={loading}
              style={{
                flex: 1, padding: "12px 0", borderRadius: 12, fontSize: 14, fontWeight: 500,
                background: "var(--pf-surface)", border: "1px solid var(--pf-border)",
                color: "var(--pf-text-dim)", cursor: loading ? "default" : "pointer",
              }}
            >
              Annuler
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleEnableEditing}
          style={{
            width: "100%", padding: "12px 0", borderRadius: 12, fontSize: 14, fontWeight: 600,
            background: "var(--pf-surface)", border: `1px solid ${primaryColor}`,
            color: primaryColor, cursor: "pointer",
          }}
        >
          Modifier mon vote
        </button>
      )}

      {/* ── Activité ─────────────────────────────────────────────────────── */}
      {votes.length > 0 && (
        <>
          <hr style={{ border: "none", borderTop: "1px solid var(--pf-border)", margin: 0 }} />
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--pf-text)" }}>Activité</p>
              <span style={{ fontSize: 11, color: "var(--pf-text-muted)" }}>
                Dernier vote {fmtRelative(votes[0].createdAt)}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {votes.map(vote => {
                const name = voterName(vote.user);
                const optText = optionMap[vote.optionId] ?? "?";
                return (
                  <div key={vote.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--pf-border)" }}>
                    <MiniAvatar name={name} size={28} />
                    <p style={{ flex: 1, fontSize: 13, color: "var(--pf-text)" }}>
                      <strong style={{ fontWeight: 600 }}>{name}</strong>
                      <span style={{ color: "var(--pf-text-dim)" }}> a voté pour </span>
                      <strong style={{ fontWeight: 600 }}>{optText}</strong>
                    </p>
                    <span style={{ fontSize: 11, color: "var(--pf-text-muted)", flexShrink: 0 }}>
                      {fmtRelative(vote.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
