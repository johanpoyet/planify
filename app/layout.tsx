import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import ConditionalNav from './components/ConditionalNav';
import BodyWrapper from './components/BodyWrapper';
import DesktopNav from './components/DesktopNav';

// Police du logo (nom « Planify »), exposee via --font-brand.
const brandFont = DM_Sans({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-brand',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Planify - Planification d\'événements',
  description: 'Application de planification d\'événements avec calendrier partagé',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Planify',
  },
};

export const viewport: Viewport = {
  themeColor: '#7454F5',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={brandFont.variable}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        {/* Masque la zone de la barre d'etat iOS en mode PWA plein ecran. */}
        <div className="status-bar-backdrop" aria-hidden="true" />
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
