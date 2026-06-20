/** SSOT — enlaces del navbar (desktop + móvil). */
export type NavLink = { href: string; label: string };

export const NAV_PUBLIC_LINKS: NavLink[] = [
  { href: "/producto", label: "Producto" },
  { href: "/planes", label: "Planes" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/noticias", label: "Noticias" },
  { href: "/contacto", label: "Contacto" },
];

export const NAV_APP_LINKS: NavLink[] = [
  { href: "/mi-garaje", label: "Mi Garaje" },
  { href: "/editor-gpx", label: "Editor GPX" },
];

export const NAV_LOGIN = { href: "/login", label: "Iniciar Sesión" } as const;
