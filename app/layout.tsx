import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import MobileBottomNav from './components/MobileBottomNav';

export const metadata: Metadata = {
  title: 'Planify - Planification d\'événements',
  description: 'Application de planification d\'événements avec calendrier partagé',
  manifest: '/manifest.json',
  themeColor: '#0ea5e9',
  viewport: 'minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Planify',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="pb-20 md:pb-0">
        <Providers>
          {children}
          <MobileBottomNav />
          <PWAInstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
