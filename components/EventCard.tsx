// Composant pour afficher une carte d'événement
interface EventCardProps {
  title: string;
  description?: string;
  date: string;
  id: string;
}

export default function EventCard({ title, description, date, id }: EventCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 mb-4 line-clamp-2">
          {description}
        </p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {new Date(date).toLocaleDateString('fr-FR')}
        </span>
        <a
          href={`/events/${id}`}
          className="text-primary-600 hover:text-primary-700 font-medium text-sm"
        >
          Voir détails →
        </a>
      </div>
    </div>
  );
}
