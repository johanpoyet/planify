import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PollCreator from '../PollCreator';
import { ThemeProvider } from '@/lib/themeContext';

// Mock next/navigation
const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
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

describe('PollCreator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockReset();
  });

  it('should render form with initial empty state', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => [],
    });

    renderWithTheme(<PollCreator />);

    expect(screen.getByLabelText('Question')).toBeInTheDocument();
    expect(screen.getByText('Options')).toBeInTheDocument();
    expect(screen.getByText('Destinataires (amis)')).toBeInTheDocument();
  });

  it('should render initial 2 option inputs', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => [],
    });

    renderWithTheme(<PollCreator />);

    const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
    expect(optionInputs).toHaveLength(2);
  });

  it('should add new option when clicking "Ajouter une option"', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => [],
    });

    renderWithTheme(<PollCreator />);

    const addButton = screen.getByText('Ajouter une option');
    fireEvent.click(addButton);

    await waitFor(() => {
      const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
      expect(optionInputs).toHaveLength(3);
    });
  });

  it('should load and display friends list', async () => {
    const mockFriends = [
      { id: '1', friend: { id: 'friend-1', name: 'Alice', email: 'alice@example.com' } },
      { id: '2', friend: { id: 'friend-2', name: 'Bob', email: 'bob@example.com' } },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockFriends,
    });

    renderWithTheme(<PollCreator />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  it('should show message when no friends found', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => [],
    });

    renderWithTheme(<PollCreator />);

    await waitFor(() => {
      expect(screen.getByText('Aucun ami trouvé')).toBeInTheDocument();
    });
  });

  it('should toggle friend selection', async () => {
    const mockFriends = [
      { id: '1', friend: { id: 'friend-1', name: 'Alice', email: 'alice@example.com' } },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockFriends,
    });

    renderWithTheme(<PollCreator />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    const checkbox = screen.getByLabelText('Alice') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it('should show validation error when form is incomplete', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => [],
    });

    renderWithTheme(<PollCreator />);

    const submitButton = screen.getByText('Créer sondage');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/au moins 2 options et au moins un destinataire requis/i)).toBeInTheDocument();
    });
  });

  it('should create poll successfully and redirect', async () => {
    const mockFriends = [
      { id: '1', friend: { id: 'friend-1', name: 'Alice', email: 'alice@example.com' } },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({ json: async () => mockFriends })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ poll: { id: 'poll-123' } }),
      });

    renderWithTheme(<PollCreator />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    // Remplir le formulaire
    const questionInput = screen.getByLabelText('Question');
    fireEvent.change(questionInput, { target: { value: 'Où se retrouver ?' } });

    const optionInputs = screen.getAllByPlaceholderText(/Option \d+/);
    fireEvent.change(optionInputs[0], { target: { value: 'Paris' } });
    fireEvent.change(optionInputs[1], { target: { value: 'Lyon' } });

    const friendCheckbox = screen.getByLabelText('Alice');
    fireEvent.click(friendCheckbox);

    // Soumettre
    const submitButton = screen.getByText('Créer sondage');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/polls/poll-123');
    });
  });
});
