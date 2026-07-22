// Configuration ESLint 9 (format « flat config »).
// `next lint` ayant été retiré de Next.js 16, l'analyse statique est lancée
// directement via ESLint : `npm run lint`.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'coverage/**',
      'public/**',
      'dossier/**',
      'next-env.d.ts',
      '**/*.config.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        // Environnements navigateur + Node utilisés par l'application.
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        process: 'readonly',
        localStorage: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Notification: 'readonly',
        ServiceWorkerRegistration: 'readonly',
        PushSubscription: 'readonly',
      },
    },
    rules: {
      // Le projet utilise volontairement `any` sur les frontières non typées
      // (mocks de test, payloads externes) : signalé sans bloquer le build.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Scripts d'outillage Node exécutés en CommonJS.
    files: ['scripts/**/*.js'],
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'writable',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'writable',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  }
);
