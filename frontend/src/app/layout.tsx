import type { Metadata, Viewport } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import ThemeToggle from '@/components/ThemeToggle';
import Script from 'next/script';

// Main UI font - Nunito (used everywhere except school name)
const nunito = Nunito({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1E3A5F',
};

export const metadata: Metadata = {
  title: 'Jesus Junior Academy - Digital Campus',
  description: 'Enter your digital campus. Experience education differently.',
  keywords: ['school', 'campus', 'education', 'Jesus Junior Academy'],
  authors: [{ name: 'Jesus Junior Academy' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'JJA Campus',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={nunito.variable} suppressHydrationWarning>
      <body className={nunito.className}>
        {/* Anti-FOUC script to set theme before paint */}
        <Script id="theme-script" strategy="beforeInteractive">
          {`
            (function() {
              try {
                var localTheme = localStorage.getItem('theme');
                var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                var theme = localTheme || systemTheme;
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            })();
          `}
        </Script>
        <ServiceWorkerRegistration />
        {children}
        <ThemeToggle />
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
