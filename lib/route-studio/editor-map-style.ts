export type EditorBaseStyleId = "liberty" | "bright" | "positron";

export const OPENFREEMAP_UPSTREAM_ORIGIN =
  "https://tiles.openfreemap.org";
export const OPENFREEMAP_PROXY_BASE = "/api/map-assets";

export const OPENFREEMAP_VECTOR_TILES =
  `${OPENFREEMAP_PROXY_BASE}/planet/{z}/{x}/{y}.pbf`;
export const OPENFREEMAP_VECTOR_SOURCE_URL =
  `${OPENFREEMAP_PROXY_BASE}/planet`;
export const OPENFREEMAP_GLYPHS =
  `${OPENFREEMAP_PROXY_BASE}/fonts/{fontstack}/{range}.pbf`;
export const OPENFREEMAP_SPRITE =
  `${OPENFREEMAP_PROXY_BASE}/sprites/ofm_f384/ofm`;
export const OPENFREEMAP_ATTRIBUTION =
  "OpenFreeMap © OpenMapTiles Data from OpenStreetMap";

export const EDITOR_BASE_STYLE_URLS: Record<EditorBaseStyleId, string> = {
  liberty: "/api/map-style/liberty",
  bright: "/api/map-style/bright",
  positron: "/api/map-style/positron",
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function proxyOpenFreeMapUrl(value: string): string {
  const prefix = `${OPENFREEMAP_UPSTREAM_ORIGIN}/`;
  return value.startsWith(prefix)
    ? `${OPENFREEMAP_PROXY_BASE}/${value.slice(prefix.length)}`
    : value;
}

/**
 * Browsers only talk to NavRide for OpenFreeMap resources. Vercel proxies
 * TileJSON, vector/raster tiles, glyphs and sprites to the upstream service.
 * This avoids client-side DNS/CORS/provider failures turning the editor blank.
 */
export function proxyOpenFreeMapUrls(value: unknown): unknown {
  if (typeof value === "string") return proxyOpenFreeMapUrl(value);
  if (Array.isArray(value)) return value.map(proxyOpenFreeMapUrls);
  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      proxyOpenFreeMapUrls(child),
    ]),
  );
}

type Palette = {
  background: string;
  land: string;
  farmland: string;
  wood: string;
  grass: string;
  rock: string;
  sand: string;
  wetland: string;
  park: string;
  water: string;
  waterway: string;
  building: string;
  buildingOutline: string;
  boundary: string;
  roadCasing: string;
  motorway: string;
  trunk: string;
  primary: string;
  secondary: string;
  tertiary: string;
  minor: string;
  service: string;
  track: string;
  path: string;
  cycleway: string;
  footway: string;
  bridleway: string;
  steps: string;
  rail: string;
  text: string;
  textMuted: string;
  halo: string;
};

function paletteFor(style: EditorBaseStyleId): Palette {
  switch (style) {
    case "bright":
      return {
        background: "#f5f1e8",
        land: "#eee8dc",
        farmland: "#eadfca",
        wood: "#bfd9ad",
        grass: "#dce7bd",
        rock: "#d8d2c7",
        sand: "#eadcb6",
        wetland: "#c8dfd1",
        park: "#cfe8bd",
        water: "#9ed0ea",
        waterway: "#78b7d4",
        building: "#ddd5c8",
        buildingOutline: "#c7beb1",
        boundary: "#a59d92",
        roadCasing: "#b9afa3",
        motorway: "#f5b477",
        trunk: "#f2c58e",
        primary: "#fff3cb",
        secondary: "#fff8e4",
        tertiary: "#ffffff",
        minor: "#ffffff",
        service: "#fafafa",
        track: "#b79268",
        path: "#8f7f70",
        cycleway: "#3677c7",
        footway: "#9a675d",
        bridleway: "#6f7f45",
        steps: "#8c5a53",
        rail: "#7f7f7f",
        text: "#26323b",
        textMuted: "#59646c",
        halo: "#ffffff",
      };
    case "positron":
      return {
        background: "#f2f3f0",
        land: "#eceeea",
        farmland: "#eef0e9",
        wood: "#e0e8dc",
        grass: "#e5eadf",
        rock: "#e2e2de",
        sand: "#eee9da",
        wetland: "#dfe9e5",
        park: "#e4ece0",
        water: "#c2dce4",
        waterway: "#a5cad7",
        building: "#dedfdb",
        buildingOutline: "#d0d2cd",
        boundary: "#b7bab4",
        roadCasing: "#d4d5d1",
        motorway: "#f7c9a4",
        trunk: "#f4d9b6",
        primary: "#fff0cc",
        secondary: "#ffffff",
        tertiary: "#ffffff",
        minor: "#ffffff",
        service: "#f7f8f6",
        track: "#b9a389",
        path: "#9d9187",
        cycleway: "#5b86ba",
        footway: "#a77d75",
        bridleway: "#81906a",
        steps: "#9c7470",
        rail: "#969996",
        text: "#4b5052",
        textMuted: "#727779",
        halo: "#ffffff",
      };
    case "liberty":
    default:
      return {
        background: "#f8f4f0",
        land: "#ebe5dc",
        farmland: "#e8dcc7",
        wood: "#bdd8ae",
        grass: "#d9e5b8",
        rock: "#d7d0c5",
        sand: "#ecddb2",
        wetland: "#c7ddd0",
        park: "#cfe8bd",
        water: "#a8d8ef",
        waterway: "#7dbbd8",
        building: "#ded8cf",
        buildingOutline: "#c8c0b7",
        boundary: "#a99f95",
        roadCasing: "#c7bfb6",
        motorway: "#f0a873",
        trunk: "#f3c48f",
        primary: "#fff0bd",
        secondary: "#fff7dd",
        tertiary: "#ffffff",
        minor: "#ffffff",
        service: "#fbfbfb",
        track: "#ae865f",
        path: "#88786d",
        cycleway: "#2e72c2",
        footway: "#9a635b",
        bridleway: "#687d43",
        steps: "#8f5750",
        rail: "#7a7a7a",
        text: "#27323a",
        textMuted: "#58636b",
        halo: "#ffffff",
      };
  }
}

const ROAD_CLASSES = [
  "motorway",
  "trunk",
  "primary",
  "secondary",
  "tertiary",
  "minor",
  "service",
  "raceway",
  "busway",
  "bus_guideway",
  "motorway_construction",
  "trunk_construction",
  "primary_construction",
  "secondary_construction",
  "tertiary_construction",
  "minor_construction",
  "service_construction",
] as const;

const PATH_SUBCLASSES = [
  "pedestrian",
  "path",
  "footway",
  "cycleway",
  "steps",
  "bridleway",
  "corridor",
  "platform",
] as const;

const RAIL_SUBCLASSES = [
  "rail",
  "narrow_gauge",
  "preserved",
  "funicular",
  "subway",
  "light_rail",
  "monorail",
  "tram",
] as const;

function roadWidth() {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    6, 0.5,
    10, 1,
    13, 2.2,
    16, 5.2,
    20, 15,
  ];
}

function roadCasingWidth() {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    6, 0.9,
    10, 1.6,
    13, 3.1,
    16, 6.6,
    20, 18,
  ];
}

function trackWidth() {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    11, 0.6,
    14, 1.2,
    17, 2.4,
    20, 5,
  ];
}

function pathWidth() {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    12, 0.55,
    15, 1.15,
    18, 2.2,
    20, 3.6,
  ];
}

const NAVRIDE_TRAIL_LAYER_IDS = new Set([
  "nr-track-casing",
  "nr-track",
  "nr-path",
  "nr-access-restricted",
]);

function navRideTrailLayers(p: Palette): JsonRecord[] {
  const transportClass = [
    "coalesce",
    ["get", "subclass"],
    ["get", "class"],
    "",
  ];

  return [
    {
      id: "nr-track-casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 9,
      filter: ["==", transportClass, "track"],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": p.halo,
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          9, 1.35,
          13, 2.1,
          16, 3.5,
          20, 6.2,
        ],
        "line-opacity": 0.82,
      },
    },
    {
      id: "nr-track",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 9,
      filter: ["==", transportClass, "track"],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": [
          "match",
          ["coalesce", ["get", "tracktype"], ""],
          "grade1", "#a47e55",
          "grade2", "#98724f",
          "grade3", "#8d684a",
          "grade4", "#805e45",
          "grade5", "#735541",
          [
            "match",
            ["coalesce", ["get", "surface"], ""],
            "asphalt", "#a98e72",
            "paved", "#a98e72",
            "concrete", "#a98e72",
            "gravel", "#9b744e",
            "fine_gravel", "#9b744e",
            "ground", "#8a6647",
            "dirt", "#8a6647",
            "earth", "#8a6647",
            p.track,
          ],
        ],
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          9, 0.55,
          13, 1.0,
          16, 2.1,
          20, 5.0,
        ],
        "line-opacity": 0.98,
        "line-dasharray": [3, 1.6],
      },
    },
    {
      id: "nr-path",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 10,
      filter: [
        "in",
        transportClass,
        ["literal", ["path", "footway", "cycleway", "bridleway", "pedestrian", "steps"]],
      ],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": [
          "match",
          transportClass,
          "cycleway", p.cycleway,
          "footway", p.footway,
          "pedestrian", p.footway,
          "bridleway", p.bridleway,
          "steps", p.steps,
          p.path,
        ],
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10, 0.45,
          13, 0.75,
          16, 1.45,
          18, 2.4,
          20, 3.6,
        ],
        "line-opacity": 0.97,
        "line-dasharray": [2, 1.8],
      },
    },
    {
      id: "nr-access-restricted",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      minzoom: 12,
      filter: [
        "any",
        ["in", ["get", "access"], ["literal", ["no", "private"]]],
        ["in", ["get", "motor_vehicle"], ["literal", ["no", "private"]]],
        ["==", ["get", "motorcycle"], "no"],
      ],
      paint: {
        "line-color": "#d64b40",
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          12, 1,
          16, 2.2,
          20, 4,
        ],
        "line-opacity": 0.84,
        "line-dasharray": [1.2, 1.8],
      },
    },
  ];
}

function injectNavRideTrailLayers(
  layers: unknown[],
  style: EditorBaseStyleId,
): unknown[] {
  const clean = layers.filter(
    (layer) =>
      !(
        isRecord(layer) &&
        typeof layer.id === "string" &&
        NAVRIDE_TRAIL_LAYER_IDS.has(layer.id)
      ),
  );
  const overlays = navRideTrailLayers(paletteFor(style));
  const firstSymbol = clean.findIndex(
    (layer) => isRecord(layer) && layer.type === "symbol",
  );
  if (firstSymbol < 0) return [...clean, ...overlays];
  return [
    ...clean.slice(0, firstSymbol),
    ...overlays,
    ...clean.slice(firstSymbol),
  ];
}

/**
 * Canonical editor basemap.
 *
 * All visual variants expose the same road/path inventory. Only the palette
 * changes. OpenMapTiles' transportation schema includes motorway → service,
 * track, path plus pedestrian/footway/cycleway/steps/bridleway, access,
 * bicycle, foot, mtb_scale and surface attributes.
 */
export function buildEditorFallbackStyle(style: EditorBaseStyleId): object {
  const p = paletteFor(style);

  return {
    version: 8,
    name: `NavRide Editor ${style}`,
    glyphs: OPENFREEMAP_GLYPHS,
    sprite: OPENFREEMAP_SPRITE,
    sources: {
      openmaptiles: {
        type: "vector",
        url: OPENFREEMAP_VECTOR_SOURCE_URL,
        minzoom: 0,
        maxzoom: 14,
        attribution: OPENFREEMAP_ATTRIBUTION,
      },
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": p.background },
      },
      {
        id: "nr-landcover",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "landcover",
        minzoom: 5,
        paint: {
          "fill-color": [
            "match",
            ["get", "class"],
            "wood", p.wood,
            "grass", p.grass,
            "farmland", p.farmland,
            "rock", p.rock,
            "sand", p.sand,
            "wetland", p.wetland,
            p.land,
          ],
          "fill-opacity": 0.7,
        },
      },
      {
        id: "nr-landuse",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "landuse",
        minzoom: 8,
        paint: {
          "fill-color": p.land,
          "fill-opacity": 0.45,
        },
      },
      {
        id: "nr-park",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "park",
        minzoom: 5,
        paint: {
          "fill-color": p.park,
          "fill-opacity": 0.76,
        },
      },
      {
        id: "nr-water",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "water",
        paint: { "fill-color": p.water },
      },
      {
        id: "nr-waterway",
        type: "line",
        source: "openmaptiles",
        "source-layer": "waterway",
        minzoom: 8,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": p.waterway,
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            8, 0.4,
            14, 1.1,
            18, 2.4,
          ],
          "line-opacity": 0.9,
        },
      },
      {
        id: "nr-boundary",
        type: "line",
        source: "openmaptiles",
        "source-layer": "boundary",
        minzoom: 4,
        paint: {
          "line-color": p.boundary,
          "line-width": 0.8,
          "line-opacity": 0.48,
          "line-dasharray": [4, 3],
        },
      },
      {
        id: "nr-building",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "building",
        minzoom: 13,
        paint: {
          "fill-color": p.building,
          "fill-outline-color": p.buildingOutline,
          "fill-opacity": 0.9,
        },
      },
      {
        id: "nr-rail",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 9,
        filter: ["in", ["get", "subclass"], ["literal", RAIL_SUBCLASSES]],
        paint: {
          "line-color": p.rail,
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            9, 0.5,
            14, 1,
            18, 2,
          ],
          "line-opacity": 0.7,
          "line-dasharray": [2, 2],
        },
      },
      {
        id: "nr-road-casing",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 6,
        filter: ["in", ["get", "class"], ["literal", ROAD_CLASSES]],
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": p.roadCasing,
          "line-width": roadCasingWidth(),
          "line-opacity": 0.94,
        },
      },
      {
        id: "nr-road",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 6,
        filter: ["in", ["get", "class"], ["literal", ROAD_CLASSES]],
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": [
            "match",
            ["get", "class"],
            "motorway", p.motorway,
            "motorway_construction", p.motorway,
            "trunk", p.trunk,
            "trunk_construction", p.trunk,
            "primary", p.primary,
            "primary_construction", p.primary,
            "secondary", p.secondary,
            "secondary_construction", p.secondary,
            "tertiary", p.tertiary,
            "tertiary_construction", p.tertiary,
            "service", p.service,
            "service_construction", p.service,
            p.minor,
          ],
          "line-width": roadWidth(),
          "line-opacity": 1,
        },
      },
      ...navRideTrailLayers(p),
      {
        id: "nr-road-name",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "transportation_name",
        minzoom: 11,
        layout: {
          "symbol-placement": "line",
          "text-field": [
            "coalesce",
            ["get", "name:latin"],
            ["get", "name"],
            ["get", "ref"],
            "",
          ],
          "text-font": ["Noto Sans Regular"],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            11, 9.5,
            15, 11.5,
            18, 13,
            20, 14,
          ],
          "text-max-angle": 35,
          "text-padding": 3,
        },
        paint: {
          "text-color": p.text,
          "text-halo-color": p.halo,
          "text-halo-width": 1.5,
        },
      },
      {
        id: "nr-place-name",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "place",
        minzoom: 3,
        layout: {
          "text-field": [
            "coalesce",
            ["get", "name:latin"],
            ["get", "name"],
            "",
          ],
          "text-font": ["Noto Sans Regular"],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            3, 10,
            8, 12,
            14, 14,
            18, 16,
          ],
          "text-padding": 4,
        },
        paint: {
          "text-color": p.text,
          "text-halo-color": p.halo,
          "text-halo-width": 1.5,
        },
      },
      {
        id: "nr-poi-name",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "poi",
        minzoom: 14,
        layout: {
          "text-field": [
            "coalesce",
            ["get", "name:latin"],
            ["get", "name"],
            "",
          ],
          "text-font": ["Noto Sans Regular"],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            14, 9,
            18, 11,
            20, 12,
          ],
          "text-offset": [0, 0.7],
          "text-padding": 4,
        },
        paint: {
          "text-color": p.textMuted,
          "text-halo-color": p.halo,
          "text-halo-width": 1.2,
        },
      },
      {
        id: "nr-peak-name",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "mountain_peak",
        minzoom: 11,
        layout: {
          "text-field": [
            "coalesce",
            ["get", "name:latin"],
            ["get", "name"],
            "",
          ],
          "text-font": ["Noto Sans Regular"],
          "text-size": 10,
          "text-offset": [0, 0.8],
        },
        paint: {
          "text-color": p.textMuted,
          "text-halo-color": p.halo,
          "text-halo-width": 1.2,
        },
      },
      {
        id: "nr-house-number",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "housenumber",
        minzoom: 17,
        layout: {
          "text-field": ["coalesce", ["get", "housenumber"], ""],
          "text-font": ["Noto Sans Regular"],
          "text-size": 10,
        },
        paint: {
          "text-color": p.textMuted,
          "text-halo-color": p.halo,
          "text-halo-width": 1,
        },
      },
    ],
  };
}

/**
 * Preserve the complete upstream OpenFreeMap style whenever it is available.
 *
 * This is intentional: the vendor style contains the full symbol stack
 * (countries, states/regions, cities, towns, streets, road refs, POI labels,
 * shields, etc.). Replacing that stack with a reduced local style caused a
 * production regression where geometry rendered but names disappeared.
 *
 * The local NavRide style remains the outage fallback.
 */
export function normalizeOpenFreeMapStyle(
  input: unknown,
  style: EditorBaseStyleId,
): object {
  const proxiedInput = proxyOpenFreeMapUrls(input);
  if (!isRecord(proxiedInput)) return buildEditorFallbackStyle(style);

  const rawSources = isRecord(proxiedInput.sources) ? proxiedInput.sources : {};
  const vendorSource = isRecord(rawSources.openmaptiles)
    ? rawSources.openmaptiles
    : null;

  const openmaptiles: JsonRecord = vendorSource
    ? {
        ...vendorSource,
        attribution:
          typeof vendorSource.attribution === "string" &&
          vendorSource.attribution.length > 0
            ? vendorSource.attribution
            : OPENFREEMAP_ATTRIBUTION,
      }
    : {
        type: "vector",
        url: OPENFREEMAP_VECTOR_SOURCE_URL,
        minzoom: 0,
        maxzoom: 14,
        attribution: OPENFREEMAP_ATTRIBUTION,
      };

  const fallback = buildEditorFallbackStyle(style) as JsonRecord;
  const baseLayers =
    Array.isArray(proxiedInput.layers) && proxiedInput.layers.length > 0
      ? proxiedInput.layers
      : fallback.layers;
  const layers = injectNavRideTrailLayers(baseLayers as unknown[], style);

  return {
    ...proxiedInput,
    version: 8,
    sources: {
      ...rawSources,
      openmaptiles,
    },
    sprite:
      typeof proxiedInput.sprite === "string" && proxiedInput.sprite.length > 0
        ? proxiedInput.sprite
        : OPENFREEMAP_SPRITE,
    glyphs:
      typeof proxiedInput.glyphs === "string" && proxiedInput.glyphs.length > 0
        ? proxiedInput.glyphs
        : OPENFREEMAP_GLYPHS,
    layers,
  };
}
