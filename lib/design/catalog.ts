/** SSOT — categorías, fuentes y normalización ES→EN del estudio de diseño. */

export type DesignCategory = {
  /** Identificador persistido en design_library_items.category */
  id: string;
  label: string;
  /** Consulta enviada a Iconify cuando no hay búsqueda libre. */
  query: string;
};

export const DESIGN_CATEGORIES: DesignCategory[] = [
  // Iconify trata multi-palabra como AND sobre el nombre del icono.
  // Queries de 1 término indexable → resultados reales (sin stock inventado).
  { id: "themes", label: "Temas", query: "palette" },
  { id: "pucks", label: "Pucks", query: "location" },
  { id: "speedometers", label: "Velocímetros", query: "speedometer" },
  {
    id: "turn_by_turn",
    label: "Indicaciones giro a giro",
    query: "arrow",
  },
  { id: "mode_selector", label: "Selector de modo", query: "toggle" },
  { id: "hud", label: "HUD", query: "dashboard" },
  { id: "map_controls", label: "Controles del mapa", query: "layers" },
  { id: "banners_panels", label: "Banners y paneles", query: "panel" },
  { id: "app_bars", label: "App Bars", query: "toolbar" },
  { id: "menus", label: "Menús", query: "menu" },
  { id: "compasses", label: "Brújulas", query: "compass" },
  {
    id: "route_gpx",
    label: "Estilos de ruta / GPX",
    query: "route",
  },
  { id: "packs", label: "Packs", query: "apps" },
];

export function categoryLabel(id: string | null | undefined): string {
  if (!id) return "Sin categoría";
  return DESIGN_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export type DesignSource = {
  id: string;
  name: string;
  homepage: string;
  description: string;
  license: string;
};

/**
 * Fuentes activas. IconScout solo aparece si hay credenciales configuradas:
 * sin API key no es una fuente utilizable y no se anuncia como activa.
 */
export function getActiveDesignSources(): DesignSource[] {
  const sources: DesignSource[] = [
    {
      id: "iconify",
      name: "Iconify",
      homepage: "https://iconify.design",
      description:
        "API pública oficial. Más de 200 colecciones open source con licencia por colección.",
      license: "Por colección (MIT, Apache-2.0, CC BY…)",
    },
  ];

  if (process.env.NEXT_PUBLIC_ICONSCOUT_CLIENT_ID) {
    sources.push({
      id: "iconscout",
      name: "IconScout",
      homepage: "https://iconscout.com",
      description: "API de IconScout configurada para esta instancia.",
      license: "Según plan de IconScout",
    });
  }

  return sources;
}

export function isIconScoutConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_ICONSCOUT_CLIENT_ID);
}

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Diccionario ligero: los términos que un rider escribe en español. */
const ES_EN: Record<string, string> = {
  abajo: "down",
  abrir: "open",
  acercar: "zoom in",
  ajustes: "settings",
  alejar: "zoom out",
  alerta: "alert",
  arriba: "up",
  aviso: "warning",
  bandera: "flag",
  banner: "banner",
  barra: "bar",
  bateria: "battery",
  bici: "bicycle",
  bicicleta: "bicycle",
  bosque: "forest",
  boton: "button",
  brujula: "compass",
  buscar: "search",
  busqueda: "search",
  camara: "camera",
  camino: "path",
  candado: "lock",
  capa: "layer",
  capas: "layers",
  carpeta: "folder",
  carretera: "road",
  casa: "home",
  casco: "helmet",
  centrar: "crosshairs",
  cerrar: "close",
  clima: "weather",
  coche: "car",
  color: "color",
  colores: "color",
  combustible: "fuel",
  configuracion: "settings",
  corazon: "heart",
  cruce: "junction",
  curva: "curve",
  derecha: "right",
  descargar: "download",
  editar: "edit",
  eliminar: "delete",
  entrada: "entrance",
  escudo: "shield",
  estrella: "star",
  favorito: "favorite",
  favoritos: "favorite",
  flecha: "arrow",
  flechas: "arrow",
  gasolina: "fuel",
  gasolinera: "gas station",
  girar: "turn",
  giro: "turn",
  guardar: "save",
  imagen: "image",
  inicio: "home",
  izquierda: "left",
  llave: "key",
  lupa: "search",
  luna: "moon",
  lluvia: "rain",
  mapa: "map",
  mapas: "map",
  marcador: "marker",
  menu: "menu",
  meta: "finish flag",
  montana: "mountain",
  moto: "motorcycle",
  motocicleta: "motorcycle",
  movil: "mobile",
  musica: "music",
  norte: "north",
  nube: "cloud",
  nubes: "cloud",
  paleta: "palette",
  panel: "panel",
  pantalla: "screen",
  peligro: "danger",
  perfil: "profile",
  pincel: "brush",
  posicion: "location",
  reloj: "clock",
  rio: "river",
  rotonda: "roundabout",
  ruta: "route",
  rutas: "route",
  salida: "exit",
  senal: "signal",
  silencio: "mute",
  sol: "sun",
  sonido: "sound",
  sur: "south",
  telefono: "phone",
  tema: "theme",
  temas: "theme",
  tiempo: "clock",
  ubicacion: "location",
  usuario: "user",
  velocidad: "speed",
  velocimetro: "speedometer",
  volumen: "volume",
};

/**
 * Traduce término a término al inglés (la API solo indexa nombres en inglés).
 * Las palabras desconocidas se mantienen tal cual.
 */
export function normalizeSearchQuery(input: string): string {
  const words = stripAccents(input.toLowerCase())
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  if (words.length === 0) return "";
  const expanded = words.flatMap((word) => (ES_EN[word] ?? word).split(" "));
  return Array.from(new Set(expanded)).join(" ");
}
