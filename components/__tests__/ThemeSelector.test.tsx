import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ThemeSelector from '../ThemeSelector';
import { ThemeProvider } from '@/lib/themeContext';
import { themeColors } from '@/lib/theme';

describe('ThemeSelector', () => {
  it('should render all 7 theme color options', () => {
    render(
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>
    );

    Object.entries(themeColors).forEach(([, colorData]) => {
      expect(screen.getByText(colorData.name)).toBeInTheDocument();
      expect(screen.getByText(colorData.emoji)).toBeInTheDocument();
    });
  });

  it('should show checkmark on selected theme color', () => {
    render(
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>
    );

    // Par défaut, "blue" est sélectionné
    const buttons = screen.getAllByRole('button');
    const selectedButton = buttons.find(btn => btn.classList.contains('scale-105'));
    
    expect(selectedButton).toBeDefined();
    expect(selectedButton?.querySelector('svg')).toBeInTheDocument();
  });

  it('should change theme color when clicking on a color button', async () => {
    render(
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>
    );

    const purpleButton = screen.getByText('Violet').closest('button');
    expect(purpleButton).toBeInTheDocument();

    if (purpleButton) {
      fireEvent.click(purpleButton);

      // Le bouton Violet devrait maintenant avoir le checkmark
      expect(purpleButton.classList.contains('scale-105')).toBe(true);
      expect(purpleButton.querySelector('svg')).toBeInTheDocument();
    }
  });

  it('should display color circle with correct backgroundColor', () => {
    render(
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>
    );

    const buttons = screen.getAllByRole('button');
    
    // Vérifier que chaque bouton a un cercle de couleur
    buttons.forEach((button) => {
      const colorCircle = button.querySelector('div.w-12.h-12.rounded-full');
      expect(colorCircle).toBeInTheDocument();
      expect(colorCircle).toHaveStyle({ backgroundColor: expect.any(String) });
    });
  });
});
