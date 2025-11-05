'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/lib/themeContext';

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  required?: boolean;
}

export default function DateTimePicker({ value, onChange, onFocus, onBlur, required }: DateTimePickerProps) {
  const { primaryColor, primaryLightColor } = useTheme();
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );
  const [time, setTime] = useState(value ? new Date(value).toTimeString().slice(0, 5) : '12:00');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
        onBlur?.();
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar, onBlur]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
    
    // Combiner la date et l'heure
    const [hours, minutes] = time.split(':');
    newDate.setHours(parseInt(hours), parseInt(minutes));
    
    // Format ISO pour l'input datetime-local
    const isoString = newDate.toISOString().slice(0, 16);
    onChange(isoString);
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    
    if (selectedDate) {
      const [hours, minutes] = newTime.split(':');
      const newDate = new Date(selectedDate);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      
      const isoString = newDate.toISOString().slice(0, 16);
      onChange(isoString);
    }
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const formatDisplayDate = () => {
    if (!value) return 'Sélectionner une date et heure';
    
    const date = new Date(value);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setShowCalendar(!showCalendar);
          if (!showCalendar) onFocus?.();
        }}
        className="w-full pl-4 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-2xl text-left text-white focus:outline-none focus:border-2 transition flex items-center gap-3"
      >
        <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className={value ? 'text-white' : 'text-slate-500'}>
          {formatDisplayDate()}
        </span>
      </button>

      {showCalendar && (
        <div className="absolute z-50 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 animate-fade-in">
          {/* Header du calendrier */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-white capitalize">{monthName}</h3>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={previousMonth}
                className="p-1.5 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Grille du calendrier */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs font-medium text-slate-400 py-1">
                {day}
              </div>
            ))}

            {Array.from({ length: startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1 }).map((_, index) => (
              <div key={`empty-${index}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const isSelected = selectedDate &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === currentMonth.getMonth() &&
                selectedDate.getFullYear() === currentMonth.getFullYear();
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === currentMonth.getMonth() &&
                new Date().getFullYear() === currentMonth.getFullYear();

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                    isSelected
                      ? 'text-white shadow-lg'
                      : isToday
                      ? 'bg-slate-800/50 text-white'
                      : 'bg-slate-800/30 text-slate-300 hover:bg-slate-800/50'
                  }`}
                  style={isSelected ? { backgroundColor: primaryColor } : {}}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Sélecteur d'heure */}
          <div className="border-t border-slate-700 pt-3">
            <label className="block text-xs font-medium text-slate-300 mb-2">Heure</label>
            <input
              type="time"
              value={time}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 transition"
              style={{ 
                borderColor: primaryLightColor,
                colorScheme: 'dark'
              }}
            />
          </div>

          {/* Bouton de validation */}
          <button
            type="button"
            onClick={() => {
              setShowCalendar(false);
              onBlur?.();
            }}
            className="w-full mt-3 px-4 py-2 text-white text-sm font-semibold rounded-lg transition-all shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            Confirmer
          </button>
        </div>
      )}
    </div>
  );
}
