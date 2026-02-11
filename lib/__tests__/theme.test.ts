import { describe, it, expect } from 'vitest';
import { themeColors, defaultThemeColor } from '../theme';

describe('theme', () => {
  const expectedKeys = ['blue', 'purple', 'emerald', 'rose', 'red', 'orange', 'yellow'];
  const requiredProps = ['name', 'primary', 'primaryHover', 'primaryLight', 'ring', 'gradient', 'shadow', 'border', 'emoji'];

  it('contient exactement 7 couleurs', () => {
    expect(Object.keys(themeColors)).toHaveLength(7);
  });

  it('contient les cles attendues', () => {
    expect(Object.keys(themeColors).sort()).toEqual(expectedKeys.sort());
  });

  it.each(expectedKeys)('la couleur "%s" possede toutes les proprietes requises', (key) => {
    const color = themeColors[key as keyof typeof themeColors];
    for (const prop of requiredProps) {
      expect(color).toHaveProperty(prop);
    }
  });

  it('toutes les couleurs primary sont des hex valides', () => {
    const hexRegex = /^#[0-9a-f]{6}$/i;
    for (const color of Object.values(themeColors)) {
      expect(color.primary).toMatch(hexRegex);
      expect(color.primaryHover).toMatch(hexRegex);
      expect(color.primaryLight).toMatch(hexRegex);
    }
  });

  it('defaultThemeColor est "blue"', () => {
    expect(defaultThemeColor).toBe('blue');
  });

  it('defaultThemeColor est une cle valide de themeColors', () => {
    expect(themeColors).toHaveProperty(defaultThemeColor);
  });
});
