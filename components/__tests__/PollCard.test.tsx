import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PollCard from '../PollCard';
import { ThemeProvider } from '@/lib/themeContext';
import { useSession } from 'next-auth/react';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
};

// Les options sont rendues comme des <button> : cet utilitaire renvoie le bouton
// correspondant au libellé, et permet de tester son état de sélection.
const optionButton = (label: string) =>
  screen.getAllByText(label)[0].closest('button') as HTMLButtonElement;

const isOptionSelected = (btn: HTMLButtonElement) =>
  btn.style.background.includes('accent-soft');

const isOptionEditable = (btn: HTMLButtonElement) => btn.style.cursor === 'pointer';

describe('PollCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockReset();
    (useSession as any).mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
        },
      },
    });
  });

  it('should show loading state initially', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {}));

    renderWithTheme(<PollCard pollId="poll-1" />);

    const spinner = document.querySelector('svg');
    expect(spinner).toBeInTheDocument();
  });

  it('should show error message when poll not found', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({}),
    });

    renderWithTheme(<PollCard pollId="poll-invalid" />);

    await waitFor(() => {
      expect(screen.getByText('Sondage introuvable')).toBeInTheDocument();
    });
  });

  it('should render poll with question and options', async () => {
    const mockPollData = {
      poll: {
        id: 'poll-1',
        question: 'Où se retrouver ?',
        deadline: null,
      },
      options: [
        { id: 'opt-1', text: 'Paris' },
        { id: 'opt-2', text: 'Lyon' },
      ],
      votes: [],
    };

    (global.fetch as any)
      .mockResolvedValueOnce({ json: async () => mockPollData })
      .mockResolvedValueOnce({ json: async () => ({ id: 'user-1' }) });

    renderWithTheme(<PollCard pollId="poll-1" />);

    await waitFor(() => {
      expect(screen.getByText('Où se retrouver ?')).toBeInTheDocument();
      expect(screen.getByText('Paris')).toBeInTheDocument();
      expect(screen.getByText('Lyon')).toBeInTheDocument();
    });
  });

  it('should allow voting when user has not voted yet', async () => {
    const mockPollData = {
      poll: {
        id: 'poll-1',
        question: 'Où se retrouver ?',
      },
      options: [
        { id: 'opt-1', text: 'Paris' },
        { id: 'opt-2', text: 'Lyon' },
      ],
      votes: [],
    };

    (global.fetch as any)
      .mockResolvedValueOnce({ json: async () => mockPollData })
      .mockResolvedValueOnce({ json: async () => ({ id: 'user-1' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
      .mockResolvedValueOnce({ json: async () => mockPollData });

    renderWithTheme(<PollCard pollId="poll-1" />);

    await waitFor(() => {
      expect(screen.getByText('Confirmer mon vote')).toBeInTheDocument();
    });

    // Sélectionner une option
    fireEvent.click(optionButton('Paris'));

    // Voter
    const voteButton = screen.getByText('Confirmer mon vote');
    fireEvent.click(voteButton);

    await waitFor(() => {
      expect(screen.getByText(/Vote enregistré/i)).toBeInTheDocument();
    });
  });

  it('should show current vote in read mode', async () => {
    const mockPollData = {
      poll: {
        id: 'poll-1',
        question: 'Où se retrouver ?',
      },
      options: [
        { id: 'opt-1', text: 'Paris' },
        { id: 'opt-2', text: 'Lyon' },
      ],
      votes: [
        { userId: 'user-1', optionId: 'opt-1' },
      ],
    };

    (global.fetch as any)
      .mockResolvedValueOnce({ json: async () => mockPollData })
      .mockResolvedValueOnce({ json: async () => ({ id: 'user-1' }) });

    renderWithTheme(<PollCard pollId="poll-1" />);

    await waitFor(() => {
      expect(screen.getByText('Modifier mon vote')).toBeInTheDocument();
    });

    const paris = optionButton('Paris');
    expect(isOptionSelected(paris)).toBe(true);
    // Hors mode édition, l'option n'est pas interactive.
    expect(isOptionEditable(paris)).toBe(false);
  });

  it('should enable editing mode when "Modifier mon vote" is clicked', async () => {
    const mockPollData = {
      poll: {
        id: 'poll-1',
        question: 'Où se retrouver ?',
      },
      options: [
        { id: 'opt-1', text: 'Paris' },
        { id: 'opt-2', text: 'Lyon' },
      ],
      votes: [
        { userId: 'user-1', optionId: 'opt-1' },
      ],
    };

    (global.fetch as any)
      .mockResolvedValueOnce({ json: async () => mockPollData })
      .mockResolvedValueOnce({ json: async () => ({ id: 'user-1' }) });

    renderWithTheme(<PollCard pollId="poll-1" />);

    await waitFor(() => {
      expect(screen.getByText('Modifier mon vote')).toBeInTheDocument();
    });

    const editButton = screen.getByText('Modifier mon vote');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Valider la modification')).toBeInTheDocument();
      expect(screen.getByText('Annuler')).toBeInTheDocument();
    });

    expect(isOptionEditable(optionButton('Paris'))).toBe(true);
  });

  it('should cancel editing and restore previous selection', async () => {
    const mockPollData = {
      poll: {
        id: 'poll-1',
        question: 'Où se retrouver ?',
      },
      options: [
        { id: 'opt-1', text: 'Paris' },
        { id: 'opt-2', text: 'Lyon' },
      ],
      votes: [
        { userId: 'user-1', optionId: 'opt-1' },
      ],
    };

    (global.fetch as any)
      .mockResolvedValueOnce({ json: async () => mockPollData })
      .mockResolvedValueOnce({ json: async () => ({ id: 'user-1' }) });

    renderWithTheme(<PollCard pollId="poll-1" />);

    await waitFor(() => {
      expect(screen.getByText('Modifier mon vote')).toBeInTheDocument();
    });

    // Activer le mode édition
    const editButton = screen.getByText('Modifier mon vote');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Annuler')).toBeInTheDocument();
    });

    // Changer la sélection
    fireEvent.click(optionButton('Lyon'));

    // Annuler
    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(isOptionSelected(optionButton('Paris'))).toBe(true);
      expect(screen.getByText('Modifier mon vote')).toBeInTheDocument();
    });
  });

  it('should show error message when voting fails', async () => {
    const mockPollData = {
      poll: {
        id: 'poll-1',
        question: 'Où se retrouver ?',
      },
      options: [
        { id: 'opt-1', text: 'Paris' },
      ],
      votes: [],
    };

    (global.fetch as any)
      .mockResolvedValueOnce({ json: async () => mockPollData })
      .mockResolvedValueOnce({ json: async () => ({ id: 'user-1' }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Erreur serveur' }) });

    renderWithTheme(<PollCard pollId="poll-1" />);

    await waitFor(() => {
      expect(screen.getByText('Confirmer mon vote')).toBeInTheDocument();
    });

    fireEvent.click(optionButton('Paris'));

    const voteButton = screen.getByText('Confirmer mon vote');
    fireEvent.click(voteButton);

    await waitFor(() => {
      expect(screen.getByText('Erreur serveur')).toBeInTheDocument();
    });
  });
});
