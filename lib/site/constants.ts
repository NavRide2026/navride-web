/** NavRide web — copy and metadata from app NavRideLegalCatalog / AppConstants */

export const SITE_URL = "https://navride-web.vercel.app" as const;

export const BRAND = {
  name: "NavRide",
  tagline: "Navegación GPX",
  taglineEs: "Navegación offroad orientada a GPX",
  version: "1.0.0",
  lastUpdated: "2026-09-19",
  holderName: "NavRide Developer",
  holderAddress: "España",
  supportEmail: "navride@outlook.com",
  privacyPolicyPublicUrl: `${SITE_URL}/legal/politica-privacidad`,
} as const;

/** URLs oficiales para Google Play Console */
export const PLAY_LEGAL_URLS = {
  privacyPolicy: `${SITE_URL}/legal/politica-privacidad`,
  terms: `${SITE_URL}/legal/terms.html`,
  dataDeletion: `${SITE_URL}/legal/data-deletion.html`,
  accountDeletion: `${SITE_URL}/delete-account`,
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
  "/funciones",
  "/roadmap",
  "/novedades",
  "/noticias",
  "/legal",
  "/legal/politica-privacidad",
  "/legal/data-deletion.html",
  "/delete-account",
  "/contacto",
  "/soporte",
  "/login",
  "/mi-garaje",
  "/editor-gpx",
  "/perfil",
  "/legal/legal-notice.html",
  "/legal/terms.html",
  "/legal/subscription.html",
  "/legal/refund.html",
  "/legal/gps-disclaimer.html",
  "/legal/licenses.html",
] as const;

export const PLANS = {
  free: {
    name: "Free",
    summary:
      "Funciones básicas de navegación y rutas. Puedes usar una cuenta para sincronizar tus rutas entre dispositivos.",
    price: "0 €",
    priceSecondary: "",
    badge: "Gratis",
    purchasable: false,
  },
  rider: {
    name: "Rider",
    summary:
      "Más capacidad para rutas, kilómetros y favoritos.",
    price: "2,99 €/mes",
    priceSecondary: "18,99 €/año",
    badge: "Mensual / Anual",
    purchasable: true,
  },
  pilot: {
    name: "Pilot",
    productName: "NavRide Adventure",
    sku: "navride_adventure_monthly",
    summary:
      "Más capacidad de uso y acceso a las funciones Pilot disponibles, incluidos mapas offline.",
    price: "7,99 €/mes",
    priceSecondary: "59,99 €/año",
    badge: "Mensual / Anual",
    purchasable: true,
  },
} as const;

export const FEATURES = [
  {
    title: "Importar GPX",
    description:
      "Importa un archivo GPX, visualiza el recorrido y úsalo como referencia durante la navegación.",
  },
  {
    title: "Mapas offline",
    description:
      "Prepara mapas para utilizarlos sin conexión cuando la función esté disponible en tu plan y la zona haya sido descargada previamente.",
  },
  {
    title: "Navegar",
    description:
      "Sigue tu posición, el recorrido y las indicaciones principales desde el mapa y el HUD.",
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
    title: "Beta privada de NavRide",
    excerpt:
      "La beta privada permite probar navegación GPX, HUD y mapas en situaciones reales antes de ampliar la disponibilidad.",
  },
  {
    date: "2026-05-30",
    title: "Actualización de documentación legal",
    excerpt:
      "Se ha revisado la documentación de privacidad, condiciones de uso, eliminación de cuenta y atribuciones.",
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
    detail: "Datos cartográficos © OpenStreetMap contributors, ODbL.",
    appliesTo: "Datos de mapa",
    url: "https://www.openstreetmap.org/copyright",
  },
  {
    title: "OpenFreeMap / OpenMapTiles",
    detail: "Mapas vectoriales y etiquetas basados en OpenStreetMap y OpenMapTiles.",
    appliesTo: "Mapas web",
    url: "https://openfreemap.org/",
  },
  {
    title: "Esri World Imagery",
    detail: "Imágenes de la vista satélite con las atribuciones mostradas en el propio mapa.",
    appliesTo: "Vista satélite web",
    url: "https://www.esri.com/en-us/legal/terms/full-master-agreement",
  },
  {
    title: "CARTO / OpenTopoMap",
    detail: "Atribuciones aplicables cuando se utiliza una capa basada en estos servicios.",
    appliesTo: "Capas compatibles",
    url: "https://carto.com/attributions",
  },
  {
    title: "Project OSRM",
    detail: "Servicio de cálculo de rutas online basado en datos de OpenStreetMap.",
    appliesTo: "Editor de rutas web",
    url: "https://project-osrm.org/",
  },
] as const;
