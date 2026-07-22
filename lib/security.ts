/**
 * Mesures de securite transverses : limitation des tentatives d'authentification,
 * politique de mot de passe et journalisation des evenements de securite.
 *
 * Limite connue : le compteur de tentatives est conserve en memoire du processus.
 * L'application s'executant en instance unique (PM2, mode fork), cela suffit ;
 * une mise a l'echelle sur plusieurs instances imposerait un magasin partage.
 */

// ---------------------------------------------------------------------------
// Journalisation des evenements de securite
// ---------------------------------------------------------------------------

export type SecurityEvent =
  | 'login_success'
  | 'login_failure'
  | 'login_blocked'
  | 'account_created'
  | 'password_rejected'
  | 'forbidden_path';

/**
 * Les journaux de securite ne doivent jamais contenir de secret. L'adresse
 * e-mail est reduite a sa premiere lettre et son domaine, ce qui permet de
 * correler des tentatives sans exposer l'identite complete.
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const head = local.slice(0, 1);
  return `${head}${'*'.repeat(Math.max(local.length - 1, 1))}@${domain}`;
}

export function logSecurityEvent(
  event: SecurityEvent,
  details: Record<string, string | number | undefined> = {}
): void {
  const entry = {
    ts: new Date().toISOString(),
    channel: 'security',
    event,
    ...details,
  };
  // Prefixe stable : permet de filtrer les evenements de securite dans les
  // journaux PM2 (grep SECURITY) ou de les rediriger vers un collecteur.
  console.warn(`SECURITY ${JSON.stringify(entry)}`);
}

// ---------------------------------------------------------------------------
// Politique de mot de passe
// ---------------------------------------------------------------------------

export const PASSWORD_MIN_LENGTH = 12;

// Type volontairement plat plutot qu'union discriminee : le projet compile avec
// `strict: false`, qui n'affine pas les unions.
export type PasswordCheck = { valid: boolean; reason?: string };

/**
 * Exige 12 caracteres minimum et trois classes de caracteres (minuscule,
 * majuscule, chiffre), conformement aux recommandations de l'ANSSI pour un
 * compte protege par un unique facteur.
 */
export function validatePassword(password: string): PasswordCheck {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      reason: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caracteres.`,
    };
  }
  const classes = [/[a-z]/, /[A-Z]/, /\d/];
  if (!classes.every((r) => r.test(password))) {
    return {
      valid: false,
      reason:
        'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre.',
    };
  }
  return { valid: true };
}

// ---------------------------------------------------------------------------
// Limitation des tentatives d'authentification
// ---------------------------------------------------------------------------

export const MAX_ATTEMPTS = 5;
export const WINDOW_MS = 15 * 60 * 1000; // fenetre d'observation
export const LOCK_MS = 15 * 60 * 1000; // duree de blocage

type Bucket = { count: number; firstAttempt: number; lockedUntil?: number };

const buckets = new Map<string, Bucket>();

/** Nettoie les compteurs expires afin de borner l'occupation memoire. */
function purge(now: number): void {
  for (const [key, b] of buckets) {
    const expired = now - b.firstAttempt > WINDOW_MS;
    const unlocked = !b.lockedUntil || b.lockedUntil < now;
    if (expired && unlocked) buckets.delete(key);
  }
}

export function isRateLimited(key: string): { limited: boolean; retryAfterMs: number } {
  const now = Date.now();
  purge(now);
  const b = buckets.get(key);
  if (b?.lockedUntil && b.lockedUntil > now) {
    return { limited: true, retryAfterMs: b.lockedUntil - now };
  }
  return { limited: false, retryAfterMs: 0 };
}

/** Enregistre un echec et verrouille la cle au-dela du seuil autorise. */
export function recordFailedAttempt(key: string): { locked: boolean; remaining: number } {
  const now = Date.now();
  purge(now);
  const b = buckets.get(key);

  if (!b || now - b.firstAttempt > WINDOW_MS) {
    buckets.set(key, { count: 1, firstAttempt: now });
    return { locked: false, remaining: MAX_ATTEMPTS - 1 };
  }

  b.count += 1;
  if (b.count >= MAX_ATTEMPTS) {
    b.lockedUntil = now + LOCK_MS;
    return { locked: true, remaining: 0 };
  }
  return { locked: false, remaining: MAX_ATTEMPTS - b.count };
}

/** Remet le compteur a zero apres une authentification reussie. */
export function clearAttempts(key: string): void {
  buckets.delete(key);
}

/** Reinitialisation complete : reservee aux tests. */
export function resetRateLimiter(): void {
  buckets.clear();
}
