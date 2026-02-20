import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EventCard from '../EventCard';

describe('EventCard', () => {
  it('should render event title and date', () => {
    render(
      <EventCard
        id="evt-1"
        title="Réunion d'équipe"
        date="2024-06-15T14:00:00Z"
      />
    );

    expect(screen.getByText('Réunion d\'équipe')).toBeInTheDocument();
    expect(screen.getByText('15/06/2024')).toBeInTheDocument();
  });

  it('should render event description when provided', () => {
    render(
      <EventCard
        id="evt-2"
        title="Déjeuner"
        description="Rendez-vous au restaurant italien"
        date="2024-06-20T12:00:00Z"
      />
    );

    expect(screen.getByText('Rendez-vous au restaurant italien')).toBeInTheDocument();
  });

  it('should not render description when not provided', () => {
    const { container } = render(
      <EventCard
        id="evt-3"
        title="Conférence"
        date="2024-07-01T09:00:00Z"
      />
    );

    const description = container.querySelector('p.text-gray-600');
    expect(description).not.toBeInTheDocument();
  });

  it('should render link to event details with correct href', () => {
    render(
      <EventCard
        id="evt-123"
        title="Formation"
        date="2024-08-10T10:00:00Z"
      />
    );

    const link = screen.getByText('Voir détails →');
    expect(link).toHaveAttribute('href', '/events/evt-123');
  });
});
