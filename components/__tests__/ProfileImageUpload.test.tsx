import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfileImageUpload from '../ProfileImageUpload';
import { ThemeProvider } from '@/lib/themeContext';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: {
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
      },
    },
  })),
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

describe('ProfileImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockReset();
  });

  it('should render with placeholder when no image is provided', () => {
    const onImageUpdate = vi.fn();

    renderWithTheme(
      <ProfileImageUpload currentImageUrl={null} onImageUpdate={onImageUpdate} />
    );

    // Devrait afficher la première lettre du nom
    expect(screen.getByText('T')).toBeInTheDocument();
    expect(screen.getByText('Ajouter une photo')).toBeInTheDocument();
  });

  it('should render with current image when provided', () => {
    const onImageUpdate = vi.fn();
    const imageUrl = '/uploads/profiles/test.jpg';

    renderWithTheme(
      <ProfileImageUpload currentImageUrl={imageUrl} onImageUpdate={onImageUpdate} />
    );

    const img = screen.getByAltText('Profil');
    expect(img).toHaveAttribute('src', imageUrl);
    expect(screen.getByText('Modifier la photo')).toBeInTheDocument();
  });

  it('should show delete button only when image exists', () => {
    const onImageUpdate = vi.fn();

    const { rerender } = renderWithTheme(
      <ProfileImageUpload currentImageUrl={null} onImageUpdate={onImageUpdate} />
    );

    expect(screen.queryByText('Supprimer')).not.toBeInTheDocument();

    rerender(
      <ThemeProvider>
        <ProfileImageUpload currentImageUrl="/uploads/profiles/test.jpg" onImageUpdate={onImageUpdate} />
      </ThemeProvider>
    );

    expect(screen.getByText('Supprimer')).toBeInTheDocument();
  });

  it('should show error when file type is invalid', async () => {
    const onImageUpdate = vi.fn();

    renderWithTheme(
      <ProfileImageUpload currentImageUrl={null} onImageUpdate={onImageUpdate} />
    );

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText(/Type de fichier invalide/i)).toBeInTheDocument();
      });
    }
  });

  it('should show error when file size exceeds limit', async () => {
    const onImageUpdate = vi.fn();

    renderWithTheme(
      <ProfileImageUpload currentImageUrl={null} onImageUpdate={onImageUpdate} />
    );

    // Créer un fichier de 6MB (dépasse la limite de 5MB)
    const largeContent = new Array(6 * 1024 * 1024).fill('a').join('');
    const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText(/Fichier trop volumineux/i)).toBeInTheDocument();
      });
    }
  });

  it('should upload image successfully', async () => {
    const onImageUpdate = vi.fn();
    const newImageUrl = '/uploads/profiles/new-image.jpg';

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { profileImageUrl: newImageUrl } }),
    });

    renderWithTheme(
      <ProfileImageUpload currentImageUrl={null} onImageUpdate={onImageUpdate} />
    );

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/user/profile-image', {
          method: 'POST',
          body: expect.any(FormData),
        });
        expect(onImageUpdate).toHaveBeenCalledWith(newImageUrl);
      });
    }
  });

  it('should show delete confirmation modal and delete image', async () => {
    const onImageUpdate = vi.fn();
    const imageUrl = '/uploads/profiles/test.jpg';

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    renderWithTheme(
      <ProfileImageUpload currentImageUrl={imageUrl} onImageUpdate={onImageUpdate} />
    );

    // Cliquer sur supprimer
    const deleteButton = screen.getByText('Supprimer');
    fireEvent.click(deleteButton);

    // Modal de confirmation devrait apparaître
    await waitFor(() => {
      expect(screen.getByText('Supprimer la photo de profil')).toBeInTheDocument();
    });

    // Confirmer la suppression
    const confirmButton = screen.getAllByText('Supprimer').find(btn => 
      btn.closest('button')?.type === 'button'
    );
    
    if (confirmButton) {
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/user/profile-image', {
          method: 'DELETE',
        });
        expect(onImageUpdate).toHaveBeenCalledWith(null);
      });
    }
  });

  it('should handle upload error from server', async () => {
    const onImageUpdate = vi.fn();

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Erreur serveur' }),
    });

    renderWithTheme(
      <ProfileImageUpload currentImageUrl={null} onImageUpdate={onImageUpdate} />
    );

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('Erreur serveur')).toBeInTheDocument();
      });
    }
  });
});
