/** NavRide web — copy and metadata from app NavRideLegalCatalog / AppConstants */

export const SITE_URL = "https://web-navride.vercel.app" as const;

export const BRAND = {
  name: "NavRide",
  tagline: "OEM Offroad Navigation",
  taglineEs: "Navegación offroad orientada a GPX",
  version: "0.9.0 beta",
  lastUpdated: "2026-05-30",
  holderName: "Daniel Montero Mora",
  holderAddress: "Mollet del Vallès, Barcelona, Cataluña, España",
  supportEmail: "navride@outlook.com",
  privacyPolicyPublicUrl: `${SITE_URL}/legal/politica-privacidad`,
} as const;

/** URLs oficiales para Google Play Console */
export const PLAY_LEGAL_URLS = {
  privacyPolicy: `${SITE_URL}/legal/politica-privacidad`,
  terms: `${SITE_URL}/legal/terms.html`,
  dataDeletion: `${SITE_URL}/legal/data-deletion.html`,
  contact: `${SITE_URL}/contacto`,
  support: `${SITE_URL}/soporte`,
  legalHub: `${SITE_URL}/legal`,
} as const;

/** Slots para capturas reales — añadir imageSrc cuando existan assets */
export const MEDIA_SLOTS: {
  id: string;
  title: string;
  caption: string;
  imageSrc: string | null;
}[] = [
  {
    id: "gpx",
    title: "Importar GPX",
    caption: "Track importado en el mapa — pendiente captura real de la app.",
    imageSrc: null,
  },
  {
    id: "navigation",
    title: "Navegación HUD",
    caption: "HUD durante navegación GPX — pendiente captura real.",
    imageSrc: null,
  },
  {
    id: "rally",
    title: "Modo Rally",
    caption: "Tramo siguiente por dificultad — pendiente captura real.",
    imageSrc: null,
  },
  {
    id: "offline",
    title: "Mapas offline",
    caption: "Corredor offline Pilot o capa .mbtiles — pendiente captura real.",
    imageSrc: null,
  },
  {
    id: "premium",
    title: "NavRide Adventure",
    caption: "Pantalla Premium / Google Play — pendiente captura real.",
    imageSrc: null,
  },
];

/** Rutas públicas indexables */
export const PUBLIC_ROUTES = [
  "/",
  "/producto",
  "/planes",
  "/roadmap",
  "/noticias",
  "/legal",
  "/legal/politica-privacidad",
  "/contacto",
  "/soporte",
  "/login",
  "/mi-garaje",
  "/editor-gpx",
  "/legal/legal-notice.html",
  "/legal/terms.html",
  "/legal/subscription.html",
  "/legal/refund.html",
  "/legal/data-deletion.html",
  "/legal/gps-disclaimer.html",
  "/legal/licenses.html",
] as const;

export const PLANS = {
  free: {
    name: "Free",
    summary:
      "Prueba gratuita de 7 días de navegación GPX online. Al finalizar, la navegación requiere suscripción Pilot o plan compatible.",
    price: "0 €",
    badge: "Trial 7 días",
    purchasable: false,
  },
  rider: {
    name: "Rider",
    summary:
      "4,99 € / mes · hasta 10 tracks/mes (máx. 50 km c/u), rally hasta 10 h/mes. Plan de referencia UI — no vendido en Play actualmente.",
    price: "4,99 € / mes",
    badge: "Referencia UI",
    purchasable: false,
  },
  pilot: {
    name: "Pilot",
    productName: "NavRide Adventure",
    sku: "navride_adventure_monthly",
    summary:
      "7,99 € / mes · desbloqueo total: navegación, rally, mapas offline (.mbtiles) y preparación de corredor. Suscripción real vía Google Play.",
    price: "7,99 € / mes",
    badge: "Google Play",
    purchasable: true,
  },
} as const;

export const FEATURES = [
  {
    title: "Importar GPX",
    description:
      "Carga un track y navega punto a punto. Comparte un .gpx desde otra app con «Abrir con NavRide».",
  },
  {
    title: "Modo Rally",
    description:
      "Lee el tramo siguiente por dificultad (color). Requiere plan Pilot o Rider con horas disponibles.",
  },
  {
    title: "Mapas offline",
    description:
      "Con Pilot: importa .mbtiles o prepara el corredor de una ruta favorita para navegar sin red en esa ruta.",
  },
  {
    title: "Navegar",
    description:
      "HUD, indicaciones, seguimiento del track. Approach online hasta el inicio del GPX cuando hay conexión.",
  },
] as const;

export const USE_CASES = [
  "Moto",
  "Trail",
  "Adventure",
  "Touring",
  "Viajes",
  "Carretera secundaria",
] as const;

export type RoadmapStatus = "investigacion" | "desarrollo" | "completado";

export const ROADMAP_ITEMS: {
  title: string;
  subtitle?: string;
  status: RoadmapStatus;
  note?: string;
}[] = [
  {
    title: "Navegación GPX total + 7 días Gratis",
    status: "completado",
  },
  {
    title: "Modo Rally: Clasificación por dificultad de tramo",
    status: "completado",
  },
  {
    title: "Mapas Offline (¡Para cuando no hay cobertura!)",
    status: "completado",
  },
  {
    title: "Pruebas extremas sobre el terreno",
    subtitle: "Puliendo hasta el último detalle en rutas reales antes de abrir las puertas a todo el mundo.",
    status: "desarrollo",
  },
  {
    title: "Notas de voz en ruta",
    subtitle: "Estamos estudiando cómo permitirte grabar avisos de peligros o desvíos con la voz mientras pilotas, sin soltar el manillar.",
    status: "investigacion",
  },
];

export const NEWS_ITEMS = [
  {
    date: "2026-06-21",
    title: "¡La Beta Privada ya está aquí!",
    excerpt:
      "Hemos arrancado motores. Un grupo exclusivo de pilotos ya está probando NavRide en el barro. Navegación off-road pura, importación de GPX, modo Rally y mapas sin conexión para llegar donde Google Maps se rinde. ¡Muy pronto abriremos plazas!",
  },
  {
    date: "2026-05-30",
    title: "Preparando el terreno legal",
    excerpt:
      "Nos tomamos tu privacidad tan en serio como tu seguridad en la moto. Hemos adaptado todas nuestras políticas para cumplir con los estándares más estrictos y proteger tus datos de ruta.",
  },
];

export const LEGAL_DOCS: {
  title: string;
  href: string;
  critical?: boolean;
}[] = [
  {
    title: "Política de privacidad",
    href: "/legal/politica-privacidad",
    critical: true,
  },
  { title: "Aviso legal", href: "/legal/legal-notice.html" },
  { title: "Términos y condiciones", href: "/legal/terms.html" },
  {
    title: "Condiciones de suscripción",
    href: "/legal/subscription.html",
  },
  { title: "Política de pagos", href: "/legal/refund.html" },
  {
    title: "Eliminación de datos",
    href: "/legal/data-deletion.html",
  },
  {
    title: "Responsabilidad GPS",
    href: "/legal/gps-disclaimer.html",
  },
  {
    title: "Licencias y atribuciones",
    href: "/legal/licenses.html",
  },
] as const;

export const ATTRIBUTIONS = [
  {
    title: "OpenStreetMap",
    detail:
      "Datos cartográficos © OpenStreetMap contributors, ODbL.",
    appliesTo: "Todos los modos de mapa",
    url: "https://www.openstreetmap.org/copyright",
  },
  {
    title: "CARTO",
    detail:
      "Mapa Normal (Voyager): tiles CARTO basados en OpenStreetMap.",
    appliesTo: "Mapa Normal online y preparación offline",
    url: "https://carto.com/attributions",
  },
  {
    title: "OpenTopoMap",
    detail:
      "Mapa Topo: © OpenTopoMap (CC-BY-SA), datos OSM, relieve SRTM.",
    appliesTo: "Mapa Topo online y preparación offline",
    url: "https://opentopomap.org/about",
  },
  {
    title: "OSRM",
    detail: "Project OSRM — enrutado y map matching. Datos © OSM.",
    appliesTo: "Approach y adherencia GPX (con conexión)",
    url: "https://project-osrm.org/",
  },
  {
    title: "Open-Meteo",
    detail: "Datos meteorológicos opcionales.",
    appliesTo: "Alertas climáticas (opcional)",
    url: "https://open-meteo.com/",
  },
  {
    title: "Google Play",
    detail: "Distribución y facturación de suscripción.",
    appliesTo: "NavRide Adventure",
    url: "https://play.google.com/about/play-terms/",
  },
] as const;
