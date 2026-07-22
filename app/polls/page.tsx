"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/lib/themeContext";

interface VoterInfo { id: string; name: string | null; email: string; }
interface PollOptionData { id: string; text: string; voteCount: number; voters: VoterInfo[]; }
interface VoteActivity { id: string; optionId: string; userId: string; createdAt: string; user: VoterInfo | null; }
interface PollCreator { id: string; name: string | null; email: string; }
interface Poll {
  id: string; question: string; status: string;
  deadline: string | null; createdAt: string;
  creator: PollCreator; options: PollOptionData[];
  votes: VoteActivity[];
  totalVotes: number; recipientCount: number;
  myVoteOptionId: string | null; isCreator: boolean;
}

const COLORS = ['#7C5CFF','#FF7A45','#4FD18B','#FF6BD6','#4F8BFF','#FFB454','#5CE0E0','#FF5C5C'];

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

function fmtDeadline(ds: string | null): string {
  if (ds === null) return '';
  const diff = new Date(ds).getTime() - Date.now();
  if (diff < 0) return 'Terminé';
  const h = Math.floor(diff / 3600000);
  if (h < 24) return h === 0 ? 'Bientôt' : `Dans ${h}h`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'Demain' : `Dans ${d}j`;
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

function vName(u: VoterInfo | null): string {
  return u?.name ?? u?.email ?? "Anonyme";
}

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

function VoterStack({ voters, max = 5 }: Readonly<{ voters: VoterInfo[]; max?: number }>) {
  const shown = voters.slice(0, max);
  const extra = voters.length - max;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {shown.map((u, i) => (
        <div key={u.id} style={{ marginLeft: i === 0 ? 0 : -6, zIndex: shown.length - i }}>
          <MiniAvatar name={vName(u)} size={20} />
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

function isPollClosed(poll: Poll): boolean {
  if (poll.status === 'cancelled' || poll.status === 'resolved') return true;
  return poll.deadline !== null && new Date(poll.deadline) < new Date();
}

function creatorName(c: PollCreator): string {
  return c.name ?? c.email;
}

function getVoteLabel(poll: Poll, pendingId: string | null, isVoting: boolean): string {
  if (isVoting) return '…';
  if (pendingId === null) return 'Sélectionne une option';
  const opt = poll.options.find(o => o.id === pendingId);
  return opt ? `Voter pour "${opt.text}"` : 'Voter';
}

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

async function loadPolls(setPolls: SetState<Poll[]>, setLoading: SetState<boolean>): Promise<void> {
  try {
    const res = await fetch('/api/polls');
    if (res.ok) setPolls(await res.json());
  } finally {
    setLoading(false);
  }
}

async function castVote(
  pollId: string,
  optionId: string,
  onDone: () => void,
  setVoting: SetState<boolean>,
): Promise<void> {
  setVoting(true);
  try {
    await fetch('/api/polls/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pollId, optionId }),
    });
  } finally {
    setVoting(false);
    onDone();
  }
}

function SmallAvatar({ name, size }: Readonly<{ name: string; size: number }>) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: getColor(name),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.36), fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>
      {getInitials(name)}
    </div>
  );
}

function PollBar({ option, total, accent, showVoters = false }: Readonly<{
  option: PollOptionData; total: number; accent: string; showVoters?: boolean;
}>) {
  const pct = total > 0 ? Math.round((option.voteCount / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--pf-text)' }}>{option.text}</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--pf-text-muted)' }}>{pct}%</span>
          <span style={{ fontSize: 11, color: 'var(--pf-text-muted)' }}>· {option.voteCount}</span>
        </div>
      </div>
      <div style={{ height: 8, borderRadius: 6, background: 'var(--pf-surface-2)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 6, width: `${pct}%`,
          background: pct >= 50 ? accent : 'var(--pf-accent-soft)',
          transition: 'width 0.3s ease',
        }} />
      </div>
      {showVoters && option.voters.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <VoterStack voters={option.voters} />
        </div>
      )}
    </div>
  );
}

/* ── Filter chips (reused on mobile + desktop) ───────────────────────────── */
function FilterChips({ filter, activeCount, closedCount, primaryColor, onChange }: Readonly<{
  filter: 'active' | 'closed'; activeCount: number; closedCount: number;
  primaryColor: string; onChange: (f: 'active' | 'closed') => void;
}>) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {(['active', 'closed'] as const).map(f => {
        const isOn = filter === f;
        const label = f === 'active' ? `Actifs · ${activeCount}` : `Terminés · ${closedCount}`;
        return (
          <button
            key={f}
            onClick={() => onChange(f)}
            style={{
              padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 500,
              background: isOn ? primaryColor : 'var(--pf-surface-2)',
              color: isOn ? '#fff' : 'var(--pf-text-dim)',
              border: `1px solid ${isOn ? primaryColor : 'var(--pf-border)'}`,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Icons ───────────────────────────────────────────────────────────────── */
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
);
const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m9 5 7 7-7 7"/></svg>
);
const ClockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
);

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function PollsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { primaryColor } = useTheme();

  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'closed'>('active');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingVoteId, setPendingVoteId] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') void loadPolls(setPolls, setLoading);
  }, [status]);

  useEffect(() => { setPendingVoteId(null); }, [selectedId]);

  const refresh = () => void loadPolls(setPolls, setLoading);

  const activePolls = polls.filter(p => isPollClosed(p) === false);
  const closedPolls = polls.filter(isPollClosed);
  const filteredPolls = filter === 'active' ? activePolls : closedPolls;
  const selectedPoll = polls.find(p => p.id === selectedId) ?? filteredPolls[0] ?? null;

  const handleFilterChange = (f: 'active' | 'closed') => {
    setFilter(f);
    setSelectedId(null);
  };

  const handleVote = () => {
    if (selectedPoll === null || pendingVoteId === null) return;
    void castVote(selectedPoll.id, pendingVoteId, refresh, setVoting);
    setPendingVoteId(null);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--pf-bg)' }}>
        <p className="text-sm" style={{ color: 'var(--pf-text-dim)' }}>Chargement…</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--pf-bg)', color: 'var(--pf-text)' }}>

      {/* ── MOBILE ─────────────────────────────────────────────────────────── */}
      <div className="md:hidden min-h-screen">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-3">
          <div>
            <p className="font-mono text-xs uppercase mb-0.5" style={{ color: 'var(--pf-text-muted)', letterSpacing: '0.08em' }}>
              {activePolls.length} actif{activePolls.length === 1 ? '' : 's'}
            </p>
            <h1 className="font-semibold" style={{ fontSize: 26, letterSpacing: '-0.025em' }}>Sondages</h1>
          </div>
          <Link
            href="/polls/new"
            aria-label="Nouveau sondage"
            className="flex items-center justify-center rounded-xl"
            style={{ width: 36, height: 36, background: 'var(--pf-surface)', border: '1px solid var(--pf-border)', color: 'var(--pf-text-dim)' }}
          >
            <PlusIcon />
          </Link>
        </div>

        {/* Filter */}
        <div className="px-5 pb-4">
          <FilterChips filter={filter} activeCount={activePolls.length} closedCount={closedPolls.length} primaryColor={primaryColor} onChange={handleFilterChange} />
        </div>

        {/* List */}
        <div className="pb-28 flex flex-col gap-3 px-5">
          {filteredPolls.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--pf-surface)', border: '1px solid var(--pf-border)' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--pf-text-dim)' }}>
                {filter === 'active' ? 'Aucun sondage actif' : 'Aucun sondage terminé'}
              </p>
              {filter === 'active' && (
                <Link href="/polls/new" className="mt-3 inline-block px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: primaryColor, color: 'var(--pf-on-accent)' }}>
                  Créer un sondage
                </Link>
              )}
            </div>
          ) : (
            filteredPolls.map(poll => (
              <MobilePollCard key={poll.id} poll={poll} primaryColor={primaryColor} />
            ))
          )}
        </div>
      </div>

      {/* ── DESKTOP ────────────────────────────────────────────────────────── */}
      <div className="hidden md:block">

        {/* Topbar */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-8"
          style={{ height: 56, borderBottom: '1px solid var(--pf-border)', background: 'var(--pf-bg)' }}
        >
          <div className="flex items-center gap-3">
            <h1 className="font-semibold" style={{ fontSize: 20, letterSpacing: '-0.02em' }}>Sondages</h1>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'var(--pf-surface-2)', color: 'var(--pf-text-dim)', border: '1px solid var(--pf-border)' }}>
              {activePolls.length} actif{activePolls.length === 1 ? '' : 's'}
            </span>
          </div>
          <Link href="/polls/new" className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: primaryColor, color: 'var(--pf-on-accent)' }}>
            <PlusIcon /> Nouveau sondage
          </Link>
        </div>

        {/* Two-panel */}
        <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>

          {/* Left: list */}
          <div style={{ width: 380, borderRight: '1px solid var(--pf-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '16px 16px 8px', flexShrink: 0 }}>
              <FilterChips filter={filter} activeCount={activePolls.length} closedCount={closedPolls.length} primaryColor={primaryColor} onChange={handleFilterChange} />
            </div>

            <div className="overflow-y-auto" style={{ flex: 1, padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredPolls.map(poll => {
                const cName = creatorName(poll.creator);
                const isSelected = selectedPoll?.id === poll.id;
                const deadline = fmtDeadline(poll.deadline);
                const pollClosed = isPollClosed(poll);
                let dotColor: string;
                if (poll.myVoteOptionId !== null) dotColor = '#4FD18B';
                else if (pollClosed) dotColor = 'var(--pf-text-muted)';
                else dotColor = '#FFB454';
                let statusLabel: string;
                if (deadline !== '') statusLabel = deadline;
                else if (pollClosed) statusLabel = 'Terminé';
                else statusLabel = 'En cours';
                return (
                  <button
                    key={poll.id}
                    onClick={() => setSelectedId(poll.id)}
                    style={{
                      textAlign: 'left', padding: 14, borderRadius: 12, width: '100%',
                      background: isSelected ? 'var(--pf-surface)' : 'transparent',
                      border: `1px solid ${isSelected ? primaryColor : 'var(--pf-border)'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 600, color: 'var(--pf-text-muted)' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, display: 'inline-block', flexShrink: 0 }} />
                        {statusLabel}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--pf-text-muted)' }}>
                        {poll.totalVotes}/{poll.recipientCount}
                      </span>
                    </div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 6, color: 'var(--pf-text)' }}>{poll.question}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <SmallAvatar name={cName} size={18} />
                      <span style={{ fontSize: 12, color: 'var(--pf-text-muted)' }}>par {cName}</span>
                    </div>
                  </button>
                );
              })}

              <Link
                href="/polls/new"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, padding: '12px 0', border: '1px dashed var(--pf-border)', color: 'var(--pf-text-muted)', fontSize: 13, marginTop: 4 }}
              >
                <PlusIcon /> Créer un sondage
              </Link>
            </div>
          </div>

          {/* Right: detail */}
          <div className="overflow-y-auto" style={{ flex: 1, background: 'var(--pf-bg-2)', padding: '36px 56px' }}>
            {selectedPoll === null ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <p style={{ fontSize: 14, color: 'var(--pf-text-dim)' }}>Sélectionne un sondage</p>
              </div>
            ) : (
              <DesktopDetail
                poll={selectedPoll}
                pendingVoteId={pendingVoteId}
                voting={voting}
                primaryColor={primaryColor}
                onOptionClick={id => { if (isPollClosed(selectedPoll) === false) setPendingVoteId(id); }}
                onVote={handleVote}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mobile poll card ────────────────────────────────────────────────────── */
function MobilePollCard({ poll, primaryColor }: Readonly<{ poll: Poll; primaryColor: string }>) {
  const cName = creatorName(poll.creator);
  const deadline = fmtDeadline(poll.deadline);
  const hasVoted = poll.myVoteOptionId !== null;
  const closed = isPollClosed(poll);

  if (hasVoted || closed) {
    const statusChip = hasVoted
      ? <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: 'var(--pf-accent-soft)', color: primaryColor, marginBottom: 6 }}>Tu as voté</span>
      : <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: 'var(--pf-surface-2)', color: 'var(--pf-text-muted)', marginBottom: 6 }}>{poll.status === 'resolved' ? 'Résolu' : 'Terminé'}</span>;
    return (
      <Link href={`/polls/${poll.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 16, padding: 16, background: 'var(--pf-surface)', border: '1px solid var(--pf-border)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {statusChip}
          <p style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.015em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{poll.question}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <SmallAvatar name={cName} size={18} />
            <span style={{ fontSize: 11, color: 'var(--pf-text-muted)' }}>{poll.totalVotes}/{poll.recipientCount} votes</span>
          </div>
        </div>
        <ChevronRight />
      </Link>
    );
  }

  return (
    <div style={{ borderRadius: 16, padding: 16, background: 'var(--pf-surface)', border: '1px solid var(--pf-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        {deadline !== '' ? (
          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: 'rgba(255,180,84,0.15)', color: '#FFB454' }}>
            {deadline}
          </span>
        ) : <span />}
        <span style={{ fontSize: 11, color: 'var(--pf-text-muted)' }}>{poll.totalVotes}/{poll.recipientCount} ont voté</span>
      </div>
      <p style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.015em', margin: '6px 0 4px' }}>{poll.question}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <SmallAvatar name={cName} size={18} />
        <span style={{ fontSize: 11, color: 'var(--pf-text-muted)' }}>par {cName}</span>
      </div>
      {poll.options.map(opt => (
        <PollBar key={opt.id} option={opt} total={poll.totalVotes} accent={primaryColor} showVoters />
      ))}
      <Link
        href={`/polls/${poll.id}`}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10, padding: '10px 0', borderRadius: 12, background: primaryColor, color: 'var(--pf-on-accent)', fontSize: 14, fontWeight: 600 }}
      >
        Voter
      </Link>
    </div>
  );
}

/* ── Desktop detail panel ────────────────────────────────────────────────── */
function DesktopDetail({ poll, pendingVoteId, voting, primaryColor, onOptionClick, onVote }: Readonly<{
  poll: Poll; pendingVoteId: string | null; voting: boolean; primaryColor: string;
  onOptionClick: (id: string) => void; onVote: () => void;
}>) {
  const cName = creatorName(poll.creator);
  const closed = isPollClosed(poll);
  const voteLabel = getVoteLabel(poll, pendingVoteId, voting);
  const voteActive = pendingVoteId !== null && pendingVoteId !== poll.myVoteOptionId && closed === false;

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {poll.deadline !== null && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: 'rgba(255,180,84,0.15)', color: '#FFB454' }}>
            <ClockIcon /> {fmtDeadline(poll.deadline)}
          </span>
        )}
        <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 12, background: 'var(--pf-surface-2)', color: 'var(--pf-text-muted)', border: '1px solid var(--pf-border)' }}>
          {poll.totalVotes}/{poll.recipientCount} votes
        </span>
        {poll.status === 'resolved' && (
          <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: 'rgba(79,209,139,0.15)', color: '#4FD18B' }}>
            Résolu
          </span>
        )}
      </div>

      {/* Title */}
      <h2 style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 16 }}>{poll.question}</h2>

      {/* Creator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
        <SmallAvatar name={cName} size={28} />
        <span style={{ fontSize: 13, color: 'var(--pf-text-dim)' }}>Créé par {cName} · {fmtRelative(poll.createdAt)}</span>
      </div>

      {/* Options label */}
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--pf-text-muted)', marginBottom: 14 }}>
        Options{closed === false ? ' · clique pour sélectionner' : ''}
      </p>

      {/* Option cards */}
      <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--pf-surface)', border: '1px solid var(--pf-border)' }}>
        {poll.options.map((opt, i) => {
          const isTarget = (pendingVoteId ?? poll.myVoteOptionId) === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onOptionClick(opt.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '14px 20px',
                borderBottom: i < poll.options.length - 1 ? '1px solid var(--pf-border)' : 'none',
                background: isTarget ? 'var(--pf-accent-soft)' : 'transparent',
                cursor: closed ? 'default' : 'pointer',
              }}
            >
              <PollBar option={opt} total={poll.totalVotes} accent={primaryColor} showVoters />
            </button>
          );
        })}
      </div>

      {/* Action buttons */}
      {closed === false && (
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button
            onClick={onVote}
            disabled={voteActive === false}
            style={{
              padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600,
              background: voteActive ? primaryColor : 'var(--pf-surface-2)',
              color: voteActive ? '#fff' : 'var(--pf-text-muted)',
              border: 'none', cursor: voteActive ? 'pointer' : 'default',
            }}
          >
            {voteLabel}
          </button>
          <Link
            href={`/polls/${poll.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 12, fontSize: 14, background: 'var(--pf-surface)', border: '1px solid var(--pf-border)', color: 'var(--pf-text-dim)' }}
          >
            <PlusIcon /> Suggérer une option
          </Link>
        </div>
      )}

      {/* Activity */}
      {poll.votes.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <hr style={{ border: 'none', borderTop: '1px solid var(--pf-border)', marginBottom: 20 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--pf-text)' }}>Activité</p>
            <span style={{ fontSize: 11, color: 'var(--pf-text-muted)' }}>Dernier vote {fmtRelative(poll.votes[0].createdAt)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {poll.votes.map(vote => {
              const name = vName(vote.user);
              const optText = poll.options.find(o => o.id === vote.optionId)?.text ?? '?';
              return (
                <div key={vote.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <MiniAvatar name={name} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13, color: 'var(--pf-text)' }}>
                      <strong>{name}</strong> a voté pour <strong>{optText}</strong>
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--pf-text-muted)', flexShrink: 0 }}>{fmtRelative(vote.createdAt)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
