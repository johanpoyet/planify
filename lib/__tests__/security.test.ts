import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MAX_ATTEMPTS,
  clearAttempts,
  isRateLimited,
  logSecurityEvent,
  maskEmail,
  recordFailedAttempt,
  resetRateLimiter,
  validatePassword,
} from '../security';

describe('security.ts - politique de mot de passe', () => {
  it('refuse un mot de passe trop court', () => {
    const r = validatePassword('Abc12345');
    expect(r.valid).toBe(false);
    expect(r.reason).toContain('12');
  });

  it('refuse un mot de passe sans majuscule', () => {
    expect(validatePassword('motdepasse123').valid).toBe(false);
  });

  it('refuse un mot de passe sans chiffre', () => {
    expect(validatePassword('MotDePasseSansChiffre').valid).toBe(false);
  });

  it('accepte un mot de passe conforme', () => {
    expect(validatePassword('Planify2026Test').valid).toBe(true);
  });
});

describe('security.ts - limitation des tentatives', () => {
  beforeEach(() => {
    resetRateLimiter();
  });

  it('autorise les tentatives sous le seuil', () => {
    for (let i = 0; i < MAX_ATTEMPTS - 1; i++) {
      recordFailedAttempt('cle');
    }
    expect(isRateLimited('cle').limited).toBe(false);
  });

  it('bloque au-dela du seuil autorise', () => {
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      recordFailedAttempt('cle');
    }
    const r = isRateLimited('cle');
    expect(r.limited).toBe(true);
    expect(r.retryAfterMs).toBeGreaterThan(0);
  });

  it('remet le compteur a zero apres une authentification reussie', () => {
    for (let i = 0; i < MAX_ATTEMPTS - 1; i++) {
      recordFailedAttempt('cle');
    }
    clearAttempts('cle');
    for (let i = 0; i < MAX_ATTEMPTS - 1; i++) {
      recordFailedAttempt('cle');
    }
    expect(isRateLimited('cle').limited).toBe(false);
  });

  it('isole les cles entre elles', () => {
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      recordFailedAttempt('cle-a');
    }
    expect(isRateLimited('cle-a').limited).toBe(true);
    expect(isRateLimited('cle-b').limited).toBe(false);
  });
});

describe('security.ts - journalisation', () => {
  it('masque l adresse e-mail sans perdre le domaine', () => {
    const masque = maskEmail('camille.dubois@example.com');
    expect(masque.startsWith('c')).toBe(true);
    expect(masque.endsWith('@example.com')).toBe(true);
    expect(masque).not.toContain('amille.dubois');
  });

  it('n expose jamais l adresse complete dans le journal', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logSecurityEvent('login_failure', { email: maskEmail('thomas.martin@example.com') });
    const ligne = spy.mock.calls[0][0] as string;
    expect(ligne).toContain('SECURITY');
    expect(ligne).toContain('login_failure');
    expect(ligne).not.toContain('thomas.martin@example.com');
    spy.mockRestore();
  });
});
