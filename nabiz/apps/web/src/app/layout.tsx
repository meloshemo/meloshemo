import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Nabız — Türkiye şu anda neyi seçiyor?', template: '%s · Nabız' },
  description:
    'Türkiye’nin tercihlerini canlı olarak gösteren platform. Üyelik yok, tek dokunuşla oy, anında sonuç.',
  openGraph: { type: 'website', locale: 'tr_TR', siteName: 'Nabız' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0b0d12',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <div className="shell">{children}</div>
      </body>
    </html>
  );
}
