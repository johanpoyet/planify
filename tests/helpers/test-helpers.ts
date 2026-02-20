import { prismaMock } from '../mocks/prisma';
import { TEST_IDS } from './objectid-helper';

/**
 * Mock user par défaut pour les tests
 */
export const mockDefaultUser = {
  id: TEST_IDS.user1,
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashedpassword',
  themeColor: 'blue',
  themeMode: 'dark',
  calendarVisibility: 'friends' as const,
  profileImageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Configure les mocks de base avant chaque test
 * À appeler dans le beforeEach de chaque fichier de test API
 */
export function setupDefaultMocks() {
  // Mock findUnique pour retourner un utilisateur par défaut
  // Utiliser mockResolvedValue pour qu'il persiste entre plusieurs appels
  prismaMock.user.findUnique.mockResolvedValue(mockDefaultUser as any);
}

/**
 * Configure une session mockée avec getServerSession
 * @param email Email de l'utilisateur de la session
 */
export function mockAuthSession(getServerSession: any, email: string = 'test@example.com') {
  return getServerSession.mockResolvedValue({
    user: { email },
  } as any);
}
