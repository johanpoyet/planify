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

    const spinner = document.querySelector('.animate-spin');
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
      expect(screen.getByText('Voter')).toBeInTheDocument();
    });

    // Sélectionner une option
    const parisOption = screen.getByLabelText('Paris');
    fireEvent.click(parisOption);

    // Voter
    const voteButton = screen.getByText('Voter');
    fireEvent.click(voteButton);

    await waitFor(() => {
      expect(screen.getByText(/Vote enregistré avec succès/i)).toBeInTheDocument();
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

    const parisOption = screen.getByLabelText('Paris') as HTMLInputElement;
    expect(parisOption.checked).toBe(true);
    expect(parisOption.disabled).toBe(true);
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

    const parisOption = screen.getByLabelText('Paris') as HTMLInputElement;
    expect(parisOption.disabled).toBe(false);
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
    const lyonOption = screen.getByLabelText('Lyon');
    fireEvent.click(lyonOption);

    // Annuler
    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      const parisOption = screen.getByLabelText('Paris') as HTMLInputElement;
      expect(parisOption.checked).toBe(true);
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
      expect(screen.getByText('Voter')).toBeInTheDocument();
    });

    const parisOption = screen.getByLabelText('Paris');
    fireEvent.click(parisOption);

    const voteButton = screen.getByText('Voter');
    fireEvent.click(voteButton);

    await waitFor(() => {
      expect(screen.getByText('Erreur serveur')).toBeInTheDocument();
    });
  });
});
