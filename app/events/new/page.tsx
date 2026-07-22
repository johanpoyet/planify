"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/lib/themeContext";
import { useToast } from "@/lib/toastContext";
import ConfirmModal from "@/components/ConfirmModal";

/* ------------------------------------------------------------------ types */
interface Friend { id: string; name: string | null; email: string; }
interface Friendship { id: string; friend: Friend; status: string; }

/* --------------------------------------------------------------- constants */
const FRIEND_COLORS = ["#7C5CFF","#FF7A45","#4FD18B","#FF6BD6","#4F8BFF","#FFB454"];
const WEEKDAYS = [
  { key: "lun", label: "L" }, { key: "mar", label: "M" }, { key: "mer", label: "M" },
  { key: "jeu", label: "J" }, { key: "ven", label: "V" }, { key: "sam", label: "S" }, { key: "dim", label: "D" },
];

/* --------------------------------------------------------------- helpers */
function fcolor(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + (s.codePointAt(i) ?? 0)) >>> 0;
  return FRIEND_COLORS[h % FRIEND_COLORS.length];
}
function fmtDate(s: string) {
  return new Intl.DateTimeFormat("fr-FR",{ weekday:"long", day:"numeric", month:"long" }).format(new Date(s));
}
function fmtTime(s: string) {
  return new Intl.DateTimeFormat("fr-FR",{ hour:"2-digit", minute:"2-digit" }).format(new Date(s));
}
function getDayBg(isSel: boolean, isTod: boolean, primaryColor: string): string {
  if (isSel) return primaryColor;
  if (isTod) return "var(--pf-surface-3)";
  return "transparent";
}
function getDayColor(isPast: boolean, isSel: boolean, isTod: boolean, primaryColor: string): string {
  if (isPast) return "var(--pf-border-strong)";
  if (isSel) return "var(--pf-on-accent)";
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
function IcoSearch() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
}
function IcoPlus() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>;
}

/* --------------------------------------------------------- CalPicker */
function CalPicker({ value, onChange, minDate }: Readonly<{ value: string; onChange:(v:string)=>void; minDate?: Date }>) {
  const { primaryColor } = useTheme();
  const [month, setMonth] = useState(value ? new Date(value) : new Date());
  const [selDate, setSelDate] = useState<Date|null>(value ? new Date(value) : null);
  const [time, setTime] = useState(value ? new Date(value).toTimeString().slice(0,5) : "12:00");

  const toIso = (d: Date, t: string) => {
    const [h,m] = t.split(":").map(s => Number.parseInt(s,10));
    const nd = new Date(d);
    if (!Number.isNaN(h) && !Number.isNaN(m)) nd.setHours(h,m); else nd.setHours(12,0);
    // Date locale : toISOString() convertirait en temps universel et decalerait
    // l'heure choisie par l'utilisateur de son decalage horaire.
    const p = (n: number) => String(n).padStart(2, "0");
    return `${nd.getFullYear()}-${p(nd.getMonth()+1)}-${p(nd.getDate())}T${p(nd.getHours())}:${p(nd.getMinutes())}`;
  };
  const pick = (day: number) => {
    const d = new Date(month.getFullYear(), month.getMonth(), day);
    setSelDate(d); onChange(toIso(d, time));
  };
  const changeTime = (t: string) => { setTime(t); if (selDate) onChange(toIso(selDate, t)); };

  const fdow = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const blanks = fdow === 0 ? 6 : fdow - 1;
  const days = new Date(month.getFullYear(), month.getMonth()+1, 0).getDate();
  const today = new Date(); today.setHours(0,0,0,0);

  return (
    <div style={{ background:"var(--pf-surface-2)", borderRadius:12, padding:12, border:"1px solid var(--pf-border)" }}>
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize:13, fontWeight:600, textTransform:"capitalize", color:"var(--pf-text)" }}>
          {month.toLocaleDateString("fr-FR",{ month:"long", year:"numeric" })}
        </span>
        <div className="flex gap-1">
          {(["prev","next"] as const).map(dir => (
            <button key={dir} type="button"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth()+(dir==="prev"?-1:1)))}
              style={{ width:24, height:24, borderRadius:8, background:"var(--pf-surface-3)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--pf-text-dim)", cursor:"pointer" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={dir==="prev" ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"}/>
              </svg>
            </button>
          ))}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:4 }}>
        {WEEKDAYS.map(wd => (
          <div key={wd.key} style={{ textAlign:"center", fontSize:9, fontWeight:700, color:"var(--pf-text-muted)", padding:"3px 0", textTransform:"uppercase", letterSpacing:"0.05em" }}>{wd.label}</div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
        {(["a","b","c","d","e","f"] as const).slice(0, blanks).map(k => <div key={`blank-${k}`}/>)}
        {Array.from({ length:days }, (_,i) => i+1).map(day => {
          const dd = new Date(month.getFullYear(), month.getMonth(), day);
          dd.setHours(0,0,0,0);
          const isPast = minDate ? dd < new Date(minDate.getFullYear(),minDate.getMonth(),minDate.getDate()) : dd < today;
          const isSel = selDate?.getDate()===day && selDate?.getMonth()===month.getMonth() && selDate?.getFullYear()===month.getFullYear();
          const isTod = today.getDate()===day && today.getMonth()===month.getMonth() && today.getFullYear()===month.getFullYear();
          return (
            <button key={`d-${day}`} type="button" disabled={isPast} onClick={() => !isPast && pick(day)}
              style={{
                aspectRatio:"1", display:"flex", alignItems:"center", justifyContent:"center",
                borderRadius:8, fontSize:12, fontWeight: isSel||isTod ? 600 : 400, border:"none", cursor: isPast?"not-allowed":"pointer",
                background: getDayBg(!!isSel, isTod, primaryColor),
                color: getDayColor(isPast, !!isSel, isTod, primaryColor),
                opacity: isPast ? 0.35 : 1,
              }}>{day}</button>
          );
        })}
      </div>
      <div style={{ borderTop:"1px solid var(--pf-border)", marginTop:10, paddingTop:10 }}>
        <label htmlFor="evt-time" style={{ display:"block", fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"var(--pf-text-muted)", marginBottom:5 }}>Heure</label>
        <input id="evt-time" type="time" value={time} onChange={e => changeTime(e.target.value)}
          style={{ width:"100%", background:"var(--pf-surface)", border:`1px solid ${primaryColor}`, borderRadius:8, padding:"7px 10px", color:"var(--pf-text)", colorScheme:"dark", fontSize:14, outline:"none" }}/>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- FieldRow (mobile) */
function MFieldRow({ icon, label, value, placeholder, divider=false, onClick }:
  Readonly<{ icon:React.ReactNode; label:string; value?:string|null; placeholder?:string; divider?:boolean; onClick?:()=>void }>) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left"
      style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderTop: divider ? "1px solid var(--pf-border)" : "none", background:"transparent", border:"none", cursor:"pointer", width:"100%" }}>
      <span style={{ color:"var(--pf-text-muted)", display:"flex", flexShrink:0 }}>{icon}</span>
      <span style={{ flex:1, minWidth:0 }}>
        <span style={{ display:"block", fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em", color:"var(--pf-text-muted)" }}>{label}</span>
        <span style={{ display:"block", fontSize:13, fontWeight:500, marginTop:1, color: value ? "var(--pf-text)" : "var(--pf-text-muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {value || placeholder}
        </span>
      </span>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color:"var(--pf-text-muted)", flexShrink:0 }}>
        <path d="m9 5 7 7-7 7"/>
      </svg>
    </button>
  );
}

/* --------------------------------------------------------- FormField (desktop) */
function DFormField({ label, span=1, children }: Readonly<{ label:string; span?:number; children:React.ReactNode }>) {
  return (
    <div style={{ gridColumn:`span ${span}` }}>
      <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"var(--pf-text-muted)", marginBottom:6 }}>{label}</div>
      <div style={{ background:"var(--pf-surface)", border:"1px solid var(--pf-border)", borderRadius:10, padding:"12px 14px", fontSize:14, fontWeight:500 }}>
        {children}
      </div>
    </div>
  );
}

/* --------------------------------------------------------- VisChip */
function VisChip({ label, active, onClick }: Readonly<{ label:string; active:boolean; onClick:()=>void }>) {
  return (
    <button type="button" onClick={onClick}
      style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:999, fontSize:13, fontWeight:500, cursor:"pointer",
        background: active ? "var(--pf-accent-soft)" : "transparent",
        border: `1px solid ${active ? "transparent" : "var(--pf-border)"}`,
        color: active ? "var(--pf-accent)" : "var(--pf-text-dim)" }}>
      {label}
    </button>
  );
}

/* --------------------------------------------------------- FriendRow */
function FriendRow({ friend, selected, onToggle, primaryColor }: Readonly<{ friend:Friend; selected:boolean; onToggle:()=>void; primaryColor:string }>) {
  const name = friend.name || friend.email;
  const color = fcolor(name);
  return (
    <button type="button" onClick={onToggle}
      style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 4px", width:"100%", background:"transparent", border:"none", cursor:"pointer", textAlign:"left" }}>
      <div style={{ width:32, height:32, borderRadius:"50%", background:color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff", flexShrink:0 }}>
        {(() => { const p = name.trim().split(/\s+/).filter(Boolean); return p.length >= 2 ? (p[0][0]+p[p.length-1][0]).toUpperCase() : name.slice(0,2).toUpperCase(); })()}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:500, color:"var(--pf-text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</div>
        {friend.name && <div style={{ fontSize:11, color:"var(--pf-text-muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{friend.email}</div>}
      </div>
      <div style={{ width:36, height:22, borderRadius:999, background: selected ? primaryColor : "var(--pf-surface-3)", position:"relative", flexShrink:0, transition:"background .15s" }}>
        <div style={{ position:"absolute", top:2, left:2, width:18, height:18, borderRadius:"50%", background:"#fff", boxShadow:"0 1px 3px rgba(0,0,0,.2)", transition:"transform .15s", transform: selected ? "translateX(14px)" : "translateX(0)" }}/>
      </div>
    </button>
  );
}

/* --------------------------------------------------------- MobileFriendSection */
interface MobileFriendSectionProps {
  selectedFriends: string[];
  friends: Friendship[];
  filteredFriends: Friendship[];
  friendSearch: string;
  setFriendSearch: (v: string) => void;
  showMobileFriends: boolean;
  setShowMobileFriends: React.Dispatch<React.SetStateAction<boolean>>;
  toggle: (id: string) => void;
  primaryColor: string;
}

function MobileFriendSection({ selectedFriends, friends, filteredFriends, friendSearch, setFriendSearch, showMobileFriends, setShowMobileFriends, toggle, primaryColor }: Readonly<MobileFriendSectionProps>) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"var(--pf-text-muted)", marginBottom:10 }}>
        {selectedFriends.length > 0 ? `Invités · ${selectedFriends.length}` : "Invités"}
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {selectedFriends.map(id => {
          const f = friends.find(fr => fr.friend.id===id)?.friend;
          if (!f) return null;
          const name = f.name || f.email;
          const col = fcolor(name);
          return (
            <button key={id} type="button" onClick={() => toggle(id)}
              style={{ display:"flex", alignItems:"center", gap:6, background:"var(--pf-surface)", border:"1px solid var(--pf-border)", borderRadius:999, padding:"4px 10px 4px 4px", cursor:"pointer" }}>
              <div style={{ width:22, height:22, borderRadius:"50%", background:col, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff", flexShrink:0 }}>
                {(() => { const p = name.trim().split(/\s+/).filter(Boolean); return p.length >= 2 ? (p[0][0]+p[p.length-1][0]).toUpperCase() : name.slice(0,2).toUpperCase(); })()}
              </div>
              <span style={{ fontSize:13, fontWeight:500, color:"var(--pf-text)" }}>{name.split(" ")[0]}</span>
              <span style={{ fontSize:11, color:"var(--pf-text-muted)" }}>×</span>
            </button>
          );
        })}
        {friends.length > 0 && (
          <button type="button" onClick={() => setShowMobileFriends(p => !p)}
            style={{ display:"flex", alignItems:"center", gap:6, background:"transparent", border:"1px dashed var(--pf-border-strong)", borderRadius:999, padding:"5px 12px", fontSize:13, color:"var(--pf-text-dim)", cursor:"pointer" }}>
            <IcoPlus/> Ajouter
          </button>
        )}
      </div>
      {showMobileFriends && (
        <div style={{ marginTop:10, background:"var(--pf-surface)", border:"1px solid var(--pf-border)", borderRadius:16, padding:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"var(--pf-surface-2)", border:"1px solid var(--pf-border)", borderRadius:10, padding:"8px 12px", marginBottom:10 }}>
            <IcoSearch/>
            <input type="text" value={friendSearch} onChange={e => setFriendSearch(e.target.value)} placeholder="Chercher…"
              style={{ flex:1, background:"transparent", border:"none", outline:"none", fontSize:13, color:"var(--pf-text)" }}/>
          </div>
          <div style={{ display:"flex", flexDirection:"column" }}>
            {filteredFriends.map(fr => <FriendRow key={fr.friend.id} friend={fr.friend} selected={selectedFriends.includes(fr.friend.id)} onToggle={() => toggle(fr.friend.id)} primaryColor={primaryColor}/>)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================ PAGE */
export default function NewEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { primaryColor } = useTheme();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [conflicts, setConflicts] = useState<Record<string, { id:string; title:string; date:string }[]>>({});
  const [loadingConflicts, setLoadingConflicts] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [showMobileFriends, setShowMobileFriends] = useState(false);
  const [mobileOpen, setMobileOpen] = useState<"date"|"location"|"visibility"|null>(null);

  const locationRef = useRef<HTMLInputElement>(null);
  const dateFromUrl = searchParams.get("date");

  const [formData, setFormData] = useState({
    title: "", description: "",
    date: dateFromUrl ? `${dateFromUrl}T12:00` : "",
    location: "", visibility: "friends",
  });

  useEffect(() => { fetchFriends(); }, []);
  useEffect(() => {
    if (mobileOpen === "location") setTimeout(() => locationRef.current?.focus(), 50);
  }, [mobileOpen]);

  useEffect(() => {
    let mounted = true, timer: ReturnType<typeof setTimeout>|null = null;
    if (formData.date && selectedFriends.length > 0) {
      timer = setTimeout(async () => {
        setLoadingConflicts(true);
        try {
          const r = await fetch("/api/events/conflicts", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userIds:selectedFriends, date:formData.date }) });
          if (r.ok && mounted) setConflicts((await r.json()).conflicts || {});
        } catch { if (mounted) setConflicts({}); }
        finally { if (mounted) setLoadingConflicts(false); }
      }, 300);
    } else setConflicts({});
    return () => { mounted=false; if (timer) clearTimeout(timer); };
  }, [formData.date, selectedFriends]);

  const fetchFriends = async () => { try { const r = await fetch("/api/friends?status=accepted"); if (r.ok) setFriends((await r.json()).filter((f: Friendship) => f.friend != null)); } catch { /* liste d'amis indisponible : on conserve la liste vide */ } };
  const toggle = (id: string) => setSelectedFriends(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);

  const totalConflicts = Object.values(conflicts).reduce((a,arr) => a+arr.length, 0);

  const visLabel = formData.visibility==="private" ? "Privé — invités seulement" : "Amis";

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formData.title.trim()) return;
    if (totalConflicts > 0) { setShowConfirmModal(true); return; }
    await proceedCreate();
  };

  const proceedCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/events",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(formData) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||"Erreur");
      if (selectedFriends.length > 0) {
        await fetch(`/api/events/${data.id}/participants`,{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userIds:selectedFriends }) });
      }
      showToast(selectedFriends.length > 0 ? `Événement créé · ${selectedFriends.length} invitation(s)` : "Événement créé !", "success");
      setTimeout(() => router.push("/events"), 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur";
      showToast(msg,"error");
    }
    finally { setLoading(false); setShowConfirmModal(false); }
  };

  const filteredFriends = friends.filter(fr => fr.friend != null && (fr.friend.name||fr.friend.email).toLowerCase().includes(friendSearch.toLowerCase()));

  /* ================================================================ RENDER */
  return (
    <div style={{ minHeight:"100vh", background:"var(--pf-bg)" }}>

      {/* ---- sticky header ---- */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", position:"sticky", top:0, zIndex:10, background:"var(--pf-bg)", borderBottom:"1px solid var(--pf-border)" }}>
        <button type="button" onClick={() => router.back()}
          style={{ width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", background:"var(--pf-surface)", border:"1px solid var(--pf-border)", borderRadius:10, color:"var(--pf-text-dim)", cursor:"pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
        <span style={{ fontSize:14, fontWeight:600, color:"var(--pf-text)", letterSpacing:"-0.01em" }}>Nouvel événement</span>
        <button type="button" onClick={() => { void handleSubmit(); }} disabled={loading||!formData.title.trim()}
          style={{ padding:"7px 16px", borderRadius:10, background: primaryColor, color: 'var(--pf-on-accent)', fontSize:13, fontWeight:600, border:"none", cursor:"pointer", opacity: loading||!formData.title.trim() ? 0.4 : 1 }}>
          {loading ? "…" : "Créer"}
        </button>
      </div>

      {/* ================================================================ MOBILE (< md) */}
      <div className="md:hidden" style={{ padding:"24px 16px 120px" }}>

        {/* Title */}
        <input type="text" value={formData.title} onChange={e => setFormData({...formData, title:e.target.value})}
          placeholder="Nom de l'événement" className="w-full"
          style={{ background:"transparent", border:"none", outline:"none", fontSize:26, fontWeight:600, letterSpacing:"-0.025em", color:"var(--pf-text)", marginBottom:24, display:"block", width:"100%" }}/>

        {/* Field rows card */}
        <div style={{ background:"var(--pf-surface)", border:"1px solid var(--pf-border)", borderRadius:16, overflow:"hidden", marginBottom:14 }}>
          <MFieldRow icon={<IcoCal/>} label="Date" value={formData.date ? fmtDate(formData.date) : null} placeholder="Choisir une date"
            onClick={() => setMobileOpen(p => p==="date" ? null : "date")}/>
          <MFieldRow icon={<IcoClock/>} label="Heure" value={formData.date ? fmtTime(formData.date) : null} placeholder="—" divider
            onClick={() => setMobileOpen(p => p==="date" ? null : "date")}/>
          <MFieldRow icon={<IcoPin/>} label="Lieu" value={formData.location||null} placeholder="Ajouter un lieu" divider
            onClick={() => setMobileOpen(p => p==="location" ? null : "location")}/>
          <MFieldRow icon={<IcoVis/>} label="Visibilité" value={visLabel} divider
            onClick={() => setMobileOpen(p => p==="visibility" ? null : "visibility")}/>
        </div>

        {/* Inline expanded panels */}
        {mobileOpen === "date" && (
          <div style={{ marginBottom:14 }}>
            <CalPicker value={formData.date} onChange={v => setFormData({...formData, date:v})} minDate={new Date()}/>
          </div>
        )}
        {mobileOpen === "location" && (
          <div style={{ marginBottom:14 }}>
            <input ref={locationRef} type="text" value={formData.location} onChange={e => setFormData({...formData, location:e.target.value})}
              placeholder="Restaurant, adresse…"
              style={{ width:"100%", background:"var(--pf-surface)", border:"1px solid var(--pf-border)", borderRadius:12, padding:"12px 14px", fontSize:14, color:"var(--pf-text)", outline:"none", boxSizing:"border-box" }}/>
          </div>
        )}
        {mobileOpen === "visibility" && (
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            <VisChip label="Privé" active={formData.visibility==="private"} onClick={() => setFormData({...formData, visibility:"private"})}/>
            <VisChip label="Amis" active={formData.visibility==="friends"} onClick={() => setFormData({...formData, visibility:"friends"})}/>
          </div>
        )}

        {/* Friends */}
        <MobileFriendSection
          selectedFriends={selectedFriends}
          friends={friends}
          filteredFriends={filteredFriends}
          friendSearch={friendSearch}
          setFriendSearch={setFriendSearch}
          showMobileFriends={showMobileFriends}
          setShowMobileFriends={setShowMobileFriends}
          toggle={toggle}
          primaryColor={primaryColor}
        />

        {/* Description */}
        <div style={{ background:"var(--pf-surface)", border:"1px solid var(--pf-border)", borderRadius:16, padding:14, marginTop:4 }}>
          <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"var(--pf-text-muted)", marginBottom:6 }}>Description</div>
          <textarea value={formData.description} onChange={e => setFormData({...formData, description:e.target.value})}
            placeholder="Détails de l'événement…" rows={3}
            style={{ width:"100%", background:"transparent", border:"none", outline:"none", resize:"none", color:"var(--pf-text)", fontFamily:"inherit", fontSize:14, minHeight:70 }}/>
        </div>
      </div>

      {/* ================================================================ DESKTOP (≥ md) */}
      <div className="hidden md:grid" style={{ gridTemplateColumns:"1fr 420px", minHeight:"calc(100vh - 57px)" }}>

        {/* LEFT: form */}
        <div style={{ padding:"40px 56px", overflowY:"auto", borderRight:"1px solid var(--pf-border)" }}>
          <div style={{ maxWidth:640 }}>

            <input type="text" value={formData.title} onChange={e => setFormData({...formData, title:e.target.value})}
              placeholder="Nom de l'événement"
              style={{ width:"100%", background:"transparent", border:"none", outline:"none", fontSize:40, fontWeight:600, letterSpacing:"-0.035em", color:"var(--pf-text)", marginBottom:8, padding:0, display:"block" }}/>

            <input type="text" value={formData.description} onChange={e => setFormData({...formData, description:e.target.value})}
              placeholder="Ajouter une description courte…"
              style={{ width:"100%", background:"transparent", border:"none", outline:"none", fontSize:16, color:"var(--pf-text-dim)", marginBottom:36, padding:0, display:"block" }}/>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>

              <DFormField label="Date">
                <button type="button" onClick={() => setMobileOpen(p => p==="date" ? null : "date")}
                  style={{ display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", width:"100%", background:"transparent", border:"none", padding:0 }}>
                  <span style={{ color: formData.date ? "var(--pf-text)" : "var(--pf-text-muted)" }}>
                    {formData.date ? fmtDate(formData.date) : "Choisir une date"}
                  </span>
                  <IcoCal/>
                </button>
              </DFormField>

              <DFormField label="Heure">
                <button type="button" onClick={() => setMobileOpen(p => p==="date" ? null : "date")}
                  style={{ display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", width:"100%", background:"transparent", border:"none", padding:0 }}>
                  <span style={{ fontFamily:"monospace", color: formData.date ? "var(--pf-text)" : "var(--pf-text-muted)" }}>
                    {formData.date ? fmtTime(formData.date) : "—"}
                  </span>
                  <IcoClock/>
                </button>
              </DFormField>

              {mobileOpen === "date" && (
                <div style={{ gridColumn:"span 2" }}>
                  <CalPicker value={formData.date} onChange={v => setFormData({...formData, date:v})} minDate={new Date()}/>
                </div>
              )}

              <DFormField label="Lieu" span={2}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <input type="text" value={formData.location} onChange={e => setFormData({...formData, location:e.target.value})}
                    placeholder="Bar Le Calbar · adresse"
                    style={{ flex:1, background:"transparent", border:"none", outline:"none", fontSize:14, fontWeight:500, color:"var(--pf-text)" }}/>
                  <IcoPin/>
                </div>
              </DFormField>

              <DFormField label="Visibilité" span={2}>
                <div style={{ display:"flex", gap:8 }}>
                  <VisChip label="Privé — invités" active={formData.visibility==="private"} onClick={() => setFormData({...formData, visibility:"private"})}/>
                  <VisChip label="Amis" active={formData.visibility==="friends"} onClick={() => setFormData({...formData, visibility:"friends"})}/>
                </div>
              </DFormField>
            </div>

          </div>
        </div>

        {/* RIGHT: invite panel */}
        <div style={{ padding:"32px 28px", background:"var(--pf-bg-2)", overflowY:"auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <span style={{ fontSize:16, fontWeight:700, color:"var(--pf-text)", letterSpacing:"-0.01em" }}>Inviter</span>
            {selectedFriends.length > 0 && (
              <span style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:999, background:"var(--pf-surface-2)", border:"1px solid var(--pf-border)", color:"var(--pf-text-dim)" }}>
                {selectedFriends.length} sélectionné{selectedFriends.length>1?"s":""}
              </span>
            )}
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:8, background:"var(--pf-surface)", border:"1px solid var(--pf-border)", borderRadius:10, padding:"8px 12px", fontSize:13, color:"var(--pf-text-dim)", marginBottom:16 }}>
            <IcoSearch/>
            <input type="text" value={friendSearch} onChange={e => setFriendSearch(e.target.value)} placeholder="Chercher un ami ou un email"
              style={{ flex:1, background:"transparent", border:"none", outline:"none", fontSize:13, color:"var(--pf-text)" }}/>
          </div>

          {friends.length === 0 ? (
            <p style={{ fontSize:13, color:"var(--pf-text-muted)" }}>Aucun ami pour l&apos;instant.</p>
          ) : (
            <>
              <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--pf-text-muted)", marginBottom:8 }}>Récents</div>
              <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                {filteredFriends.map(fr => (
                  <FriendRow key={fr.friend.id} friend={fr.friend} selected={selectedFriends.includes(fr.friend.id)} onToggle={() => toggle(fr.friend.id)} primaryColor={primaryColor}/>
                ))}
              </div>
            </>
          )}

          {totalConflicts > 0 && !loadingConflicts && (
            <div style={{ marginTop:16, padding:12, background:"rgba(255,180,84,0.1)", border:"1px solid rgba(255,180,84,0.25)", borderRadius:10 }}>
              <p style={{ fontSize:12, fontWeight:600, color:"var(--pf-warn)", marginBottom:4 }}>{totalConflicts} conflit(s)</p>
              {friends.filter(f => selectedFriends.includes(f.friend.id) && (conflicts[f.friend.id]?.length??0)>0).map(f => (
                <p key={f.friend.id} style={{ fontSize:12, color:"var(--pf-warn)" }}>
                  {f.friend.name||f.friend.email} — {(conflicts[f.friend.id]||[]).map(e=>e.title).join(", ")}
                </p>
              ))}
            </div>
          )}

          <div style={{ marginTop:18, padding:12, background:"var(--pf-surface)", border:"1px solid var(--pf-border)", borderRadius:10, fontSize:12, color:"var(--pf-text-dim)", lineHeight:1.5 }}>
            <strong style={{ color:"var(--pf-text)" }}>Astuce</strong> · Les invités reçoivent une notification push. Ils peuvent répondre sans créer de compte.
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        title="Conflits détectés"
        description={`${totalConflicts} conflit(s) pour les amis sélectionnés. Créer quand même ?`}
        confirmLabel="Créer quand même" cancelLabel="Annuler"
        loading={loading} onConfirm={proceedCreate} onCancel={() => setShowConfirmModal(false)}/>
    </div>
  );
}
