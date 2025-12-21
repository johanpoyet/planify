/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // CORRECTIF: Retirer 'output: standalone' car incompatible avec 'next start'
  // Pour utiliser standalone, vous devez démarrer avec: node .next/standalone/server.js
  // Pour utiliser 'next start', ne pas définir output ou utiliser output: 'export' pour static
  // output: 'standalone',

  // Optimisations mémoire
  experimental: {
    // Désactiver le préchargement des pages pour économiser la mémoire
    optimizePackageImports: ['@/components', '@/lib'],
  },

  // Réduire la taille du bundle
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Headers pour le Service Worker uniquement
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
