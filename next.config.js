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

  // En-têtes HTTP : sécurité globale + cas particuliers du Service Worker
  async headers() {
    return [
      {
        // En-têtes de sécurité appliqués à toutes les réponses (OWASP A05).
        source: '/:path*',
        headers: [
          {
            // Politique de sécurité du contenu.
            // Limite assumée : script-src conserve 'unsafe-inline' car Next.js
            // injecte la charge d'hydratation dans des scripts en ligne. Un nonce
            // imposerait un rendu dynamique de toutes les pages, y compris celles
            // qui sont aujourd'hui prérendues. Les autres directives restent
            // strictes et bloquent l'injection de balise <base>, l'inclusion dans
            // une iframe, le détournement de formulaire et les greffons.
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "worker-src 'self'",
              "manifest-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
              'upgrade-insecure-requests',
            ].join('; '),
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
        ],
      },
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
