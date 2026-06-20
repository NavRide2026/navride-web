import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BRAND, SITE_URL } from "@/lib/site/constants";
import Navbar from "@/components/navbar/navbar";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const defaultDescription =
  "NavRide es navegación offroad orientada a moto y trail: importa GPX, HUD, modo Rally y mapas offline con suscripción NavRide Adventure vía Google Play.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND.name} — Navegación offroad GPX`,
    template: `%s — ${BRAND.name}`,
  },
  description: defaultDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: SITE_URL,
    title: `${BRAND.name} — Navegación offroad GPX`,
    description: defaultDescription,
    siteName: BRAND.name,
    images: [
      {
        url: "/navride_splash.png",
        width: 1080,
        height: 1920,
        alt: "NavRide — navegación offroad GPX",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — Navegación offroad GPX`,
    description: defaultDescription,
    images: ["/navride_splash.png"],
  },
  icons: {
    icon: "/navride_logo.png",
    apple: "/navride_logo.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND.name,
    url: SITE_URL,
    description: defaultDescription,
    inLanguage: "es",
  };

  return (
    <html lang="es" className={`${inter.variable} dark h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#050608] text-white font-sans">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
