'use client';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/lib/themeContext';

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  required?: boolean;
  minDate?: Date;
}

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function getDayBg(isSelected: boolean, isToday: boolean, primaryColor: string): string {
  if (isSelected) return primaryColor;
  if (isToday) return 'var(--pf-surface-3)';
  return 'transparent';
}

function getDayColor(isPast: boolean, isSelected: boolean, isToday: boolean, primaryColor: string): string {
  if (isPast) return 'var(--pf-text-muted)';
  if (isSelected) return 'var(--pf-on-accent)';
  if (isToday) return 'var(--pf-accent-strong)';
  return 'var(--pf-text)';
}

export default function DateTimePicker({ value, onChange, onFocus, onBlur, minDate }: Readonly<DateTimePickerProps>) {
  const { primaryColor } = useTheme();
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  const [time, setTime] = useState(value ? new Date(value).toTimeString().slice(0, 5) : '12:00');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
        onBlur?.();
      }
    };
    if (showCalendar) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCalendar, onBlur]);

  const getDaysInMonth = (d: Date) => {
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return { daysInMonth: last.getDate(), startingDayOfWeek: first.getDay() };
  };

  const buildIso = (date: Date, t: string) => {
    const [h, m] = t.split(':').map(s => Number.parseInt(s, 10));
    const d = new Date(date);
    if (!Number.isNaN(h) && !Number.isNaN(m)) d.setHours(h, m);
    else d.setHours(12, 0);
    // La valeur produite est une date locale (format « datetime-local »).
    // toISOString() convertirait en UTC et décalerait l'heure choisie par
    // l'utilisateur de son décalage horaire.
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
      + `T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
    onChange(buildIso(newDate, time));
  };

  const handleTimeChange = (t: string) => {
    setTime(t);
    if (selectedDate) onChange(buildIso(selectedDate, t));
  };

  const formatDisplay = () => {
    if (!value) return 'Sélectionner une date';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(value));
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const blanks = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
  const monthName = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => { setShowCalendar(p => !p); if (!showCalendar) onFocus?.(); }}
        className="w-full flex items-center gap-3 text-left transition-all outline-none"
        style={{
          background: 'var(--pf-surface-2)', border: '1px solid var(--pf-border)',
          borderRadius: 10, padding: '10px 14px', fontSize: 14,
          color: value ? 'var(--pf-text)' : 'var(--pf-text-muted)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--pf-text-muted)', flexShrink: 0 }}>
          <rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/>
        </svg>
        <span>{formatDisplay()}</span>
      </button>

      {showCalendar && (
        <div
          className="absolute z-50 mt-2"
          style={{
            width: 300, background: 'var(--pf-surface)',
            border: '1px solid var(--pf-border)', borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)', padding: 16,
          }}
        >
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold capitalize" style={{ color: 'var(--pf-text)' }}>{monthName}</span>
            <div className="flex gap-1">
              {(['prev', 'next'] as const).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + (dir === 'prev' ? -1 : 1)))}
                  className="flex items-center justify-center rounded-lg transition-colors"
                  style={{ width: 28, height: 28, background: 'var(--pf-surface-2)', color: 'var(--pf-text-dim)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--pf-surface-3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--pf-surface-2)')}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={dir === 'prev' ? 'm15 5-7 7 7 7' : 'm9 5 7 7-7 7'}/>
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Grid header */}
          <div className="grid grid-cols-7 mb-1">
            {WEEK_DAYS.map(d => (
              <div key={d} className="text-center py-1" style={{ fontSize: 10, fontWeight: 600, color: 'var(--pf-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: blanks }, (_, i) => `blank-${currentMonth.getFullYear()}-${currentMonth.getMonth()}-${i}`).map(key => <div key={key} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const today = new Date(); today.setHours(0, 0, 0, 0);
              const isPast = minDate
                ? dayDate < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
                : dayDate < today;
              const isSelected = selectedDate?.getDate() === day
                && selectedDate?.getMonth() === currentMonth.getMonth()
                && selectedDate?.getFullYear() === currentMonth.getFullYear();
              const isToday = new Date().getDate() === day
                && new Date().getMonth() === currentMonth.getMonth()
                && new Date().getFullYear() === currentMonth.getFullYear();

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => !isPast && handleDateSelect(day)}
                  disabled={isPast}
                  className="aspect-square flex items-center justify-center rounded-lg text-sm transition-all disabled:cursor-not-allowed"
                  style={{
                    background: getDayBg(!!isSelected, isToday, primaryColor),
                    color: getDayColor(isPast, !!isSelected, isToday, primaryColor),
                    opacity: isPast ? 0.35 : 1,
                    fontWeight: isSelected || isToday ? 600 : 400,
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Time */}
          <div style={{ borderTop: '1px solid var(--pf-border)', marginTop: 12, paddingTop: 12 }}>
            <label
              htmlFor="dt-time"
              style={{ display: 'block', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--pf-text-muted)', marginBottom: 6 }}
            >
              Heure
            </label>
            <input
              id="dt-time"
              type="time"
              value={time}
              onChange={e => handleTimeChange(e.target.value)}
              className="w-full outline-none text-sm"
              style={{
                background: 'var(--pf-surface-2)', border: `1px solid ${primaryColor}`,
                borderRadius: 8, padding: '8px 12px',
                color: 'var(--pf-text)', colorScheme: 'dark',
              }}
            />
          </div>

          {/* Confirm */}
          <button
            type="button"
            onClick={() => { setShowCalendar(false); onBlur?.(); }}
            className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: primaryColor }}
          >
            Confirmer
          </button>
        </div>
      )}
    </div>
  );
}
