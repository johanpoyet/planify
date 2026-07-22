"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/themeContext";

interface Creator { id: string; name: string | null; email: string; }
interface SharedEvent {
  id: string; title: string; description: string | null;
  date: string; location: string | null; visibility: string;
  createdById: string; creator: Creator;
}

const COLORS = ['#7C5CFF', '#FF7A45', '#4FD18B', '#FF6BD6', '#4F8BFF', '#FFB454', '#5CE0E0', '#FF5C5C'];

function getColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + (seed.codePointAt(i) ?? 0)) >>> 0;
  return COLORS[h % COLORS.length];
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2
    ? (parts[0][0] + (parts.at(-1) ?? parts[0])[0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function fmtTime(ds: string) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(ds));
}

function getWeekStart(offset = 0): Date {
  const now = new Date();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function groupByCreator(evts: SharedEvent[]) {
  const map = new Map<string, { creator: Creator; events: SharedEvent[] }>();
  for (const e of evts) {
    if (!map.has(e.createdById)) map.set(e.createdById, { creator: e.creator, events: [] });
    const group = map.get(e.createdById);
    if (group) group.events.push(e);
  }
  return Array.from(map.values());
}

function SmallAvatar({ name, size }: Readonly<{ name: string; size: number }>) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: getColor(name),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>
      {getInitials(name)}
    </div>
  );
}

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function toggleSet(prev: Set<string>, id: string): Set<string> {
  const next = new Set(prev);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export default function SharedEventsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { primaryColor } = useTheme();
  const [events, setEvents] = useState<SharedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFilter, setMobileFilter] = useState<string | null>(null);
  const [desktopFilter, setDesktopFilter] = useState<Set<string>>(new Set());
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") fetchEvents();
  }, [status]);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events/shared");
      if (res.ok) setEvents(await res.json());
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--pf-bg)' }}>
        <p className="text-sm" style={{ color: 'var(--pf-text-dim)' }}>Chargement…</p>
      </div>
    );
  }

  const allGroups = groupByCreator(events);
  const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Mobile
  const mobileEvents = mobileFilter ? sorted.filter(e => e.createdById === mobileFilter) : sorted;
  const mobileGroups = groupByCreator(mobileEvents);

  // Desktop – week grid
  const weekStart = getWeekStart(weekOffset);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const weekLabel = `${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
  const desktopEvents = desktopFilter.size === 0 ? events : events.filter(e => desktopFilter.has(e.createdById));
  const eventsByDay = weekDays.map(day => {
    const ds = new Date(day); ds.setHours(0, 0, 0, 0);
    const de = new Date(day); de.setHours(23, 59, 59, 999);
    return {
      date: day,
      events: desktopEvents
        .filter(e => { const d = new Date(e.date); return d >= ds && d <= de; })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    };
  });

  const today = new Date().toDateString();

  return (
    <div style={{ background: 'var(--pf-bg)', color: 'var(--pf-text)' }}>

      {/* ── MOBILE ─────────────────────────────────────────────────── */}
      <div className="md:hidden min-h-screen">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-3">
          <div>
            <div className="font-mono text-xs uppercase mb-0.5" style={{ color: 'var(--pf-text-muted)', letterSpacing: '0.08em' }}>
              Cette semaine
            </div>
            <h1 className="font-semibold" style={{ fontSize: 26, letterSpacing: '-0.025em' }}>Tes amis</h1>
          </div>
          <button
            className="flex items-center justify-center rounded-xl"
            style={{ width: 36, height: 36, background: 'var(--pf-surface)', border: '1px solid var(--pf-border)', color: 'var(--pf-text-dim)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="5" x2="21" y2="5"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="19" x2="15" y2="19"/>
            </svg>
          </button>
        </div>

        {/* Avatar strip */}
        <div className="px-5 pb-4">
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            <button onClick={() => setMobileFilter(null)} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: mobileFilter === null ? primaryColor : 'var(--pf-surface-2)',
                color: mobileFilter === null ? '#fff' : 'var(--pf-text-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 11,
                boxShadow: mobileFilter === null ? `0 0 0 2px var(--pf-bg), 0 0 0 4px ${primaryColor}` : 'none',
              }}>
                TOUS
              </div>
              <span className="text-[10px] font-medium" style={{ color: 'var(--pf-text-dim)' }}>Tous</span>
            </button>
            {allGroups.map(({ creator }) => {
              const name = creator.name || creator.email;
              const isSelected = mobileFilter === creator.id;
              const color = getColor(name);
              return (
                <button
                  key={creator.id}
                  onClick={() => setMobileFilter(isSelected ? null : creator.id)}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0"
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', background: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: '#fff',
                    boxShadow: isSelected ? `0 0 0 2px var(--pf-bg), 0 0 0 4px ${color}` : 'none',
                  }}>
                    {getInitials(name)}
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: isSelected ? 'var(--pf-text)' : 'var(--pf-text-dim)' }}>
                    {name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="pb-28">
          {events.length === 0 ? (
            <div className="mx-5 rounded-2xl p-12 text-center" style={{ background: 'var(--pf-surface)', border: '1px solid var(--pf-border)' }}>
              <div className="inline-flex items-center justify-center rounded-2xl mb-4" style={{ width: 56, height: 56, background: 'var(--pf-surface-2)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--pf-text-muted)' }}>
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <path d="m8.5 10.5 7-4M8.5 13.5l7 4"/>
                </svg>
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--pf-text-dim)' }}>Aucun événement partagé</p>
              <p className="text-xs mb-5" style={{ color: 'var(--pf-text-muted)' }}>Tes amis n&apos;ont pas encore partagé d&apos;événements.</p>
              <button
                onClick={() => router.push('/friends')}
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--pf-surface-2)', border: '1px solid var(--pf-border)', color: 'var(--pf-text)' }}
              >
                Gérer mes amis
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5 px-5">
              {mobileGroups.map(({ creator, events: grpEvents }) => {
                const name = creator.name || creator.email;
                const color = getColor(name);
                const grpSorted = [...grpEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                return (
                  <div key={creator.id}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <SmallAvatar name={name} size={24} />
                      <span className="text-sm font-semibold" style={{ color: 'var(--pf-text)' }}>{name}</span>
                      <span className="text-xs" style={{ color: 'var(--pf-text-muted)' }}>
                        · {grpSorted.length} événement{grpSorted.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {grpSorted.map(event => (
                        <div
                          key={event.id}
                          className="flex items-stretch gap-3 rounded-xl p-3"
                          style={{ background: 'var(--pf-surface)', border: '1px solid var(--pf-border)' }}
                        >
                          <div className="w-11 flex-shrink-0 font-mono text-xs pt-0.5" style={{ color: 'var(--pf-text-muted)' }}>
                            {fmtTime(event.date)}
                          </div>
                          <div className="w-0.5 rounded-full flex-shrink-0" style={{ background: color }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold" style={{ color: 'var(--pf-text)', letterSpacing: '-0.01em' }}>
                              {event.title}
                            </p>
                            {(event.location ?? event.description) && (
                              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--pf-text-muted)' }}>
                                {event.location ?? event.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
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
            <h1 className="font-semibold" style={{ fontSize: 20, letterSpacing: '-0.02em' }}>Agenda partagé</h1>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: 'var(--pf-surface-2)', color: 'var(--pf-text-dim)', border: '1px solid var(--pf-border)' }}
            >
              {allGroups.length} ami{allGroups.length === 1 ? '' : 's'} · {weekLabel}
            </span>
          </div>
          {/* Week navigation */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              className="flex items-center justify-center rounded-lg"
              style={{ width: 32, height: 32, background: 'var(--pf-surface)', border: '1px solid var(--pf-border)', color: 'var(--pf-text-dim)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 5-7 7 7 7"/>
              </svg>
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: weekOffset === 0 ? 'var(--pf-surface-2)' : 'var(--pf-surface)',
                border: '1px solid var(--pf-border)',
                color: weekOffset === 0 ? 'var(--pf-text)' : 'var(--pf-text-dim)',
              }}
            >
              Aujourd&apos;hui
            </button>
            <button
              onClick={() => setWeekOffset(w => w + 1)}
              className="flex items-center justify-center rounded-lg"
              style={{ width: 32, height: 32, background: 'var(--pf-surface)', border: '1px solid var(--pf-border)', color: 'var(--pf-text-dim)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 5 7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)', overflow: 'hidden' }}>

          {/* Left: friend filter sidebar */}
          <div
            className="flex-shrink-0 overflow-y-auto"
            style={{ width: 220, borderRight: '1px solid var(--pf-border)', padding: '20px 16px' }}
          >
            <p
              className="text-xs font-semibold uppercase mb-2.5"
              style={{ color: 'var(--pf-text-muted)', letterSpacing: '0.08em' }}
            >
              Filtrer · amis
            </p>
            {allGroups.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--pf-text-muted)' }}>Aucun ami avec des événements</p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {allGroups.map(({ creator }) => {
                  const name = creator.name || creator.email;
                  const color = getColor(name);
                  const isSelected = desktopFilter.has(creator.id);
                  const isActive = desktopFilter.size === 0 || isSelected;
                  return (
                    <button
                      key={creator.id}
                      onClick={() => setDesktopFilter(prev => toggleSet(prev, creator.id))}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left w-full transition-colors"
                      style={{
                        background: isSelected ? 'var(--pf-surface-2)' : 'transparent',
                        color: isActive ? 'var(--pf-text)' : 'var(--pf-text-dim)',
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', background: color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 7, fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>
                        {getInitials(name)}
                      </div>
                      <span className="text-sm font-medium flex-1 truncate" style={{ letterSpacing: '-0.005em' }}>
                        {name.split(' ')[0]}
                      </span>
                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: week grid */}
          <div className="flex-1 overflow-y-auto" style={{ padding: '24px 32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
              {eventsByDay.map(({ date, events: dayEvents }) => {
                const isToday = date.toDateString() === today;
                return (
                  <div
                    key={date.toISOString()}
                    style={{
                      background: 'var(--pf-surface)',
                      border: isToday ? `1px solid ${primaryColor}` : '1px solid var(--pf-border)',
                      borderRadius: 14,
                      padding: 12,
                      minHeight: 360,
                    }}
                  >
                    {/* Day header */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="font-mono text-xs uppercase font-semibold"
                        style={{ color: isToday ? primaryColor : 'var(--pf-text-muted)', letterSpacing: '0.08em' }}
                      >
                        {DAY_LABELS[(date.getDay() + 6) % 7]}
                      </span>
                      <span
                        className="font-mono font-semibold"
                        style={{ fontSize: 16, color: isToday ? primaryColor : 'var(--pf-text)' }}
                      >
                        {date.getDate()}
                      </span>
                    </div>
                    {/* Events */}
                    <div className="flex flex-col gap-2">
                      {dayEvents.map(event => {
                        const creatorName = event.creator.name || event.creator.email;
                        const color = getColor(creatorName);
                        return (
                          <div
                            key={event.id}
                            style={{
                              padding: 10, borderRadius: 9,
                              background: 'var(--pf-surface-2)',
                              borderLeft: `3px solid ${color}`,
                            }}
                          >
                            <div className="font-mono text-xs" style={{ color: 'var(--pf-text-muted)' }}>
                              {fmtTime(event.date)}
                            </div>
                            <div
                              className="text-xs font-semibold mt-0.5"
                              style={{ color: 'var(--pf-text)', lineHeight: 1.3, letterSpacing: '-0.005em' }}
                            >
                              {event.title}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <SmallAvatar name={creatorName} size={18} />
                            </div>
                          </div>
                        );
                      })}
                      {dayEvents.length === 0 && (
                        <div
                          className="text-xs font-mono font-italic"
                          style={{ color: 'var(--pf-text-muted)', padding: '20px 0', textAlign: 'center', fontStyle: 'italic' }}
                        >
                          Rien de prévu
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
