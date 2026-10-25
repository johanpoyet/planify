import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';
import ConditionalNav from './components/ConditionalNav';
import BodyWrapper from './components/BodyWrapper';
import DesktopNav from './components/DesktopNav';

export const metadata: Metadata = {
  title: 'Planify - Planification d\'événements',
  description: 'Application de planification d\'événements avec calendrier partagé',
  manifest: '/manifest.json',
  themeColor: '#7e22ce',
  viewport: 'minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
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
      <body>
        <Providers>
          <DesktopNav />
          <BodyWrapper>
            {children}
          </BodyWrapper>
          <ConditionalNav />
        </Providers>
        {/* Mesure d'audience Umami (auto-hébergée, sans cookie), seulement sur le domaine de prod. */}
        <Script
          src="https://stats.johanpoyet.fr/script.js"
          data-website-id="4fd2f43a-381e-46d6-9311-b380595fa2a1"
          data-domains="planify.johanpoyet.fr"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
