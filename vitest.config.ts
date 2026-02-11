import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/__tests__/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      include: ['lib/**', 'app/api/**', 'components/**', 'app/components/**'],
      exclude: ['**/__tests__/**', '**/*.d.ts', 'node_modules/**', '.next/**'],
    },
  },
});
