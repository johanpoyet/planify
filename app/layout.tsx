import type { Metadata, Viewport } from 'next';
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
  minimumScale: 1,
  userScalable: false,
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
        <Providers>
          <DesktopNav />
          <BodyWrapper>
            {children}
          </BodyWrapper>
          <ConditionalNav />
        </Providers>
      </body>
    </html>
  );
}
