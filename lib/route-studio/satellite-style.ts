/**
 * Estilo satélite Esri + etiquetas vectoriales OpenFreeMap (OpenMapTiles).
 * Sin overlay raster opaco: solo capas symbol/line de etiquetas sobre el raster.
 */

const ESRI_ATTRIB =
  "© Esri, Maxar, Earthstar Geographics | © OpenMapTiles © OpenStreetMap";

const VECTOR_SOURCE = {
  type: "vector" as const,
  url: "https://tiles.openfreemap.org/planet",
  attribution: "© OpenMapTiles © OpenStreetMap contributors",
};

/** Estilo síncrono mínimo (satélite + labels vectoriales explícitos). */
export function buildSatelliteStyleSync(): object {
  return {
    version: 8,
    name: "NavRide Satellite + Labels",
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: {
      satellite: {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: ESRI_ATTRIB,
      },
      openmaptiles: VECTOR_SOURCE,
    },
    layers: [
      {
        id: "sat-bg",
        type: "raster",
        source: "satellite",
      },
      {
        id: "sat-road-casing",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 12,
        filter: ["!", ["has", "brunnel"]],
        paint: {
          "line-color": "#ffffff",
          "line-opacity": 0.22,
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            12,
            0.4,
            18,
            4,
          ],
        },
      },
      {
        id: "sat-highway-name",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "transportation_name",
        minzoom: 12,
        layout: {
          "symbol-placement": "line",
          "text-field": ["coalesce", ["get", "name:latin"], ["get", "name"]],
          "text-font": ["Noto Sans Regular"],
          "text-size": 11,
          "text-max-angle": 30,
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#000000",
          "text-halo-width": 1.4,
          "text-opacity": 0.92,
        },
      },
      {
        id: "sat-place-city",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "place",
        filter: ["in", ["get", "class"], ["literal", ["city", "town", "village", "suburb"]]],
        layout: {
          "text-field": ["coalesce", ["get", "name:latin"], ["get", "name"]],
          "text-font": ["Noto Sans Bold"],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6,
            11,
            12,
            16,
          ],
          "text-transform": "none",
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#000000",
          "text-halo-width": 1.6,
        },
      },
      {
        id: "sat-place-other",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "place",
        minzoom: 10,
        filter: [
          "!",
          ["in", ["get", "class"], ["literal", ["city", "town", "village", "suburb"]]],
        ],
        layout: {
          "text-field": ["coalesce", ["get", "name:latin"], ["get", "name"]],
          "text-font": ["Noto Sans Regular"],
          "text-size": 11,
        },
        paint: {
          "text-color": "#f3f4f6",
          "text-halo-color": "#000000",
          "text-halo-width": 1.2,
          "text-opacity": 0.85,
        },
      },
    ],
  };
}

type MlLayer = {
  id: string;
  type: string;
  source?: string;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  [key: string]: unknown;
};

type MlStyle = {
  version: number;
  glyphs?: string;
  sources?: Record<string, unknown>;
  layers?: MlLayer[];
  [key: string]: unknown;
};

/**
 * Si se puede fetch del liberty JSON: satélite + capas symbol/line de etiquetas
 * (sin fills opacos que tapen el raster).
 */
export async function buildSatelliteStyleFromLiberty(): Promise<object> {
  try {
    const res = await fetch("https://tiles.openfreemap.org/styles/liberty", {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return buildSatelliteStyleSync();
    const liberty = (await res.json()) as MlStyle;
    const keepTypes = new Set(["symbol", "line"]);
    const labelLayers = (liberty.layers ?? [])
      .filter((l) => keepTypes.has(l.type) && l.source === "openmaptiles")
      .filter((l) => {
        if (l.type === "symbol") return true;
        // Solo casing de vías a baja opacidad (no rellenos)
        const id = l.id.toLowerCase();
        return (
          id.includes("road") ||
          id.includes("highway") ||
          id.includes("transport") ||
          id.includes("bridge")
        );
      })
      .map((l) => {
        const paint = { ...(l.paint ?? {}) };
        if (l.type === "line") {
          const op = paint["line-opacity"];
          paint["line-opacity"] =
            typeof op === "number" ? Math.min(op, 0.28) : 0.22;
          if (!paint["line-color"]) paint["line-color"] = "#ffffff";
        }
        return {
          ...l,
          id: `sat-lbl-${l.id}`,
          paint,
        };
      });

    const sources: Record<string, unknown> = {
      satellite: {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: ESRI_ATTRIB,
      },
    };
    if (liberty.sources?.openmaptiles) {
      sources.openmaptiles = liberty.sources.openmaptiles;
    } else {
      sources.openmaptiles = VECTOR_SOURCE;
    }

    return {
      version: 8,
      name: "NavRide Satellite + Liberty Labels",
      glyphs:
        liberty.glyphs ??
        "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
      sources,
      layers: [
        { id: "sat-bg", type: "raster", source: "satellite" },
        ...labelLayers,
      ],
    };
  } catch {
    return buildSatelliteStyleSync();
  }
}

export const SATELLITE_ATTRIBUTION = ESRI_ATTRIB;
