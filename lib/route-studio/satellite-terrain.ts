/**
 * 3D terrain for satellite Editor GPX.
 *
 * DEM: AWS Terrain Tiles / Mapzen Terrarium (Open Data, no API key).
 * Encoding: Terrarium PNG. MapLibre 6.11 raster-dem default is "mapbox";
 * this source MUST set encoding: "terrarium".
 *
 * Tiles are served through a same-origin allowlisted proxy so browser CSP/CORS
 * do not silently leave the satellite raster as a pitched plane.
 */

export const SATELLITE_DEM_SOURCE_ID = "navride-terrain-dem";
export const SATELLITE_HILLSHADE_LAYER_ID = "navride-terrain-hillshade";

export const SATELLITE_TERRAIN_EXAGGERATION = 1.55;
export const SATELLITE_MAX_PITCH = 75;
export const SATELLITE_DEFAULT_PITCH = 58;

/** Same-origin proxy of AWS Open Data Terrarium tiles. */
export const SATELLITE_DEM_TILES_URL =
  "/api/map-dem/terrarium/{z}/{x}/{y}.png";

export const SATELLITE_DEM_ATTRIBUTION =
  "Terrain © Mapzen / AWS Terrain Tiles (Open Data)";

export const SATELLITE_DEM_SOURCE = {
  type: "raster-dem" as const,
  tiles: [SATELLITE_DEM_TILES_URL],
  tileSize: 256,
  minzoom: 0,
  maxzoom: 15,
  encoding: "terrarium" as const,
  attribution: SATELLITE_DEM_ATTRIBUTION,
};

export const SATELLITE_TERRAIN_SPEC = {
  source: SATELLITE_DEM_SOURCE_ID,
  exaggeration: SATELLITE_TERRAIN_EXAGGERATION,
};

export const SATELLITE_HILLSHADE_LAYER = {
  id: SATELLITE_HILLSHADE_LAYER_ID,
  type: "hillshade" as const,
  source: SATELLITE_DEM_SOURCE_ID,
  maxzoom: 16,
  paint: {
    "hillshade-exaggeration": 0.38,
    "hillshade-shadow-color": "#1a1c18",
    "hillshade-highlight-color": "#fff8e8",
    "hillshade-illumination-direction": 315,
    "hillshade-illumination-anchor": "viewport" as const,
  },
};

export function isSatelliteTerrainEnabled(style: {
  sources?: Record<string, unknown>;
  terrain?: { source?: string } | null;
}): boolean {
  const source = style.sources?.[SATELLITE_DEM_SOURCE_ID] as
    | { type?: string; encoding?: string }
    | undefined;
  return (
    source?.type === "raster-dem" &&
    source.encoding === "terrarium" &&
    style.terrain?.source === SATELLITE_DEM_SOURCE_ID
  );
}

/** Known mountain samples for elevation contracts / QA. */
export const TERRAIN_QA_SAMPLES = [
  { name: "Aneto", lng: 0.657, lat: 42.632, minM: 2500, maxM: 3800 },
  { name: "Benasque valley", lng: 0.522, lat: 42.604, minM: 900, maxM: 1600 },
  { name: "Mulhacen", lng: -3.311, lat: 37.053, minM: 2800, maxM: 3700 },
] as const;
