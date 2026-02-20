import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DateTimePicker from '../DateTimePicker';
import { ThemeProvider } from '@/lib/themeContext';

const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
};

describe('DateTimePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with placeholder when no value is provided', () => {
    const onChange = vi.fn();

    renderWithTheme(
      <DateTimePicker value="" onChange={onChange} />
    );

    expect(screen.getByText('Sélectionner une date et heure')).toBeInTheDocument();
  });

  it('should display formatted date when value is provided', () => {
    const onChange = vi.fn();
    const testDate = '2024-06-15T14:30';

    renderWithTheme(
      <DateTimePicker value={testDate} onChange={onChange} />
    );

    // La date devrait être formatée en français
    expect(screen.getByText(/15 juin 2024/i)).toBeInTheDocument();
  });

  it('should open calendar when clicking on button', () => {
    const onChange = vi.fn();

    renderWithTheme(
      <DateTimePicker value="" onChange={onChange} />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Le calendrier devrait être visible avec les jours de la semaine
    expect(screen.getByText('Lun')).toBeInTheDocument();
    expect(screen.getByText('Mar')).toBeInTheDocument();
    expect(screen.getByText('Mer')).toBeInTheDocument();
  });

  it('should navigate to previous month', async () => {
    const onChange = vi.fn();

    renderWithTheme(
      <DateTimePicker value="" onChange={onChange} />
    );

    // Ouvrir le calendrier
    const button = screen.getByRole('button');
    fireEvent.click(button);

    const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    expect(screen.getByText(currentMonth, { exact: false })).toBeInTheDocument();

    // Cliquer sur le bouton "précédent"
    const prevButtons = screen.getAllByRole('button');
    const prevButton = prevButtons.find(btn => btn.querySelector('path[d*="M15 19l-7-7 7-7"]'));
    
    if (prevButton) {
      fireEvent.click(prevButton);

      await waitFor(() => {
        // Le mois devrait avoir changé
        const previousMonth = new Date();
        previousMonth.setMonth(previousMonth.getMonth() - 1);
        const expectedMonth = previousMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        expect(screen.getByText(expectedMonth, { exact: false })).toBeInTheDocument();
      });
    }
  });

  it('should navigate to next month', async () => {
    const onChange = vi.fn();

    renderWithTheme(
      <DateTimePicker value="" onChange={onChange} />
    );

    // Ouvrir le calendrier
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Cliquer sur le bouton "suivant"
    const nextButtons = screen.getAllByRole('button');
    const nextButton = nextButtons.find(btn => btn.querySelector('path[d*="M9 5l7 7-7 7"]'));
    
    if (nextButton) {
      fireEvent.click(nextButton);

      await waitFor(() => {
        // Le mois devrait avoir changé
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const expectedMonth = nextMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        expect(screen.getByText(expectedMonth, { exact: false })).toBeInTheDocument();
      });
    }
  });

  it('should select a date and call onChange', async () => {
    const onChange = vi.fn();

    renderWithTheme(
      <DateTimePicker value="" onChange={onChange} />
    );

    // Ouvrir le calendrier
    const openButton = screen.getByRole('button');
    fireEvent.click(openButton);

    // Sélectionner le jour 15
    const dayButtons = screen.getAllByRole('button').filter(btn => btn.textContent === '15');
    const dayButton = dayButtons[0];
    
    if (dayButton) {
      fireEvent.click(dayButton);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        // Vérifier que la valeur passée est un format ISO
        const callArg = onChange.mock.calls[0][0];
        expect(callArg).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      });
    }
  });

  it('should update time and call onChange', async () => {
    const onChange = vi.fn();
    const testDate = '2024-06-15T12:00';

    renderWithTheme(
      <DateTimePicker value={testDate} onChange={onChange} />
    );

    // Ouvrir le calendrier
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Trouver le sélecteur d'heure
    const timeInput = screen.getByLabelText('Heure');
    expect(timeInput).toBeInTheDocument();

    fireEvent.change(timeInput, { target: { value: '15:45' } });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
      const callArg = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(callArg).toContain('15:45');
    });
  });

  it('should close calendar when clicking Confirmer button', async () => {
    const onChange = vi.fn();

    renderWithTheme(
      <DateTimePicker value="" onChange={onChange} />
    );

    // Ouvrir le calendrier
    const openButton = screen.getByRole('button');
    fireEvent.click(openButton);

    expect(screen.getByText('Confirmer')).toBeInTheDocument();

    // Cliquer sur Confirmer
    const confirmButton = screen.getByText('Confirmer');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.queryByText('Confirmer')).not.toBeInTheDocument();
    });
  });
});
