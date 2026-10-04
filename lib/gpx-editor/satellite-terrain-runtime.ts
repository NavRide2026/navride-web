import {
  SATELLITE_DEFAULT_PITCH,
  SATELLITE_DEM_SOURCE,
  SATELLITE_DEM_SOURCE_ID,
  SATELLITE_HILLSHADE_LAYER,
  SATELLITE_HILLSHADE_LAYER_ID,
  SATELLITE_MAX_PITCH,
  SATELLITE_TERRAIN_SPEC,
} from "@/lib/route-studio/satellite-terrain";

type TerrainMap = {
  addSource: (id: string, source: object) => unknown;
  getSource: (id: string) => unknown;
  addLayer: (layer: object, before?: string) => unknown;
  getLayer: (id: string) => { id: string } | undefined;
  getStyle?: () => { layers?: Array<{ id: string }> };
  setTerrain?: (spec: { source: string; exaggeration?: number } | null) => unknown;
  getTerrain?: () => { source?: string } | null;
  setMaxPitch?: (pitch: number) => unknown;
  getPitch?: () => number;
  easeTo: (opts: { pitch: number; duration: number }) => unknown;
  dragRotate: { enable: () => void };
  touchZoomRotate: { enableRotation: () => void };
  touchPitch?: { enable: () => void };
};

export function disableEditorTerrain(map: TerrainMap): void {
  const m = map;
  try {
    if (typeof m.setMaxPitch === "function") m.setMaxPitch(60);
  } catch {
    /* ignore */
  }
  try {
    if (typeof m.setTerrain === "function") m.setTerrain(null);
  } catch {
    /* ignore */
  }
  try {
    if (typeof m.getPitch === "function" && m.getPitch() > 0.4) {
      m.easeTo({ pitch: 0, duration: 280 });
    }
  } catch {
    /* ignore */
  }
}

export function enableSatelliteTerrain(map: TerrainMap): boolean {
  const m = map;
  try {
    if (!m.getSource(SATELLITE_DEM_SOURCE_ID)) {
      m.addSource(SATELLITE_DEM_SOURCE_ID, SATELLITE_DEM_SOURCE);
    }
  } catch {
    return false;
  }

  try {
    if (!m.getLayer(SATELLITE_HILLSHADE_LAYER_ID)) {
      const before =
        m.getLayer("sat-road-casing")?.id ??
        (typeof m.getStyle === "function"
          ? m.getStyle()?.layers?.find((layer) => layer.id.startsWith("sat-lbl-"))?.id
          : undefined);
      if (before) m.addLayer(SATELLITE_HILLSHADE_LAYER, before);
      else m.addLayer(SATELLITE_HILLSHADE_LAYER);
    }
  } catch {
    // Hillshade is visual only; terrain mesh can still work without it.
  }

  try {
    if (typeof m.setMaxPitch === "function") m.setMaxPitch(SATELLITE_MAX_PITCH);
    if (typeof m.setTerrain === "function") {
      m.setTerrain(SATELLITE_TERRAIN_SPEC);
    }
  } catch {
    return false;
  }

  try {
    if (typeof m.getPitch === "function" && m.getPitch() < 12) {
      m.easeTo({ pitch: SATELLITE_DEFAULT_PITCH, duration: 700 });
    }
    m.dragRotate.enable();
    m.touchZoomRotate.enableRotation();
    if ("touchPitch" in m && m.touchPitch && typeof m.touchPitch.enable === "function") {
      m.touchPitch.enable();
    }
  } catch {
    /* camera helpers are best-effort */
  }

  return Boolean(m.getTerrain?.()?.source === SATELLITE_DEM_SOURCE_ID);
}

export function syncEditorTerrain(map: TerrainMap, styleId: string): void {
  if (styleId === "satellite") {
    enableSatelliteTerrain(map);
    return;
  }
  disableEditorTerrain(map);
}

export function satelliteStyleHasTerrain(style: {
  sources?: Record<string, { type?: string; encoding?: string }>;
  terrain?: { source?: string } | null;
}): boolean {
  const s = style as {
    sources?: Record<string, { type?: string; encoding?: string }>;
    terrain?: { source?: string } | null;
  };
  const dem = s.sources?.[SATELLITE_DEM_SOURCE_ID];
  return (
    dem?.type === "raster-dem" &&
    dem.encoding === "terrarium" &&
    s.terrain?.source === SATELLITE_DEM_SOURCE_ID
  );
}
