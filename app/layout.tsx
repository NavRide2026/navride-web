import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import "./responsive-safety.css";
import "./route-motion.css";
import "./hero-integrated.css";
import "./site-motion.css";
import "./immersive-backdrop.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { BRAND, SITE_URL } from "@/lib/site/constants";
import Navbar from "@/components/navbar/navbar";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const defaultDescription =
  "NavRide es navegación off-road para moto trail: importa rutas GPX, utiliza el HUD y mapas sin conexión.";
const finalLogo = "/brand/navride-wordmark-clean.svg";
const faviconLogo = "/brand/navride-favicon.svg";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND.name} — Navegación off-road GPX`,
    template: `%s — ${BRAND.name}`,
  },
  description: defaultDescription,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: SITE_URL,
    title: `${BRAND.name} — Navegación off-road GPX`,
    description: defaultDescription,
    siteName: BRAND.name,
    images: [{ url: finalLogo, width: 1200, height: 280, alt: "NavRide" }],
  },
  twitter: {
    card: "summary",
    title: `${BRAND.name} — Navegación off-road GPX`,
    description: defaultDescription,
    images: [finalLogo],
  },
  icons: { icon: faviconLogo, shortcut: faviconLogo },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
