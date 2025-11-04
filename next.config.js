/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configuration Turbopack pour Next.js 16
  turbopack: {},
};

// Pour activer PWA plus tard, décommentez les lignes ci-dessous
// et installez @ducanh2912/next-pwa (compatible Next.js 15+)
/*
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA(nextConfig);
*/

module.exports = nextConfig;
