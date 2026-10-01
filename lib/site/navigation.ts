/** Fuente única de enlaces del menú para escritorio, tableta y móvil. */
export type NavLink = { href: string; label: string };

export const NAV_PUBLIC_LINKS: NavLink[] = [
  { href: "/producto", label: "Producto" },
  { href: "/funciones", label: "Funciones" },
  { href: "/planes", label: "Planes" },
  { href: "/roadmap", label: "Evolución" },
  { href: "/novedades", label: "Novedades" },
  { href: "/contacto", label: "Contacto" },
];

export const NAV_APP_LINKS: NavLink[] = [
  { href: "/mi-garaje", label: "Mi garaje" },
  { href: "/mis-rutas", label: "Mis rutas" },
  { href: "/editor-gpx", label: "Editor de rutas" },
  { href: "/perfil", label: "Perfil" },
];

export const NAV_LOGIN = { href: "/login", label: "Iniciar sesión" } as const;
