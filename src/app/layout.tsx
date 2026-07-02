import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://allin.web.id'),
  title: {
    default: 'ALLIN - Asosiasi Lingkungan Industri Ketenagalistrikan Nasional',
    template: '%s | ALLIN',
  },
  description:
    'ALLIN adalah organisasi asosiasi terbuka yang menaungi para pelaku industri ketenagalistrikan di Indonesia. Bergabunglah untuk pengembangan kompetensi dan jejaring profesional.',
  keywords: [
    'ALLIN',
    'Asosiasi Lingkungan Industri Ketenagalistrikan Nasional',
    'ketenagalistrikan',
    'industri listrik',
    'energi terbarukan',
    'organisasi profesi',
    'transmisi',
    'distribusi',
    'pembangkit listrik',
    'smart grid',
  ],
  authors: [{ name: 'ALLIN', url: 'https://allin.web.id' }],
  creator: 'ALLIN',
  publisher: 'ALLIN',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'ALLIN - Asosiasi Lingkungan Industri Ketenagalistrikan Nasional',
    description:
      'Organisasi profesi ketenagalistrikan nasional yang berkomitmen untuk pengembangan industri dan kompetensi SDM di sektor kelistrikan Indonesia.',
    siteName: 'ALLIN',
    type: 'website',
    locale: 'id_ID',
    url: 'https://allin.web.id',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'ALLIN - Asosiasi Lingkungan Industri Ketenagalistrikan Nasional',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ALLIN - Asosiasi Lingkungan Industri Ketenagalistrikan Nasional',
    description:
      'Organisasi profesi ketenagalistrikan nasional yang berkomitmen untuk pengembangan industri dan kompetensi SDM di sektor kelistrikan Indonesia.',
    site: '@allin_id',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'ALLIN - Asosiasi Lingkungan Industri Ketenagalistrikan Nasional',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://allin.web.id',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "ALLIN",
              alternateName:
                "Asosiasi Lingkungan Industri Ketenagalistrikan Nasional",
              url: "https://allin.web.id",
              description:
                "Organisasi profesi yang menaungi para pelaku industri ketenagalistrikan di Indonesia.",
              contactPoint: {
                "@type": "ContactPoint",
                email: "info@allin.web.id",
                telephone: "+62-21-1234-5678",
                contactType: "customer service",
                areaServed: "ID",
                availableLanguage: "Indonesian",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground overflow-x-hidden`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}