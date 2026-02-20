import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConfirmModal from '../ConfirmModal';
import { ThemeProvider } from '@/lib/themeContext';

const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
};

describe('ConfirmModal', () => {
  it('should not render when isOpen is false', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    renderWithTheme(
      <ConfirmModal isOpen={false} onConfirm={onConfirm} onCancel={onCancel} />
    );

    expect(screen.queryByText('Confirmer')).not.toBeInTheDocument();
  });

  it('should render with default props when isOpen is true', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    renderWithTheme(
      <ConfirmModal isOpen={true} onConfirm={onConfirm} onCancel={onCancel} />
    );

    expect(screen.getByText('Confirmer')).toBeInTheDocument();
    expect(screen.getByText('Annuler')).toBeInTheDocument();
    expect(screen.getByText('Oui')).toBeInTheDocument();
  });

  it('should call onCancel when overlay is clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    renderWithTheme(
      <ConfirmModal isOpen={true} onConfirm={onConfirm} onCancel={onCancel} />
    );

    const overlay = screen.getByLabelText('Fermer la fenêtre');
    fireEvent.click(overlay);

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('should call onCancel when Escape key is pressed on overlay', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    renderWithTheme(
      <ConfirmModal isOpen={true} onConfirm={onConfirm} onCancel={onCancel} />
    );

    const overlay = screen.getByLabelText('Fermer la fenêtre');
    fireEvent.keyDown(overlay, { key: 'Escape' });

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('should call onCancel when Enter key is pressed on overlay', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    renderWithTheme(
      <ConfirmModal isOpen={true} onConfirm={onConfirm} onCancel={onCancel} />
    );

    const overlay = screen.getByLabelText('Fermer la fenêtre');
    fireEvent.keyDown(overlay, { key: 'Enter' });

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('should display loading state and disable confirm button', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    renderWithTheme(
      <ConfirmModal
        isOpen={true}
        loading={true}
        loadingLabel="Suppression..."
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const confirmButton = screen.getByText('Suppression...');
    expect(confirmButton).toBeDisabled();
    expect(confirmButton).toHaveStyle({ backgroundColor: '#475569' });
  });

  it('should render custom title, description, and button labels', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    renderWithTheme(
      <ConfirmModal
        isOpen={true}
        title="Supprimer l'événement"
        description="Cette action est irréversible."
        confirmLabel="Supprimer"
        cancelLabel="Retour"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText("Supprimer l'événement")).toBeInTheDocument();
    expect(screen.getByText('Cette action est irréversible.')).toBeInTheDocument();
    expect(screen.getByText('Supprimer')).toBeInTheDocument();
    expect(screen.getByText('Retour')).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    renderWithTheme(
      <ConfirmModal isOpen={true} onConfirm={onConfirm} onCancel={onCancel} />
    );

    const confirmButton = screen.getByText('Oui');
    fireEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
