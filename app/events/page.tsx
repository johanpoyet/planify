"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/themeContext";

/* ------------------------------------------------------------------ types */
interface EventType { id: string; name: string; color: string; }
interface CalEvent {
  id: string; title: string; description: string | null;
  date: string; location: string | null; visibility: string;
  createdById: string; eventType?: EventType | null;
}

/* ---------------------------------------------------------------- constants */
const WD_MON = [
  { key: "lun", label: "L" }, { key: "mar", label: "M" }, { key: "mer", label: "M" },
  { key: "jeu", label: "J" }, { key: "ven", label: "V" }, { key: "sam", label: "S" }, { key: "dim", label: "D" },
];
const WD_FULL = ["LUN","MAR","MER","JEU","VEN","SAM","DIM"];
const BLANK_KEYS = ["a","b","c","d","e","f"] as const;
const WD_SHORT = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"] as const;

/* ----------------------------------------------------------------- helpers */
function eventsForDate(evts: CalEvent[], d: Date) {
  return evts.filter(e => {
    const ed = new Date(e.date);
    return ed.getDate()===d.getDate() && ed.getMonth()===d.getMonth() && ed.getFullYear()===d.getFullYear();
  });
}
function fmtTime(s: string) {
  return new Intl.DateTimeFormat("fr-FR", { hour:"2-digit", minute:"2-digit" }).format(new Date(s));
}
function isSameDay(a: Date, b: Date | null) {
  if (!b) return false;
  return a.getDate()===b.getDate() && a.getMonth()===b.getMonth() && a.getFullYear()===b.getFullYear();
}
function getDayFg(isToday: boolean, isSelected: boolean, primaryColor: string): string {
  if (isSelected) return "#fff";
  if (isToday) return primaryColor;
  return "var(--pf-text)";
}

/* --------------------------------------------------------------- MobileDay */
interface MobileDayProps {
  day: number; isToday: boolean; isSelected: boolean;
  hasEvent: boolean; primaryColor: string; onClick: () => void;
}
function MobileDay({ day, isToday, isSelected, hasEvent, primaryColor, onClick }: Readonly<MobileDayProps>) {
  return (
    <button type="button" onClick={onClick}
      style={{
        aspectRatio:"1", display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", borderRadius:9, fontSize:13, border:"none", cursor:"pointer",
        fontVariantNumeric:"tabular-nums", position:"relative",
        background: isSelected ? primaryColor : "transparent",
        color: getDayFg(isToday, isSelected, primaryColor),
        fontWeight: isToday || isSelected ? 600 : 400,
      }}
    >
      {day}
      {hasEvent && (
        <span style={{
          position:"absolute", bottom:5, width:4, height:4, borderRadius:"50%",
          background: isSelected ? "rgba(255,255,255,0.7)" : primaryColor,
        }}/>
      )}
    </button>
  );
}

/* -------------------------------------------------------------- DesktopDay */
interface DesktopDayProps {
  day: number; isToday: boolean; isSelected: boolean;
  dayEvts: CalEvent[]; primaryColor: string; onClick: () => void;
}
const BAR_WIDTHS = ["70%","55%","85%"] as const;

function DesktopDay({ day, isToday, isSelected, dayEvts, primaryColor, onClick }: Readonly<DesktopDayProps>) {
  const bars = dayEvts.slice(0, 3).map((e, i) => ({
    id: e.id,
    color: e.eventType?.color ?? primaryColor,
    width: BAR_WIDTHS[i] ?? "50%",
  }));
  return (
    <button type="button" onClick={onClick}
      style={{
        aspectRatio:"1.2", border:`1px solid ${isSelected ? primaryColor : "var(--pf-border)"}`,
        borderRadius:10, padding:"8px 10px",
        background: isSelected ? `${primaryColor}12` : "transparent",
        display:"flex", flexDirection:"column", justifyContent:"space-between",
        cursor:"pointer", textAlign:"left",
      }}
    >
      <div style={{
        fontSize:13, fontWeight: isToday||isSelected ? 600 : 500,
        color: isToday||isSelected ? primaryColor : "var(--pf-text)",
        fontVariantNumeric:"tabular-nums",
      }}>
        {String(day).padStart(2,"0")}
      </div>
      {bars.length > 0 && (
        <div style={{display:"flex", flexDirection:"column", gap:2, alignItems:"flex-start"}}>
          {bars.map(bar => (
            <div key={bar.id} style={{height:4, width:bar.width, borderRadius:2, background:bar.color}}/>
          ))}
        </div>
      )}
    </button>
  );
}

/* ---------------------------------------------------------------- EventRow */
interface EventRowProps { event: CalEvent; primaryColor: string; onClick: () => void; }
function EventRow({ event, primaryColor, onClick }: Readonly<EventRowProps>) {
  const color = event.eventType?.color ?? primaryColor;
  return (
    <button type="button" onClick={onClick}
      style={{
        display:"flex", gap:14, padding:14, borderRadius:12, width:"100%", textAlign:"left", cursor:"pointer",
        background:"var(--pf-surface)", border:"1px solid var(--pf-border)", alignItems:"flex-start",
      }}
    >
      <div style={{fontSize:12, color:"var(--pf-text-dim)", fontWeight:500, minWidth:44, paddingTop:1, fontVariantNumeric:"tabular-nums"}}>
        {fmtTime(event.date)}
      </div>
      <div style={{width:3, alignSelf:"stretch", borderRadius:3, background:color, flexShrink:0}}/>
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:14, fontWeight:600, letterSpacing:"-0.01em", color:"var(--pf-text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
          {event.title}
        </div>
        {event.location && (
          <div style={{fontSize:12, color:"var(--pf-text-dim)", marginTop:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>
            {event.location}
          </div>
        )}
      </div>
    </button>
  );
}

/* -------------------------------------------------------------- DayEventCard (desktop right panel) */
interface DayEventCardProps { event: CalEvent; primaryColor: string; onClick: () => void; }
function DayEventCard({ event, primaryColor, onClick }: Readonly<DayEventCardProps>) {
  const color = event.eventType?.color ?? primaryColor;
  return (
    <button type="button" onClick={onClick}
      style={{background:"var(--pf-surface)", border:"1px solid var(--pf-border)", borderRadius:12, padding:14, cursor:"pointer", width:"100%", textAlign:"left"}}
    >
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
        <div style={{display:"flex", gap:10, alignItems:"flex-start"}}>
          <div style={{width:3, height:40, borderRadius:3, background:color, flexShrink:0}}/>
          <div>
            <div style={{fontSize:11, color:"var(--pf-text-muted)", fontFamily:"monospace", fontVariantNumeric:"tabular-nums"}}>
              {fmtTime(event.date)}
            </div>
            <div style={{fontSize:15, fontWeight:600, letterSpacing:"-0.015em", marginTop:2, color:"var(--pf-text)"}}>
              {event.title}
            </div>
            {event.location && (
              <div style={{fontSize:13, color:"var(--pf-text-dim)", marginTop:2}}>{event.location}</div>
            )}
          </div>
        </div>
        {event.eventType && (
          <span style={{fontSize:10, fontWeight:600, padding:"3px 8px", borderRadius:999, background:`${color}18`, color, flexShrink:0}}>
            {event.eventType.name}
          </span>
        )}
      </div>
    </button>
  );
}

/* --------------------------------------------------------------- WeekRow */
interface WeekRowProps { event: CalEvent; primaryColor: string; onView: () => void; }
function WeekRow({ event, primaryColor, onView }: Readonly<WeekRowProps>) {
  const color = event.eventType?.color ?? primaryColor;
  const d = new Date(event.date);
  return (
    <div style={{display:"flex", gap:12, padding:"10px 12px", borderRadius:10, alignItems:"center",
      background:"var(--pf-surface)", border:"1px solid var(--pf-border)"}}>
      <div style={{fontSize:11, fontFamily:"monospace", minWidth:34, textAlign:"center", lineHeight:"1.5", flexShrink:0}}>
        <div style={{fontWeight:600, color:"var(--pf-text-dim)"}}>{WD_SHORT[d.getDay()]}</div>
        <div style={{color:"var(--pf-text-muted)"}}>{fmtTime(event.date)}</div>
      </div>
      <div style={{width:3, alignSelf:"stretch", borderRadius:3, background:color, flexShrink:0}}/>
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:13, fontWeight:600, color:"var(--pf-text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{event.title}</div>
      </div>
      <button type="button" onClick={onView}
        style={{fontSize:11, fontWeight:600, padding:"4px 10px", borderRadius:8, flexShrink:0,
          background:"var(--pf-surface-2)", border:"1px solid var(--pf-border)", color:"var(--pf-text-dim)", cursor:"pointer"}}>
        Voir
      </button>
    </div>
  );
}

/* ================================================================ PAGE */
export default function EventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { primaryColor } = useTheme();
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => { if (status==="unauthenticated") router.push("/auth/login"); }, [status, router]);
  useEffect(() => { if (status==="authenticated") fetchEvents(); }, [status]);

  const fetchEvents = async () => {
    try { const r = await fetch("/api/events"); if (r.ok) setEvents(await r.json()); }
    finally { setLoading(false); }
  };

  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const blanks = firstDay===0 ? 6 : firstDay-1;
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const monthName = currentDate.toLocaleDateString("fr-FR", { month:"long", year:"numeric" });

  /* Build day→events map for current month */
  const eventDayMap: Record<number, CalEvent[]> = {};
  for (const e of events) {
    const d = new Date(e.date);
    if (d.getMonth()===month && d.getFullYear()===year) {
      const day = d.getDate();
      if (!eventDayMap[day]) eventDayMap[day] = [];
      eventDayMap[day].push(e);
    }
  }

  const displayDate = selectedDate ?? today;
  const dayEvents = eventsForDate(events, displayDate);

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8);

  const monthEventCount = events.filter(e => {
    const d = new Date(e.date);
    return d.getMonth()===month && d.getFullYear()===year;
  }).length;

  /* Current week (Mon–Sun) */
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  const weekEvents = events
    .filter(e => { const d = new Date(e.date); return d >= weekStart && d <= weekEnd; })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const weekRangeLabel = `${WD_SHORT[weekStart.getDay()]} ${weekStart.getDate()} — ${WD_SHORT[weekEnd.getDay()]} ${weekEnd.getDate()}`;

  const prevMonth = () => setCurrentDate(new Date(year, month-1));
  const nextMonth = () => setCurrentDate(new Date(year, month+1));

  const toggleDate = (day: number) => {
    const d = new Date(year, month, day);
    setSelectedDate(isSameDay(d, selectedDate) ? null : d);
  };

  const onTouchStart = (e: React.TouchEvent) => { setTouchStart(e.targetTouches[0].clientX); setIsTransitioning(false); };
  const onTouchMove  = (e: React.TouchEvent) => { if (touchStart) setSwipeOffset(e.targetTouches[0].clientX - touchStart); };
  const onTouchEnd   = () => {
    if (swipeOffset < -50) nextMonth(); else if (swipeOffset > 50) prevMonth();
    setIsTransitioning(true);
    setTimeout(() => { setSwipeOffset(0); setIsTransitioning(false); setTouchStart(null); }, 300);
  };

  /* Derived header strings */
  const headerMonthLabel = monthName;
  const headerDayLabel = (selectedDate ?? today).toLocaleDateString("fr-FR", { weekday:"long", day:"numeric" });

  /* Avoid nested ternaries */
  const mobileListIsEmpty = (selectedDate ? dayEvents : upcomingEvents).length === 0;
  const mobilePluralS = dayEvents.length === 1 ? "" : "s";
  const mobileEmptyMsg = selectedDate ? "Rien de prévu ce jour." : "Crée ton premier événement.";
  const desktopEmptyMsg = selectedDate ? "Rien de prévu ce jour." : "Sélectionne un jour dans le calendrier.";

  if (status==="loading" || loading) {
    return (
      <div style={{minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--pf-bg)"}}>
        <p style={{fontSize:13, color:"var(--pf-text-dim)"}}>Chargement…</p>
      </div>
    );
  }

  return (
    <div style={{background:"var(--pf-bg)"}}>

      {/* ============================================================== MOBILE */}
      <div className="md:hidden" style={{minHeight:"100vh"}}>

        {/* Header */}
        <div style={{padding:"18px 20px 10px", display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:11, fontFamily:"monospace", textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--pf-text-muted)", marginBottom:4}}>
              {headerMonthLabel}
            </div>
            <div style={{fontSize:26, fontWeight:600, letterSpacing:"-0.025em", color:"var(--pf-text)", textTransform:"capitalize"}}>
              {headerDayLabel}
            </div>
          </div>
          <button type="button" onClick={() => router.push('/events/new')}
            aria-label="Nouvel événement"
            style={{width:38, height:38, borderRadius:12, background:primaryColor, border:"none", display:"flex", alignItems:"center", justifyContent:"center", color: 'var(--pf-on-accent)', cursor:"pointer", marginTop:4}}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>

        {/* Calendar card */}
        <div style={{padding:"0 16px 14px"}}>
          <div style={{background:"var(--pf-surface)", border:"1px solid var(--pf-border)", borderRadius:16, padding:12}}>

            {/* Month nav */}
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
              <button type="button" onClick={prevMonth} aria-label="Mois précédent"
                style={{width:28, height:28, borderRadius:8, background:"var(--pf-surface-2)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--pf-text-dim)", cursor:"pointer"}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5-7 7 7 7"/></svg>
              </button>
              <span style={{fontSize:13, fontWeight:600, color:"var(--pf-text)", textTransform:"capitalize"}}>{monthName}</span>
              <button type="button" onClick={nextMonth} aria-label="Mois suivant"
                style={{width:28, height:28, borderRadius:8, background:"var(--pf-surface-2)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--pf-text-dim)", cursor:"pointer"}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 5 7 7-7 7"/></svg>
              </button>
            </div>

            {/* Swipeable grid */}
            <div
              onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
              style={{transform:`translateX(${swipeOffset}px)`, transition: isTransitioning ? "transform .3s ease-out" : "none"}}
            >
              {/* Day-of-week headers */}
              <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2}}>
                {WD_MON.map(wd => (
                  <div key={wd.key} style={{textAlign:"center", fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--pf-text-muted)", padding:"8px 0 6px"}}>
                    {wd.label}
                  </div>
                ))}
              </div>
              {/* Day cells */}
              <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2}}>
                {BLANK_KEYS.slice(0, blanks).map(k => <div key={`bk-${k}`}/>)}
                {Array.from({length:daysInMonth}, (_,i) => i+1).map(day => {
                  const d = new Date(year, month, day);
                  return (
                    <MobileDay
                      key={day}
                      day={day}
                      isToday={isSameDay(d, today)}
                      isSelected={isSameDay(d, selectedDate)}
                      hasEvent={!!eventDayMap[day]}
                      primaryColor={primaryColor}
                      onClick={() => toggleDate(day)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Section header */}
        <div style={{padding:"4px 20px 10px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div style={{fontSize:13, fontWeight:600, color:"var(--pf-text)"}}>
            {selectedDate ? `${dayEvents.length} événement${mobilePluralS}` : "À venir"}
          </div>
          {selectedDate && (
            <button type="button" onClick={() => setSelectedDate(null)}
              style={{fontSize:12, color:"var(--pf-text-muted)", background:"none", border:"none", cursor:"pointer"}}>
              ✕ Effacer
            </button>
          )}
        </div>

        {/* Events list */}
        <div style={{padding:"0 16px 120px"}}>
          {mobileListIsEmpty ? (
            <div style={{padding:"40px 0", textAlign:"center"}}>
              <p style={{fontSize:13, fontWeight:600, color:"var(--pf-text-dim)"}}>Aucun événement</p>
              <p style={{fontSize:12, color:"var(--pf-text-muted)", marginTop:4}}>
                {mobileEmptyMsg}
              </p>
              <button type="button" onClick={() => router.push('/events/new')}
                style={{marginTop:14, padding:"8px 18px", borderRadius:10, background:primaryColor, color: 'var(--pf-on-accent)', fontSize:13, fontWeight:600, border:"none", cursor:"pointer"}}>
                Créer
              </button>
            </div>
          ) : (
            <div style={{display:"flex", flexDirection:"column", gap:8}}>
              {(selectedDate ? dayEvents : upcomingEvents).map(e => (
                <EventRow key={e.id} event={e} primaryColor={primaryColor} onClick={() => router.push(`/events/${e.id}`)}/>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== DESKTOP */}
      <div className="hidden md:flex" style={{flexDirection:"column", height:"100vh"}}>

        {/* Topbar */}
        <div style={{padding:"0 28px", height:56, display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid var(--pf-border)", flexShrink:0, background:"var(--pf-bg)"}}>
          <div style={{display:"flex", alignItems:"center"}}>
            <span style={{fontSize:20, fontWeight:600, letterSpacing:"-0.02em", color:"var(--pf-text)"}}>Agenda</span>
            <div style={{display:"flex", gap:4, marginLeft:20}}>
              <button type="button" onClick={() => setSelectedDate(null)}
                style={{padding:"5px 12px", borderRadius:8, background:"var(--pf-surface)", border:"1px solid var(--pf-border)", fontSize:13, color:"var(--pf-text-dim)", cursor:"pointer"}}>
                Aujourd&apos;hui
              </button>
              <button type="button" onClick={prevMonth} aria-label="Mois précédent"
                style={{width:30, height:30, borderRadius:8, background:"var(--pf-surface)", border:"1px solid var(--pf-border)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--pf-text-dim)", cursor:"pointer"}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5-7 7 7 7"/></svg>
              </button>
              <button type="button" onClick={nextMonth} aria-label="Mois suivant"
                style={{width:30, height:30, borderRadius:8, background:"var(--pf-surface)", border:"1px solid var(--pf-border)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--pf-text-dim)", cursor:"pointer"}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 5 7 7-7 7"/></svg>
              </button>
              <span style={{fontSize:14, color:"var(--pf-text-dim)", textTransform:"capitalize", lineHeight:"30px", marginLeft:8}}>
                {monthName}
              </span>
            </div>
          </div>
          <button type="button" onClick={() => router.push('/events/new')}
            style={{display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:10, background:primaryColor, color: 'var(--pf-on-accent)', fontSize:13, fontWeight:600, border:"none", cursor:"pointer"}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            Nouvel événement
          </button>
        </div>

        {/* Body: 2-column */}
        <div style={{flex:1, display:"grid", gridTemplateColumns:"1fr 380px", minHeight:0, overflow:"hidden"}}>

          {/* LEFT: big month grid + upcoming */}
          <div style={{padding:"24px 28px", overflowY:"auto", borderRight:"1px solid var(--pf-border)"}}>

            {/* Month label + count */}
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:16}}>
              <div>
                <div style={{fontSize:11, fontFamily:"monospace", textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--pf-text-muted)"}}>Mois en cours</div>
                <div style={{fontSize:22, fontWeight:600, letterSpacing:"-0.02em", marginTop:2, color:"var(--pf-text)", textTransform:"capitalize"}}>{monthName}</div>
              </div>
              {monthEventCount > 0 && (
                <span style={{fontSize:12, padding:"3px 10px", borderRadius:999, background:"var(--pf-surface-2)", border:"1px solid var(--pf-border)", color:"var(--pf-text-dim)"}}>
                  {monthEventCount} événement{monthEventCount===1?"":"s"}
                </span>
              )}
            </div>

            {/* Bordered month grid */}
            <div style={{background:"var(--pf-surface)", border:"1px solid var(--pf-border)", borderRadius:16, padding:16}}>
              <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4}}>
                {WD_FULL.map(d => (
                  <div key={d} style={{fontSize:10, fontFamily:"monospace", textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--pf-text-muted)", padding:"2px 0 10px", textAlign:"left"}}>
                    {d}
                  </div>
                ))}
                {BLANK_KEYS.slice(0, blanks).map(k => <div key={`bk-${k}`} style={{aspectRatio:"1.2"}}/>)}
                {Array.from({length:daysInMonth}, (_,i) => i+1).map(day => {
                  const d = new Date(year, month, day);
                  return (
                    <DesktopDay
                      key={day}
                      day={day}
                      isToday={isSameDay(d, today)}
                      isSelected={isSameDay(d, selectedDate)}
                      dayEvts={eventDayMap[day] ?? []}
                      primaryColor={primaryColor}
                      onClick={() => toggleDate(day)}
                    />
                  );
                })}
              </div>
            </div>

            {/* À venir cette semaine */}
            <div style={{marginTop:28}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
                <div style={{fontSize:13, fontWeight:600, color:"var(--pf-text)"}}>À venir cette semaine</div>
                <span style={{fontSize:11, color:"var(--pf-text-muted)", fontFamily:"monospace"}}>{weekRangeLabel}</span>
              </div>
              {weekEvents.length === 0 ? (
                <p style={{fontSize:12, color:"var(--pf-text-muted)", padding:"12px 0"}}>Aucun événement cette semaine.</p>
              ) : (
                <div style={{display:"flex", flexDirection:"column", gap:6}}>
                  {weekEvents.map(e => (
                    <WeekRow key={e.id} event={e} primaryColor={primaryColor} onView={() => router.push(`/events/${e.id}`)}/>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: selected day */}
          <div style={{padding:"24px", background:"var(--pf-bg-2)", overflowY:"auto"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4}}>
              <div style={{fontSize:11, fontFamily:"monospace", textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--pf-text-muted)"}}>
                {selectedDate ? "Sélection" : "Aujourd'hui"}
              </div>
              <button type="button"
                onClick={() => {
                  const dateParam = selectedDate ? `?date=${selectedDate.toISOString().slice(0,10)}` : "";
                  router.push(`/events/new${dateParam}`);
                }}
                style={{display:"flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:8, background:"var(--pf-surface)", border:"1px solid var(--pf-border)", fontSize:12, color:"var(--pf-text-dim)", cursor:"pointer"}}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                Ajouter
              </button>
            </div>
            <div style={{fontSize:22, fontWeight:600, letterSpacing:"-0.02em", color:"var(--pf-text)", marginBottom:18, textTransform:"capitalize"}}>
              {displayDate.toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" })}
            </div>

            {dayEvents.length === 0 ? (
              <div style={{padding:"40px 0", textAlign:"center"}}>
                <p style={{fontSize:13, fontWeight:600, color:"var(--pf-text-dim)"}}>Aucun événement</p>
                <p style={{fontSize:12, color:"var(--pf-text-muted)", marginTop:4}}>
                  {desktopEmptyMsg}
                </p>
              </div>
            ) : (
              <div style={{display:"flex", flexDirection:"column", gap:10}}>
                {dayEvents.map(e => (
                  <DayEventCard key={e.id} event={e} primaryColor={primaryColor} onClick={() => router.push(`/events/${e.id}`)}/>
                ))}
              </div>
            )}

            {session && (
              <div style={{marginTop:18, fontSize:11, color:"var(--pf-text-muted)"}}>
                {session.user?.name || session.user?.email}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
