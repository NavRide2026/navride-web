"use client";

import { useEffect, useRef, type MutableRefObject, type RefObject } from "react";
import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import {
  buildSatelliteStyleFromLiberty,
} from "@/lib/route-studio/satellite-style";
import {
  buildEditorFallbackStyle,
  EDITOR_BASE_STYLE_URLS,
} from "@/lib/route-studio/editor-map-style";
import type { StyleId } from "./editor-types";
import {
  GpxMapAdapter,
  type GpxMapSnapshot,
} from "./map-adapter";
import { syncEditorTerrain } from "./satellite-terrain-runtime";

const INITIAL_CENTER: [number, number] = [-3.7, 40.4];
const MAPLIBRE_WORKER_URL = "/maplibre/maplibre-gl-worker.mjs";

async function loadEditorStyle(styleId: StyleId): Promise<StyleSpecification> {
  if (styleId === "satellite") {
    return (await buildSatelliteStyleFromLiberty()) as StyleSpecification;
  }

  const url = EDITOR_BASE_STYLE_URLS[styleId];
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`Map style HTTP ${response.status}`);
    }
    const style = (await response.json()) as StyleSpecification;
    return absolutizeMapStyleUrls(style, window.location.origin);
  } catch {
    return absolutizeMapStyleUrls(
      buildEditorFallbackStyle(styleId) as StyleSpecification,
      window.location.origin,
    );
  }
}

function absolutizeMapStyleUrls(
  style: StyleSpecification,
  origin: string,
): StyleSpecification {
  const root = structuredClone(style) as StyleSpecification & {
    sprite?: string;
    glyphs?: string;
    sources?: Record<string, { url?: string; tiles?: string[] }>;
  };

  const toAbsolute = (value: string | undefined) => {
    if (!value) return value;
    if (/^https?:\/\//i.test(value) || value.startsWith("blob:")) return value;
    if (value.startsWith("/")) return `${origin}${value}`;
    return value;
  };

  if (typeof root.sprite === "string") root.sprite = toAbsolute(root.sprite);
  if (typeof root.glyphs === "string") root.glyphs = toAbsolute(root.glyphs);

  if (root.sources) {
    for (const source of Object.values(root.sources)) {
      if (!source) continue;
      if (typeof source.url === "string") source.url = toAbsolute(source.url);
      if (Array.isArray(source.tiles)) {
        source.tiles = source.tiles.map((tile) => toAbsolute(tile) ?? tile);
      }
    }
  }

  return root;
}

export interface UseGpxMapOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  mapRef: MutableRefObject<MapLibreMap | null>;
  mapReadyRef: MutableRefObject<boolean>;
  adapterRef: MutableRefObject<GpxMapAdapter | null>;
  styleChangingRef: MutableRefObject<boolean>;
  getSnapshot: () => GpxMapSnapshot;
  styleId: StyleId;
  bindEvents: (map: MapLibreMap) => void;
}

export function useGpxMap(options: UseGpxMapOptions): void {
  const {
    containerRef,
    mapRef,
    mapReadyRef,
    adapterRef,
    styleChangingRef,
    getSnapshot,
    styleId,
    bindEvents,
  } = options;

  const getSnapshotRef = useRef(getSnapshot);
  const bindEventsRef = useRef(bindEvents);
  const initialStyleIdRef = useRef<StyleId>(styleId);
  const skipFirstStyleEffectRef = useRef(true);

  useEffect(() => {
    getSnapshotRef.current = getSnapshot;
    bindEventsRef.current = bindEvents;
  }, [getSnapshot, bindEvents]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const lifecycle = new AbortController();

    void (async () => {
      const maplibre = await import("maplibre-gl");
      if (lifecycle.signal.aborted || !containerRef.current) return;

      try {
        maplibre.setWorkerUrl(MAPLIBRE_WORKER_URL);
      } catch {
        // Continue with the package default worker if the helper is unavailable.
      }

      const style = await loadEditorStyle(initialStyleIdRef.current);
      if (lifecycle.signal.aborted || !containerRef.current) return;

      const map = new maplibre.Map({
        container: containerRef.current,
        style,
        center: INITIAL_CENTER,
        zoom: 5,
        maxZoom: 20,
        maxPitch: initialStyleIdRef.current === "satellite" ? 75 : 60,
        pitch: initialStyleIdRef.current === "satellite" ? 58 : 0,
        attributionControl: { compact: true },
      });
      mapRef.current = map;
      const adapter = new GpxMapAdapter(map);
      adapterRef.current = adapter;

      map.on("load", () => {
        if (lifecycle.signal.aborted) return;
        adapter.setupLayers(getSnapshotRef.current());
        syncEditorTerrain(map as never, getSnapshotRef.current().styleId);
        mapReadyRef.current = true;
        styleChangingRef.current = false;
        bindEventsRef.current(map);
      });

      map.on("style.load", () => {
        if (lifecycle.signal.aborted) return;
        const snapshot = getSnapshotRef.current();
        map.setMaxZoom(snapshot.styleId === "satellite" ? 19 : 20);
        adapter.setupLayers(snapshot);
        syncEditorTerrain(map as never, snapshot.styleId);
        mapReadyRef.current = true;
        styleChangingRef.current = false;
      });
    })();

    return () => {
      lifecycle.abort();
      adapterRef.current?.destroy();
      adapterRef.current = null;
      mapRef.current = null;
      mapReadyRef.current = false;
    };
  }, [adapterRef, containerRef, mapReadyRef, mapRef, styleChangingRef]);

  useEffect(() => {
    if (skipFirstStyleEffectRef.current) {
      skipFirstStyleEffectRef.current = false;
      return;
    }

    const map = mapRef.current;
    const adapter = adapterRef.current;
    if (!map || !adapter) return;
    const lifecycle = new AbortController();
    mapReadyRef.current = false;
    adapter.invalidate();
    styleChangingRef.current = true;

    void (async () => {
      if (styleId === "satellite") {
        const style = await buildSatelliteStyleFromLiberty();
        if (!lifecycle.signal.aborted) {
          map.setStyle(style as StyleSpecification);
        }
        return;
      }

      const style = await loadEditorStyle(styleId);
      if (!lifecycle.signal.aborted) {
        map.setStyle(style);
      }
    })();

    return () => {
      lifecycle.abort();
    };
  }, [styleId, adapterRef, mapReadyRef, mapRef, styleChangingRef]);
}
