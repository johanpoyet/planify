/**
 * Génère un ObjectID MongoDB valide (24 caractères hexadécimaux)
 * Utile pour les tests qui utilisent Prisma avec MongoDB
 */
export function generateObjectId(seed?: string): string {
  // Si un seed est fourni, on génère un ID déterministe basé sur ce seed
  if (seed) {
    // Prendre les premiers caractères du seed et les répéter/padder pour faire 24 chars
    const sanitized = seed.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const padded = sanitized.padEnd(24, '0').slice(0, 24);
    // S'assurer que c'est du hex valide
    return padded.replace(/[g-z]/g, 'a');
  }
  
  // Sinon, générer un ID aléatoire valide
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = Array.from({ length: 16 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  return timestamp + random;
}

/**
 * IDs prédéfinis pour les tests (déterministes et valides)
 */
export const TEST_IDS = {
  user1: '507f1f77bcf86cd799439011',
  user2: '507f1f77bcf86cd799439012',
  user3: '507f1f77bcf86cd799439013',
  event1: '507f1f77bcf86cd799439021',
  event2: '507f1f77bcf86cd799439022',
  event3: '507f1f77bcf86cd799439023',
  eventType1: '507f1f77bcf86cd799439031',
  eventType2: '507f1f77bcf86cd799439032',
  friend1: '507f1f77bcf86cd799439041',
  friend2: '507f1f77bcf86cd799439042',
  poll1: '507f1f77bcf86cd799439051',
  poll2: '507f1f77bcf86cd799439052',
  pollOption1: '507f1f77bcf86cd799439061',
  pollOption2: '507f1f77bcf86cd799439062',
  pollOption3: '507f1f77bcf86cd799439063',
  pollVote1: '507f1f77bcf86cd799439071',
  notification1: '507f1f77bcf86cd799439081',
  participant1: '507f1f77bcf86cd799439091',
  participant2: '507f1f77bcf86cd799439092',
  subscription1: '507f1f77bcf86cd7994390a1',
};
