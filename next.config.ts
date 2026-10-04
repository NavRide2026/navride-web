import type { NextConfig } from "next";

/**
 * CSP compatible with Next.js, MapLibre workers, Supabase, OpenFreeMap proxy,
 * Esri imagery, OSRM/Valhalla, Nominatim, and the Flutter WebView editor.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://server.arcgisonline.com https://s3.amazonaws.com https://elevation-tiles-prod.s3.amazonaws.com https://*.supabase.co https://*.supabase.in",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.supabase.in wss://*.supabase.in https://valhalla.openstreetmap.de https://valhalla1.openstreetmap.de https://router.project-osrm.org https://tiles.openfreemap.org https://nominatim.openstreetmap.org https://server.arcgisonline.com https://s3.amazonaws.com https://elevation-tiles-prod.s3.amazonaws.com",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Prefer CSP frame-ancestors over X-Frame-Options so WebView/embed stays workable.
];

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: "/garage", destination: "/producto", permanent: true },
      { source: "/garage/:path*", destination: "/producto", permanent: true },
      { source: "/privacy", destination: "/legal/politica-privacidad", permanent: true },
      { source: "/legal/privacy_policy.html", destination: "/legal/politica-privacidad", permanent: true },
      { source: "/legal/aviso-legal", destination: "/legal/legal-notice.html", permanent: true },
      { source: "/legal/eliminacion-datos", destination: "/legal/data-deletion.html", permanent: true },
      { source: "/legal/responsabilidad-navegacion", destination: "/legal/gps-disclaimer.html", permanent: true },
      { source: "/legal/politica-pagos", destination: "/legal/refund.html", permanent: true },
      { source: "/legal/suscripcion-pro", destination: "/legal/subscription.html", permanent: true },
      { source: "/legal/terminos-condiciones", destination: "/legal/terms.html", permanent: true },
      { source: "/diseno", destination: "/producto", permanent: true },
      { source: "/news", destination: "/novedades", permanent: true },
      { source: "/noticias", destination: "/novedades", permanent: true },
      { source: "/downloads", destination: "/", permanent: true },
      { source: "/simulator", destination: "/producto", permanent: true },
      { source: "/status", destination: "/", permanent: true },
      { source: "/tutorials", destination: "/producto", permanent: true },
    ];
  },
};

export default nextConfig;
