import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
];

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/privacy",
        destination: "/legal/politica-privacidad",
        permanent: true,
      },
      {
        source: "/legal/privacy_policy.html",
        destination: "/legal/politica-privacidad",
        permanent: true,
      },
      {
        source: "/legal/aviso-legal",
        destination: "/legal/legal-notice.html",
        permanent: true,
      },
      {
        source: "/legal/eliminacion-datos",
        destination: "/legal/data-deletion.html",
        permanent: true,
      },
      {
        source: "/legal/responsabilidad-navegacion",
        destination: "/legal/gps-disclaimer.html",
        permanent: true,
      },
      {
        source: "/legal/politica-pagos",
        destination: "/legal/refund.html",
        permanent: true,
      },
      {
        source: "/legal/suscripcion-pro",
        destination: "/legal/subscription.html",
        permanent: true,
      },
      {
        source: "/legal/terminos-condiciones",
        destination: "/legal/terms.html",
        permanent: true,
      },
      {
        source: "/news",
        destination: "/noticias",
        permanent: true,
      },
      {
        source: "/downloads",
        destination: "/",
        permanent: true,
      },
      {
        source: "/simulator",
        destination: "/producto",
        permanent: true,
      },
      {
        source: "/status",
        destination: "/",
        permanent: true,
      },
      {
        source: "/tutorials",
        destination: "/producto",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
