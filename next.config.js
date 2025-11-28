/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configuration Turbopack pour Next.js 16
  turbopack: {},
  // Désactiver la génération de pages statiques pour éviter les problèmes de cache
  output: 'standalone',
  // Désactiver complètement l'optimisation CSS
  experimental: {
    optimizeCss: false,
  },
  // Désactiver le cache en développement
  onDemandEntries: {
    maxInactiveAge: 0,
    pagesBufferLength: 0,
  },
  // Désactiver la génération de buildId statique
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  // Assurer que les fichiers publics sont bien servis
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
      {
        // Forcer le no-cache pour les fichiers CSS et JS de Next.js
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        // Désactiver le cache pour tous les fichiers
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
