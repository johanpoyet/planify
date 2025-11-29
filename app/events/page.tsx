"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/themeContext";

interface EventType {
  id: string;
  name: string;
  color: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  visibility: string;
  createdById: string;
  eventType?: EventType | null;
  createdBy?: {
    name: string | null;
    email: string;
  };
}

export default function EventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { primaryColor, primaryHoverColor, primaryLightColor } = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchEvents();
    }
  }, [status]);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des événements:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl shadow-lg mb-4 animate-pulse" style={{ backgroundColor: primaryColor }}>
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-slate-300 text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Fonctions pour le calendrier
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);

    const dayEvents = getEventsForDate(clickedDate);
    setSelectedEvents(dayEvents);
  };

  const handleDateDoubleClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateString = clickedDate.toISOString().split('T')[0];
    router.push(`/events/new?date=${dateString}`);
  };

  const handleEventClick = (event: Event) => {
    // Pas besoin de cette fonction pour l'instant, on peut la garder pour une évolution future
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const previousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const previousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const getWeekDays = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(date);
    monday.setDate(diff);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };

  const getHoursOfDay = () => {
    return Array.from({ length: 24 }, (_, i) => i);
  };

  const getEventsForHour = (hour: number, date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getHours() === hour
      );
    });
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const weekDaysFull = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  const getViewTitle = () => {
    if (viewMode === 'month') {
      return monthName;
    } else if (viewMode === 'week') {
      const weekStart = getWeekDays(currentDate)[0];
      const weekEnd = getWeekDays(currentDate)[6];
      return `${weekStart.getDate()} ${weekStart.toLocaleDateString('fr-FR', { month: 'short' })} - ${weekEnd.getDate()} ${weekEnd.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
  };

  const handlePrevious = () => {
    if (viewMode === 'month') previousMonth();
    else if (viewMode === 'week') previousWeek();
    else previousDay();
  };

  const handleNext = () => {
    if (viewMode === 'month') nextMonth();
    else if (viewMode === 'week') nextWeek();
    else nextDay();
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-slate-900/50 to-transparent"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="px-4 py-6 sm:px-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Calendrier</h1>
              <p className="text-slate-400 text-sm mt-1">
                {session?.user?.name || session?.user?.email}
              </p>
            </div>
            <button
              onClick={() => router.push('/events/new')}
              className="relative group md:hidden"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = primaryHoverColor}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
            >
              <div className="relative px-4 py-2 sm:px-6 sm:py-3 rounded-2xl flex items-center gap-2 transition shadow-lg" style={{ backgroundColor: primaryColor }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-white font-semibold hidden sm:inline">Nouvel événement</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content Layout - Mobile: Stack / Desktop: Side by side */}
        <div className="px-4 sm:px-6 pb-24 md:pb-8 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Calendar Section */}
            <div className="md:w-1/2">
              <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-700/50 p-4 sm:p-6 md:h-[600px] flex flex-col">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white capitalize">{getViewTitle()}</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrevious}
                      className="p-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700"
                    >
                      <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={handleNext}
                      className="p-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700"
                    >
                      <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* View Mode Selector */}
                <div className="flex gap-1 mb-4 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <button
                    onClick={() => setViewMode('month')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === 'month'
                        ? 'text-white shadow-lg'
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
                    }`}
                    style={viewMode === 'month' ? { backgroundColor: primaryColor } : {}}
                  >
                    Mois
                  </button>
                  <button
                    onClick={() => setViewMode('week')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === 'week'
                        ? 'text-white shadow-lg'
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
                    }`}
                    style={viewMode === 'week' ? { backgroundColor: primaryColor } : {}}
                  >
                    Semaine
                  </button>
                  <button
                    onClick={() => setViewMode('day')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === 'day'
                        ? 'text-white shadow-lg'
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
                    }`}
                    style={viewMode === 'day' ? { backgroundColor: primaryColor } : {}}
                  >
                    Jour
                  </button>
                </div>

            {/* Calendar Grid */}
            {viewMode === 'month' && (
              <div className="grid grid-cols-7 gap-1 sm:gap-2 flex-1">
                {/* Week days */}
                {weekDays.map(day => (
                  <div key={day} className="text-center text-xs sm:text-sm font-medium text-slate-400 py-2">
                    {day}
                  </div>
                ))}

                {/* Empty cells before first day */}
                {Array.from({ length: startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1 }).map((_, index) => (
                  <div key={`empty-${index}`} className="aspect-square" />
                ))}

                {/* Days */}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                  const dayEvents = getEventsForDate(date);
                  const isSelected = selectedDate &&
                    selectedDate.getDate() === day &&
                    selectedDate.getMonth() === currentDate.getMonth() &&
                    selectedDate.getFullYear() === currentDate.getFullYear();
                  const isToday =
                    new Date().getDate() === day &&
                    new Date().getMonth() === currentDate.getMonth() &&
                    new Date().getFullYear() === currentDate.getFullYear();

                  return (
                    <button
                      key={day}
                      onClick={() => handleDateClick(day)}
                      onDoubleClick={() => handleDateDoubleClick(day)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm sm:text-base font-medium transition-all relative
                        ${dayEvents.length > 0 && !isSelected
                          ? 'bg-slate-800/70 text-white hover:bg-slate-800 border border-slate-700'
                          : !isSelected
                          ? 'bg-slate-800/30 text-slate-400 hover:bg-slate-800/50'
                          : ''
                        }
                        ${isToday && !isSelected ? 'ring-2' : ''}
                      `}
                      style={isSelected ? { backgroundColor: primaryColor, color: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' } : isToday ? { borderColor: primaryColor } : {}}
                    >
                      <span>{day}</span>
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 mt-1">
                          {dayEvents.slice(0, 3).map((event, i) => (
                            <div
                              key={i}
                              className="w-1 h-1 rounded-full"
                              style={{
                                backgroundColor: isSelected
                                  ? 'white'
                                  : event.eventType
                                  ? event.eventType.color
                                  : primaryLightColor
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Week View */}
            {viewMode === 'week' && (
              <div className="flex-1 overflow-auto">
                <div className="grid grid-cols-7 gap-2 min-h-full">
                  {getWeekDays(currentDate).map((day, index) => {
                    const dayEvents = getEventsForDate(day);
                    const isToday =
                      new Date().getDate() === day.getDate() &&
                      new Date().getMonth() === day.getMonth() &&
                      new Date().getFullYear() === day.getFullYear();
                    const isSelected = selectedDate &&
                      selectedDate.getDate() === day.getDate() &&
                      selectedDate.getMonth() === day.getMonth() &&
                      selectedDate.getFullYear() === day.getFullYear();

                    return (
                      <div key={index} className="flex flex-col">
                        {/* Day header */}
                        <div className="text-center mb-2">
                          <div className="text-xs text-slate-400 mb-1">{weekDays[index]}</div>
                          <button
                            onClick={() => handleDateClick(day.getDate())}
                            onDoubleClick={() => handleDateDoubleClick(day.getDate())}
                            className={`w-full px-2 py-1 rounded-lg text-sm font-medium transition-all ${
                              isSelected
                                ? 'text-white shadow-lg'
                                : isToday
                                ? 'bg-slate-800/50 text-white border'
                                : 'text-slate-300 hover:bg-slate-800/30'
                            }`}
                            style={
                              isSelected
                                ? { backgroundColor: primaryColor }
                                : isToday
                                ? { borderColor: primaryColor }
                                : {}
                            }
                          >
                            {day.getDate()}
                          </button>
                        </div>
                        {/* Events for this day */}
                        <div className="flex-1 space-y-1">
                          {dayEvents.map((event) => (
                            <button
                              key={event.id}
                              onClick={() => {
                                setSelectedDate(day);
                                setSelectedEvents([event]);
                              }}
                              className="w-full px-1.5 py-1 rounded-lg text-left transition-all hover:shadow-md text-xs"
                              style={{
                                backgroundColor: event.eventType?.color || primaryColor,
                                opacity: 0.9
                              }}
                            >
                              <div className="text-white font-medium truncate">{event.title}</div>
                              <div className="text-white/80 text-[10px] truncate">{formatTime(event.date)}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Day View */}
            {viewMode === 'day' && (
              <div className="flex-1 overflow-auto custom-scrollbar">
                <div className="space-y-1 pr-2">
                  {getHoursOfDay().map((hour) => {
                    const hourEvents = getEventsForHour(hour, currentDate);
                    const hourLabel = `${hour.toString().padStart(2, '0')}:00`;

                    return (
                      <div key={hour} className="flex gap-2 min-h-[60px]">
                        {/* Hour label */}
                        <div className="w-14 flex-shrink-0 text-xs text-slate-400 pt-1">
                          {hourLabel}
                        </div>
                        {/* Events for this hour */}
                        <div className="flex-1 border-l border-slate-700/50 pl-2 space-y-1">
                          {hourEvents.map((event) => (
                            <button
                              key={event.id}
                              onClick={() => {
                                setSelectedDate(currentDate);
                                setSelectedEvents([event]);
                              }}
                              className="w-full px-3 py-2 rounded-xl text-left transition-all hover:shadow-lg"
                              style={{
                                backgroundColor: event.eventType?.color || primaryColor,
                                opacity: 0.95
                              }}
                            >
                              <div className="text-white font-semibold text-sm mb-0.5">{event.title}</div>
                              <div className="text-white/90 text-xs">{formatTime(event.date)}</div>
                              {event.location && (
                                <div className="text-white/80 text-xs mt-1 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  </svg>
                                  <span className="truncate">{event.location}</span>
                                </div>
                              )}
                            </button>
                          ))}
                          {hourEvents.length === 0 && (
                            <div className="h-full min-h-[50px] border-b border-slate-800/30"></div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
              </div>
            </div>

            {/* Event Details Section */}
            <div className="md:w-1/2">
              <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-700/50 p-4 sm:p-6 min-h-[300px] md:h-[600px] flex flex-col">
                {selectedEvents.length > 0 ? (
                  <div className="animate-fade-in flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                    <h3 className="text-lg font-bold text-white mb-1 sticky top-0 bg-slate-900/90 backdrop-blur-xl pb-2 z-10">
                      {selectedEvents.length} événement{selectedEvents.length > 1 ? 's' : ''} - {selectedDate?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                    </h3>
                    
                    {selectedEvents.map((event) => (
                      <div key={event.id} className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50 hover:border-slate-600/50 transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-bold text-white mb-1.5 truncate">{event.title}</h4>
                            <div className="flex flex-wrap gap-1.5 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {formatTime(event.date)}
                              </span>
                              {event.location && (
                                <span className="flex items-center gap-1 truncate">
                                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span className="truncate">{event.location}</span>
                                </span>
                              )}
                              {event.eventType && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg" style={{ backgroundColor: `${event.eventType.color}20`, color: event.eventType.color, borderColor: `${event.eventType.color}40`, borderWidth: '1px' }}>
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.eventType.color }}></div>
                                  <span className="font-medium">{event.eventType.name}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => router.push(`/events/${event.id}`)}
                            className="ml-2 px-2.5 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-600 flex items-center gap-1 flex-shrink-0"
                          >
                            <span className="text-xs font-medium">Voir</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>

                        {event.description && (
                          <div className="bg-slate-900/30 rounded-lg p-2.5 mb-2">
                            <p className="text-slate-300 text-xs leading-relaxed line-clamp-2">{event.description}</p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            event.visibility === 'public' ? 'bg-green-500/20 text-green-400' :
                            event.visibility === 'private' ? 'bg-purple-500/20 text-purple-400' : ''
                          }`}
                          style={event.visibility === 'friends' ? { 
                            backgroundColor: `${primaryColor}33`,
                            color: primaryLightColor 
                          } : {}}
                          >
                            {event.visibility === 'public' ? '🌍 Public' :
                              event.visibility === 'friends' ? '👥 Amis' :
                              '🔒 Privé'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 rounded-3xl bg-slate-800/50 flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">Sélectionnez un événement</h3>
                <p className="text-slate-500 text-sm max-w-md">
                  Cliquez sur une date du calendrier pour voir les détails de l'événement
                </p>
              </div>
            )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
