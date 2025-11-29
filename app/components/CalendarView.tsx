"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  visibility: string;
  createdById: string;
}

interface CalendarViewProps {
  events: Event[];
}

export default function CalendarView({ events }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const router = useRouter();

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "public":
        return "🌍";
      case "friends":
        return "👥";
      case "private":
        return "🔒";
      default:
        return "📅";
    }
  };

  // Obtenir le premier jour du mois
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );

  // Obtenir le dernier jour du mois
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );

  // Obtenir le jour de la semaine du premier jour (0 = dimanche, 1 = lundi, etc.)
  const startDayOfWeek = firstDayOfMonth.getDay();
  
  // Ajuster pour que lundi soit le premier jour (0 = lundi, 6 = dimanche)
  const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  // Nombre de jours dans le mois
  const daysInMonth = lastDayOfMonth.getDate();

  // Créer un tableau avec tous les jours du mois
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Créer les cellules vides pour aligner le premier jour
  const emptyDays = Array.from({ length: adjustedStartDay }, (_, i) => i);

  // Grouper les événements par date
  const eventsByDate: { [key: string]: Event[] } = {};
  for (const event of events) {
    const eventDate = new Date(event.date);
    const dateKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push(event);
  }

  const getEventsForDay = (day: number): Event[] => {
    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
    return eventsByDate[dateKey] || [];
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthName = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(currentDate);

  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const handleDayDoubleClick = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    router.push(`/events/new?date=${dateString}`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
      {/* Header du calendrier */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 capitalize">
          {monthName}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
          >
            Aujourd'hui
          </button>
          <button
            onClick={previousMonth}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            ←
          </button>
          <button
            onClick={nextMonth}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            →
          </button>
        </div>
      </div>

      {/* Grille du calendrier */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {/* Noms des jours */}
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-gray-600 py-2 text-xs md:text-sm"
          >
            {day}
          </div>
        ))}

        {/* Cellules vides pour aligner le premier jour */}
        {emptyDays.map((emptyIndex) => (
          <div key={`empty-${firstDayOfMonth.getTime()}-${emptyIndex}`} className="min-h-[80px] md:min-h-[120px]" />
        ))}

        {/* Jours du mois */}
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const today = isToday(day);

          return (
            <div
              key={day}
              role="button"
              tabIndex={0}
              onDoubleClick={() => handleDayDoubleClick(day)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleDayDoubleClick(day);
                }
              }}
              className={`min-h-[80px] md:min-h-[120px] border rounded-lg p-1 md:p-2 cursor-pointer ${
                today
                  ? "bg-blue-50 border-blue-400 border-2"
                  : "bg-gray-50 border-gray-200"
              } hover:shadow-md transition`}
            >
              <div
                className={`text-sm md:text-base font-semibold mb-1 ${
                  today ? "text-blue-600" : "text-gray-700"
                }`}
              >
                {day}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block text-xs bg-white rounded px-1.5 py-1 hover:bg-gray-100 transition border-l-2 border-purple-500"
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-[10px]">
                        {getVisibilityIcon(event.visibility)}
                      </span>
                      <span className="truncate font-medium text-gray-800">
                        {event.title}
                      </span>
                    </div>
                    {event.location && (
                      <div className="text-[10px] text-gray-600 truncate mt-0.5">
                        📍 {event.location}
                      </div>
                    )}
                  </Link>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-gray-500 font-medium px-1.5">
                    +{dayEvents.length - 3} autre{dayEvents.length - 3 > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>🌍</span>
            <span>Public</span>
          </div>
          <div className="flex items-center gap-2">
            <span>👥</span>
            <span>Amis</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🔒</span>
            <span>Privé</span>
          </div>
        </div>
      </div>
    </div>
  );
}
