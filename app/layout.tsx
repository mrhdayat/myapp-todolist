import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegistrar } from '@/components/features/PwaRegistrar';

export const metadata: Metadata = {
  title: 'Daily Focus — Neumorphism Modern Task Manager',
  description: 'Daily to-do and focus management app with warm porcelain neumorphic tactile design, 4 customizable themes, high-contrast accents, and offline support.',
  keywords: ['todo', 'daily focus', 'productivity', 'neumorphism', 'task manager', 'offline pwa'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Daily Focus',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    shortcut: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EDE7DC' },
    { media: '(prefers-color-scheme: dark)', color: '#221E19' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" data-theme="warm-clay" suppressHydrationWarning>
      <head>
        {/* Preconnect to Font CDNs */}
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Fontshare Clash Display & General Sans */}
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700&f[]=general-sans@400,500,600,700&display=swap"
        />

        {/* Google Fonts IBM Plex Mono */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
        />

        {/* Inline Theme Init Script to eliminate Flash of Unstyled Theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('daily-focus-settings');
                  let palette = 'warm-clay';
                  let mode = 'light';
                  let isReduceMotion = false;
                  if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed.themePalette) palette = parsed.themePalette;
                    if (parsed.themeMode) mode = parsed.themeMode;
                    else if (parsed.theme === 'dark') mode = 'dark';
                    if (parsed.reducedMotion) isReduceMotion = true;
                  }
                  const dataTheme = mode === 'dark' ? (palette + '-dark') : palette;
                  document.documentElement.setAttribute('data-theme', dataTheme);
                  if (isReduceMotion) {
                    document.documentElement.classList.add('reduce-motion');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-base text-text-primary antialiased min-h-screen overflow-x-hidden">
        {children}
        <PwaRegistrar />
      </body>
    </html>
  );
}
