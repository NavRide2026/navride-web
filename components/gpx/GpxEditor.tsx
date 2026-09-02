"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Trash2, Undo2, Redo2, Download, MapPin, Plus,
  RotateCw, Loader2, AlertCircle, CheckCircle2, X,
  Navigation, Maximize2, Cloud, Smartphone, Link2,
  Layers, Palette, SlidersHorizontal, PanelRightClose, PanelRightOpen,
  ChevronUp, ChevronDown, Crosshair, Upload,
} from "lucide-react";
import {
  tryOpenNavRideApp,
  buildRouteDeepLinks,
  copyRouteLink,
} from "@/lib/gpx/saveRouteToCloud";
import { RouteDoctorPanel } from "@/components/route-studio/capability-panels";
import { TrackColorPicker } from "@/components/route-studio/track-color-picker";
import {
  routeWaypoints,
  snapClickToRoute,
  detectAbsurdDetour,
  TRANSPORT_MODES,
  type TransportMode,
} from "@/lib/route-studio/routing";
import { analyzeRouteHealth } from "@/lib/route-studio/route-health";
import { saveDraft, loadDraft, clearDraft } from "@/lib/route-studio/autosave";
import { type EditorMode } from "@/lib/route-studio/mode-capabilities";
import {
  DEFAULT_TRACK_WIDTH,
  DEFAULT_TRACK_OPACITY,
  HISTORY_CAP,
  casingWidth,
  casingOpacity,
  casingColor,
  clampTrackWidth,
  clampTrackOpacity,
  ensureMinBrightness,
} from "@/lib/route-studio/track-style";
import {
  buildSatelliteStyleSync,
  buildSatelliteStyleFromLiberty,
  SATELLITE_ATTRIBUTION,
} from "@/lib/route-studio/satellite-style";
import {
  exportGpxWithExtensions,
  parseGpxFile,
} from "@/lib/route-studio/navride-route/gpx-codec";
import {
  createEmptyRoute,
  toggleViaShaping,
  type NavRideCue,
  type NavRideCueSeverity,
  type NavRidePointKind,
  type NavRideRoute,
} from "@/lib/route-studio/navride-route/types";
import {
  createCue,
  cueSeverityLabel,
  CUE_SEVERITY_LABELS_ES,
} from "@/lib/route-studio/cues";

// ─── Types ────────────────────────────────────────────────────────────────────
type LngLat = [number, number];
type WaypointKind = Extract<NavRidePointKind, "via" | "shaping">;

interface Segment {
  id: string;
  name: string;
  color: string;
  waypoints: LngLat[];
  /** Parallel to waypoints — via (default) or shaping. */
  waypointKinds?: WaypointKind[];
  routePoints: LngLat[];
  routingFailed?: boolean;
  absurdDetour?: boolean;
}

type ImportDialogState = {
  issues: string[];
  geometry: { lat: number; lon: number; ele?: number | null }[];
  extensions: NavRideRoute | null;
  fileName: string;
};

// ─── Map styles ───────────────────────────────────────────────────────────────
type StyleId = "liberty" | "satellite" | "bright" | "positron";

const MAP_STYLES: { id: StyleId; label: string; url: string | object }[] = [
  { id: "liberty",   label: "Rutas",     url: "https://tiles.openfreemap.org/styles/liberty"   },
  { id: "satellite", label: "Satélite",  url: buildSatelliteStyleSync()                       },
  { id: "bright",    label: "Outdoor",   url: "https://tiles.openfreemap.org/styles/bright"    },
  { id: "positron",  label: "Claro",     url: "https://tiles.openfreemap.org/styles/positron"  },
];

// ─── Constants ────────────────────────────────────────────────────────────────
const SRC_LINES  = "nav-lines";
const SRC_POINTS = "nav-points";
const SRC_USER   = "nav-user";
const LYR_CASING = "nav-casing";
const LYR_GLOW   = "nav-glow";
const LYR_LINES  = "nav-lyr-lines";
const LYR_POINTS = "nav-lyr-points";
const LYR_USER   = "nav-user-dot";
const LYR_USER_RING = "nav-user-ring";

const COLORS = [
  { label: "Naranja", value: "#f97316", desc: "General"            },
  { label: "Rojo",    value: "#ef4444", desc: "Trialera / Difícil" },
  { label: "Verde",   value: "#22c55e", desc: "Pista rápida"       },
  { label: "Azul",    value: "#3b82f6", desc: "Asfalto"            },
  { label: "Amarillo",value: "#eab308", desc: "Pista media"        },
  { label: "Morado",  value: "#a855f7", desc: "Single track"       },
  { label: "Blanco",  value: "#e5e7eb", desc: "Marcador"           },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function uid(): string { return Math.random().toString(36).slice(2, 9); }

function haversineKm(a: LngLat, b: LngLat): number {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const la1  = (a[1] * Math.PI) / 180;
  const la2  = (b[1] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

function segKm(pts: LngLat[]): number {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += haversineKm(pts[i - 1], pts[i]);
  return d;
}

function totalKm(segs: Segment[]): number {
  return segs.reduce(
    (a, s) => a + segKm(s.routePoints.length >= 2 ? s.routePoints : s.waypoints),
    0,
  );
}

async function routeForMode(
  waypoints: LngLat[],
  mode: TransportMode,
): Promise<{ points: LngLat[]; ok: boolean; message?: string; absurd?: boolean }> {
  const result = await routeWaypoints(waypoints, mode);
  if (!result.ok) {
    return { points: [], ok: false, message: result.message };
  }
  const absurd = detectAbsurdDetour(waypoints, result.points);
  return {
    points: result.points,
    ok: true,
    absurd,
    message: absurd
      ? "Desvío absurdo detectado — revisa el waypoint o el modo de transporte."
      : undefined,
  };
}

function buildGeoJSON(segs: Segment[], activeWpt: { segId: string; idx: number } | null) {
  // Solo dibujar geometría enrutada OK — nunca línea recta falsa como éxito
  const lines = segs
    .filter(s => s.routePoints.length >= 2 && !s.routingFailed)
    .map(s => ({
      type: "Feature" as const,
      properties: { color: s.color },
      geometry: {
        type: "LineString" as const,
        coordinates: s.routePoints,
      },
    }));

  const points = segs.flatMap(s =>
    s.waypoints.map((p, pi) => ({
      type: "Feature" as const,
      properties: {
        color: s.color,
        segId: s.id,
        ptIdx: pi,
        active: activeWpt?.segId === s.id && activeWpt.idx === pi ? 1 : 0,
      },
      geometry: { type: "Point" as const, coordinates: p },
    })),
  );

  return {
    lines:  { type: "FeatureCollection" as const, features: lines  },
    points: { type: "FeatureCollection" as const, features: points },
  };
}

function ensureWaypointKinds(seg: Segment): WaypointKind[] {
  const kinds = seg.waypointKinds ? [...seg.waypointKinds] : [];
  while (kinds.length < seg.waypoints.length) kinds.push("via");
  return kinds.slice(0, seg.waypoints.length);
}

function buildRouteJson(
  segs: Segment[],
  title: string,
  cues: NavRideCue[],
  trackPts: LngLat[],
): NavRideRoute {
  const viaPoints = segs.flatMap((s) => {
    const kinds = ensureWaypointKinds(s);
    return s.waypoints
      .map((p, i) => ({ p, kind: kinds[i] ?? "via", i }))
      .filter((x) => x.kind === "via")
      .map(({ p, i }) => ({
        pointId: `${s.id}-via-${i}`,
        kind: "via" as const,
        lat: p[1],
        lon: p[0],
      }));
  });
  const shapingPoints = segs.flatMap((s) => {
    const kinds = ensureWaypointKinds(s);
    return s.waypoints
      .map((p, i) => ({ p, kind: kinds[i] ?? "via", i }))
      .filter((x) => x.kind === "shaping")
      .map(({ p, i }) => ({
        pointId: `${s.id}-shp-${i}`,
        kind: "shaping" as const,
        lat: p[1],
        lon: p[0],
      }));
  });
  const geometryPts = trackPts.map(([lon, lat]) => ({ lat, lon }));
  const segments = segs.map((s, si) => {
    const start = segs
      .slice(0, si)
      .reduce(
        (a, x) =>
          a + (x.routePoints.length >= 2 && !x.routingFailed ? x.routePoints.length : 0),
        0,
      );
    const len =
      s.routePoints.length >= 2 && !s.routingFailed ? s.routePoints.length : 0;
    return {
      segmentId: s.id,
      name: s.name,
      startIndex: start,
      endIndex: Math.max(start, start + Math.max(0, len - 1)),
      customColor: s.color,
      pathKind: "routed" as const,
      snapStatus: s.routingFailed ? ("unmatched" as const) : ("matched" as const),
      cueIds: cues.filter((c) => c.segmentId === s.id).map((c) => c.cueId),
    };
  });
  return createEmptyRoute({
    routeId: `web-${segs[0]?.id ?? uid()}`,
    name: title,
    geometry: { points: geometryPts, segmentBreaks: [] },
    segments,
    viaPoints,
    shapingPoints,
    cues,
    styles: segs.map((s) => ({
      styleId: `style-${s.id}`,
      scope: "segment" as const,
      segmentId: s.id,
      color: s.color,
    })),
    offlineRequirements: {},
    metadata: { source: "web-route-studio" },
  });
}

function exportGpx(segs: Segment[], title: string, cues: NavRideCue[] = []): string {
  const pts = segs.flatMap((s) =>
    s.routePoints.length >= 2 && !s.routingFailed ? s.routePoints : [],
  );
  const trackPoints = pts.map(([lon, lat]) => ({ lat, lon }));
  const routeJson = buildRouteJson(segs, title, cues, pts);
  return exportGpxWithExtensions(routeJson, title, trackPoints);
}

function mkSeg(color = COLORS[0].value): Segment {
  return {
    id: uid(),
    name: "Segmento",
    color: ensureMinBrightness(color),
    waypoints: [],
    waypointKinds: [],
    routePoints: [],
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
const INIT_SEG = mkSeg();

export default function GpxEditor() {
  const mapContainer = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef   = useRef<any>(null);
  const mapReady = useRef(false);

  const [segments,   setSegments]   = useState<Segment[]>([INIT_SEG]);
  const [activeId,   setActiveId]   = useState<string>(INIT_SEG.id);
  const [mapStyleId, setMapStyleId] = useState<StyleId>("liberty");
  const [routeTitle, setRouteTitle] = useState("Mi ruta NavRide");
  const [routing,    setRouting]    = useState(false);
  const [histIdx,    setHistIdx]    = useState(0);
  const [histLen,    setHistLen]    = useState(1);
  const [uploading,  setUploading]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [uploadMsg,  setUploadMsg]  = useState<{ ok: boolean; text: string } | null>(null);
  const [savedRouteId, setSavedRouteId] = useState<string | null>(null);
  const [savedSignature, setSavedSignature] = useState("");
  const [transportMode, setTransportMode] = useState<TransportMode>("moto");
  const [editorMode, setEditorMode] = useState<EditorMode>("simple");
  const [routeError, setRouteError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [draftBanner, setDraftBanner] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const draft = loadDraft();
    if (draft?.segments && Array.isArray(draft.segments)) {
      return `Borrador del ${new Date(draft.savedAt).toLocaleString("es-ES")}`;
    }
    return null;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeWpt, setActiveWpt] = useState<{ segId: string; idx: number } | null>(null);
  const [trackWidth, setTrackWidth] = useState(DEFAULT_TRACK_WIDTH);
  const [trackOpacity, setTrackOpacity] = useState(DEFAULT_TRACK_OPACITY);
  const [userLngLat, setUserLngLat] = useState<LngLat | null>(null);
  const [insertMode, setInsertMode] = useState(false);
  const [cues, setCues] = useState<NavRideCue[]>([]);
  const [cueDraftSeverity, setCueDraftSeverity] = useState<NavRideCueSeverity>("attention");
  const [cueDraftMessage, setCueDraftMessage] = useState("");
  const [importDialog, setImportDialog] = useState<ImportDialogState | null>(null);
  const gpxFileInputRef = useRef<HTMLInputElement>(null);

  const transportModeRef = useRef<TransportMode>("moto");
  const editorModeRef = useRef<EditorMode>("simple");
  const trackWidthRef = useRef(DEFAULT_TRACK_WIDTH);
  const trackOpacityRef = useRef(DEFAULT_TRACK_OPACITY);
  const mapStyleIdRef = useRef<StyleId>("liberty");
  const activeWptRef = useRef<{ segId: string; idx: number } | null>(null);
  const insertModeRef = useRef(false);

  // Mobile / UI state
  const [drawerOpen,        setDrawerOpen]        = useState(false);
  const [styleMenuOpen,     setStyleMenuOpen]     = useState(false);
  const [colorPopoverSegId, setColorPopoverSegId] = useState<string | null>(null);

  // Refs to avoid stale closures inside map handlers
  const segsRef      = useRef<Segment[]>([INIT_SEG]);
  const activeIdRef  = useRef<string>(INIT_SEG.id);
  const histRef      = useRef<Segment[][]>([[INIT_SEG]]);
  const histIdxRef   = useRef(0);
  const styleChangingRef = useRef(false);

  useEffect(() => { segsRef.current = segments; },   [segments]);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);
  useEffect(() => { transportModeRef.current = transportMode; }, [transportMode]);
  useEffect(() => { editorModeRef.current = editorMode; }, [editorMode]);
  useEffect(() => { trackWidthRef.current = trackWidth; }, [trackWidth]);
  useEffect(() => { trackOpacityRef.current = trackOpacity; }, [trackOpacity]);
  useEffect(() => { mapStyleIdRef.current = mapStyleId; }, [mapStyleId]);
  useEffect(() => { activeWptRef.current = activeWpt; }, [activeWpt]);
  useEffect(() => { insertModeRef.current = insertMode; }, [insertMode]);

  useEffect(() => {
    const t = setTimeout(() => {
      saveDraft({
        savedAt: new Date().toISOString(),
        routeTitle,
        transportMode,
        editorMode,
        segments,
        trackColor: segments[0]?.color,
      });
    }, 1500);
    return () => clearTimeout(t);
  }, [segments, routeTitle, transportMode, editorMode]);

  // ── Map sync ──
  const syncMap = useCallback((segs: Segment[], wptSel?: { segId: string; idx: number } | null) => {
    const map = mapRef.current;
    if (!map || !mapReady.current) return;
    const { lines, points } = buildGeoJSON(segs, wptSel === undefined ? activeWptRef.current : wptSel);
    try {
      map.getSource(SRC_LINES)?.setData(lines);
      map.getSource(SRC_POINTS)?.setData(points);
    } catch { /* style change in progress */ }
  }, []);

  const applyTrackPaint = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapReady.current) return;
    const sat = mapStyleIdRef.current === "satellite";
    const w = trackWidthRef.current;
    const o = trackOpacityRef.current;
    try {
      if (map.getLayer(LYR_CASING)) {
        map.setPaintProperty(LYR_CASING, "line-width", casingWidth(w));
        map.setPaintProperty(LYR_CASING, "line-opacity", casingOpacity(o, sat));
        map.setPaintProperty(LYR_CASING, "line-color", casingColor(sat));
      }
      if (map.getLayer(LYR_GLOW)) {
        map.setPaintProperty(LYR_GLOW, "line-width", w * 2.8);
        map.setPaintProperty(LYR_GLOW, "line-opacity", Math.min(0.35, o * 0.28));
      }
      if (map.getLayer(LYR_LINES)) {
        map.setPaintProperty(LYR_LINES, "line-width", w);
        map.setPaintProperty(LYR_LINES, "line-opacity", o);
      }
    } catch { /* */ }
  }, []);

  useEffect(() => { syncMap(segments); }, [segments, syncMap, activeWpt]);
  useEffect(() => { applyTrackPaint(); }, [trackWidth, trackOpacity, mapStyleId, applyTrackPaint]);

  const syncUserMarker = useCallback((ll: LngLat | null) => {
    const map = mapRef.current;
    if (!map || !mapReady.current) return;
    const data = {
      type: "FeatureCollection" as const,
      features: ll
        ? [{
            type: "Feature" as const,
            properties: {},
            geometry: { type: "Point" as const, coordinates: ll },
          }]
        : [],
    };
    try {
      map.getSource(SRC_USER)?.setData(data);
    } catch { /* */ }
  }, []);

  useEffect(() => { syncUserMarker(userLngLat); }, [userLngLat, syncUserMarker]);

  // ── History ──
  const pushHist = useCallback((segs: Segment[]) => {
    const trimmed = histRef.current.slice(0, histIdxRef.current + 1);
    let h = [...trimmed, JSON.parse(JSON.stringify(segs))];
    if (h.length > HISTORY_CAP) {
      h = h.slice(h.length - HISTORY_CAP);
    }
    histRef.current = h;
    histIdxRef.current = h.length - 1;
    setHistIdx(histIdxRef.current);
    setHistLen(h.length);
  }, []);

  // ── Map init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    if (!document.getElementById("ml-css")) {
      const link = document.createElement("link");
      link.id  = "ml-css";
      link.rel  = "stylesheet";
      link.href = "https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css";
      document.head.appendChild(link);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any;
    let dragInfo: { segId: string; ptIdx: number } | null = null;
    let eventsAttached = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setupLayers = (m: any) => {
      [LYR_USER, LYR_USER_RING, LYR_POINTS, LYR_LINES, LYR_GLOW, LYR_CASING].forEach(l => {
        if (m.getLayer(l)) m.removeLayer(l);
      });
      [SRC_LINES, SRC_POINTS, SRC_USER].forEach(s => {
        if (m.getSource(s)) m.removeSource(s);
      });

      const { lines, points } = buildGeoJSON(segsRef.current, activeWptRef.current);
      const sat = mapStyleIdRef.current === "satellite";
      const w = trackWidthRef.current;
      const o = trackOpacityRef.current;

      m.addSource(SRC_LINES,  { type: "geojson", data: lines  });
      m.addSource(SRC_POINTS, { type: "geojson", data: points });
      m.addSource(SRC_USER, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      // Route layers ABOVE satellite label layers (added last = on top)
      m.addLayer({
        id: LYR_CASING,
        type: "line",
        source: SRC_LINES,
        paint: {
          "line-color":   casingColor(sat),
          "line-width":   casingWidth(w),
          "line-opacity": casingOpacity(o, sat),
          "line-cap":     "round",
          "line-join":    "round",
        },
      });

      m.addLayer({
        id: LYR_GLOW,
        type: "line",
        source: SRC_LINES,
        paint: {
          "line-color":   ["get", "color"],
          "line-width":   w * 2.8,
          "line-opacity": Math.min(0.35, o * 0.28),
          "line-blur":    8,
        },
      });

      m.addLayer({
        id: LYR_LINES,
        type: "line",
        source: SRC_LINES,
        paint: {
          "line-color":   ["get", "color"],
          "line-width":   w,
          "line-opacity": o,
          "line-cap":     "round",
          "line-join":    "round",
        },
      });

      m.addLayer({
        id: LYR_POINTS,
        type: "circle",
        source: SRC_POINTS,
        paint: {
          "circle-radius": [
            "case",
            ["==", ["get", "active"], 1],
            10,
            7,
          ],
          "circle-color":          ["get", "color"],
          "circle-stroke-color":   [
            "case",
            ["==", ["get", "active"], 1],
            "#FF5A1F",
            "#ffffff",
          ],
          "circle-stroke-width":   [
            "case",
            ["==", ["get", "active"], 1],
            3.5,
            2.5,
          ],
          "circle-stroke-opacity": 1,
        },
      });

      m.addLayer({
        id: LYR_USER_RING,
        type: "circle",
        source: SRC_USER,
        paint: {
          "circle-radius": 14,
          "circle-color": "#3b82f6",
          "circle-opacity": 0.25,
        },
      });
      m.addLayer({
        id: LYR_USER,
        type: "circle",
        source: SRC_USER,
        paint: {
          "circle-radius": 7,
          "circle-color": "#3b82f6",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2.5,
        },
      });

      mapReady.current = true;
      styleChangingRef.current = false;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const attachEvents = (m: any) => {
      if (eventsAttached) return;
      eventsAttached = true;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      m.on("click", LYR_POINTS, (e: any) => {
        if (!e.features?.[0]) return;
        e.originalEvent?.stopPropagation?.();
        const props = e.features[0].properties;
        const sel = { segId: String(props.segId), idx: Number(props.ptIdx) };
        setActiveWpt(sel);
        activeWptRef.current = sel;
        setActiveId(sel.segId);
        activeIdRef.current = sel.segId;
        syncMap(segsRef.current, sel);
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      m.on("click", async (e: any) => {
        const hit = m.queryRenderedFeatures(e.point, { layers: [LYR_POINTS] });
        if (hit.length > 0) return;
        if (styleChangingRef.current) return;

        const { lng, lat } = e.lngLat;
        let newPt: LngLat = [lng, lat];
        const aId  = activeIdRef.current;
        const curr = segsRef.current;
        const activeSeg0 = curr.find(s => s.id === aId);
        const mode = transportModeRef.current;

        // Snap click to road when possible
        const prev =
          activeSeg0 && activeSeg0.waypoints.length > 0
            ? activeSeg0.waypoints[activeSeg0.waypoints.length - 1]
            : null;
        const snapped = await snapClickToRoute(newPt, prev, mode);
        newPt = snapped.snapped;

        // Insert between selected waypoint and next (advanced)
        let withPt: Segment[];
        if (
          insertModeRef.current &&
          editorModeRef.current === "advanced" &&
          activeWptRef.current &&
          activeWptRef.current.segId === aId
        ) {
          const idx = activeWptRef.current.idx;
          withPt = curr.map(s => {
            if (s.id !== aId) return s;
            const wpts = [...s.waypoints];
            const kinds = ensureWaypointKinds(s);
            wpts.splice(idx + 1, 0, newPt);
            kinds.splice(idx + 1, 0, "via");
            return { ...s, waypoints: wpts, waypointKinds: kinds };
          });
          setInsertMode(false);
          insertModeRef.current = false;
        } else {
          withPt = curr.map(s =>
            s.id !== aId
              ? s
              : {
                  ...s,
                  waypoints: [...s.waypoints, newPt],
                  waypointKinds: [...ensureWaypointKinds(s), "via"],
                },
          );
        }

        segsRef.current = withPt;
        setSegments(withPt);
        syncMap(withPt);

        const activeSeg = withPt.find(s => s.id === aId);
        if (!activeSeg || activeSeg.waypoints.length < 2) {
          pushHist(withPt);
          return;
        }

        setRouting(true);
        setRouteError(null);
        const routed = await routeForMode(activeSeg.waypoints, mode);
        if (!routed.ok) {
          setRouteError(routed.message ?? "Punto inalcanzable — no se dibuja línea recta.");
        } else if (routed.absurd && editorModeRef.current === "advanced") {
          setRouteError(routed.message ?? "Desvío absurdo detectado.");
        }
        setSegments(prev => {
          const r = prev.map(s => s.id === aId ? {
            ...s,
            routePoints: routed.ok ? routed.points : [],
            routingFailed: !routed.ok,
            absurdDetour: !!routed.absurd,
          } : s);
          segsRef.current = r;
          syncMap(r);
          pushHist(r);
          return r;
        });
        setRouting(false);
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      m.on("mousedown", LYR_POINTS, (e: any) => {
        e.preventDefault();
        const props = e.features[0].properties;
        dragInfo = { segId: String(props.segId), ptIdx: Number(props.ptIdx) };
        const sel = { segId: dragInfo.segId, idx: dragInfo.ptIdx };
        setActiveWpt(sel);
        activeWptRef.current = sel;
        m.getCanvas().style.cursor = "grabbing";
        m.dragPan.disable();
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      m.on("mousemove", (e: any) => {
        if (!dragInfo) return;
        const { lng, lat } = e.lngLat;
        const upd = segsRef.current.map(s => {
          if (s.id !== dragInfo!.segId) return s;
          const wpts = [...s.waypoints];
          wpts[dragInfo!.ptIdx] = [lng, lat];
          return { ...s, waypoints: wpts };
        });
        segsRef.current = upd;
        setSegments(upd);
        syncMap(upd);
      });

      m.on("mouseup", async () => {
        if (!dragInfo) return;
        const di = dragInfo;
        dragInfo = null;
        m.getCanvas().style.cursor = "";
        m.dragPan.enable();

        const seg = segsRef.current.find(s => s.id === di.segId);
        if (!seg || seg.waypoints.length < 2) {
          pushHist(segsRef.current);
          return;
        }

        setRouting(true);
        setRouteError(null);
        const routed = await routeForMode(seg.waypoints, transportModeRef.current);
        if (!routed.ok) {
          setRouteError(routed.message ?? "Punto inalcanzable — no se dibuja línea recta.");
        } else if (routed.absurd && editorModeRef.current === "advanced") {
          setRouteError(routed.message ?? "Desvío absurdo detectado.");
        }
        setSegments(prev => {
          const r = prev.map(s => s.id === di.segId ? {
            ...s,
            routePoints: routed.ok ? routed.points : [],
            routingFailed: !routed.ok,
            absurdDetour: !!routed.absurd,
          } : s);
          segsRef.current = r;
          syncMap(r);
          pushHist(r);
          return r;
        });
        setRouting(false);
      });

      m.on("mouseenter", LYR_POINTS, () => {
        if (!dragInfo) m.getCanvas().style.cursor = "grab";
      });
      m.on("mouseleave", LYR_POINTS, () => {
        if (!dragInfo) m.getCanvas().style.cursor = "";
      });
    };

    import("maplibre-gl").then((ml) => {
      map = new ml.Map({
        container: mapContainer.current!,
        style: MAP_STYLES[0].url as string,
        center: [-3.7, 40.4],
        zoom: 5,
        attributionControl: { compact: true },
      });
      mapRef.current = map;

      map.on("load", () => {
        setupLayers(map);
        attachEvents(map);
      });

      map.on("style.load", () => {
        if (!eventsAttached) return;
        setupLayers(map);
        syncUserMarker(
          // read latest via closure — userLngLat may be stale; source syncs via effect
          null,
        );
      });
    });

    return () => {
      map?.remove();
      mapRef.current   = null;
      mapReady.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Style switcher effect ─────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let cancelled = false;

    (async () => {
      mapReady.current = false;
      styleChangingRef.current = true;
      if (mapStyleId === "satellite") {
        const style = await buildSatelliteStyleFromLiberty();
        if (cancelled) return;
        map.setStyle(style as object);
      } else {
        const style = MAP_STYLES.find(s => s.id === mapStyleId);
        if (!style) return;
        map.setStyle(style.url as object);
      }
    })();

    return () => { cancelled = true; };
  }, [mapStyleId]);

  // Re-route all segments when transport mode changes (advanced capability; also useful always)
  const rerouteAll = useCallback(async (mode: TransportMode) => {
    const curr = segsRef.current;
    const need = curr.filter(s => s.waypoints.length >= 2);
    if (need.length === 0) return;
    setRouting(true);
    setRouteError(null);
    const next = [...curr];
    for (let i = 0; i < next.length; i++) {
      const s = next[i];
      if (s.waypoints.length < 2) continue;
      const routed = await routeForMode(s.waypoints, mode);
      next[i] = {
        ...s,
        routePoints: routed.ok ? routed.points : [],
        routingFailed: !routed.ok,
        absurdDetour: !!routed.absurd,
      };
      if (!routed.ok) {
        setRouteError(routed.message ?? "Punto inalcanzable en el nuevo modo.");
      } else if (routed.absurd && editorModeRef.current === "advanced") {
        setRouteError(routed.message ?? "Desvío absurdo tras cambiar modo.");
      }
    }
    segsRef.current = next;
    setSegments(next);
    syncMap(next);
    pushHist(next);
    setRouting(false);
  }, [syncMap, pushHist]);

  const handleTransportChange = useCallback((mode: TransportMode) => {
    setTransportMode(mode);
    transportModeRef.current = mode;
    // Re-ruta siempre al cambiar modo (moto/coche siguen siendo modos distintos)
    void rerouteAll(mode);
  }, [rerouteAll]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleUndo = useCallback(() => {
    const newIdx = Math.max(0, histIdxRef.current - 1);
    histIdxRef.current = newIdx;
    setHistIdx(newIdx);
    const restored: Segment[] = JSON.parse(JSON.stringify(histRef.current[newIdx]));
    segsRef.current = restored;
    setSegments(restored);
    syncMap(restored);
  }, [syncMap]);

  const handleRedo = useCallback(() => {
    const newIdx = Math.min(histRef.current.length - 1, histIdxRef.current + 1);
    histIdxRef.current = newIdx;
    setHistIdx(newIdx);
    const restored: Segment[] = JSON.parse(JSON.stringify(histRef.current[newIdx]));
    segsRef.current = restored;
    setSegments(restored);
    syncMap(restored);
  }, [syncMap]);

  // Ctrl+Z / Ctrl+Y
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleUndo, handleRedo]);

  const handleClear = useCallback(() => {
    const upd = segsRef.current.map(s =>
      s.id !== activeIdRef.current
        ? s
        : { ...s, waypoints: [], waypointKinds: [], routePoints: [], routingFailed: false, absurdDetour: false },
    );
    segsRef.current = upd;
    setSegments(upd);
    setActiveWpt(null);
    syncMap(upd, null);
    pushHist(upd);
  }, [syncMap, pushHist]);

  const handleCloseLoop = useCallback(async () => {
    const seg = segsRef.current.find(s => s.id === activeIdRef.current);
    if (!seg || seg.waypoints.length < 3) return;
    const closed: LngLat[] = [...seg.waypoints, seg.waypoints[0]];
    const closedKinds: WaypointKind[] = [...ensureWaypointKinds(seg), "via"];
    setRouting(true);
    setRouteError(null);
    const routed = await routeForMode(closed, transportModeRef.current);
    if (!routed.ok) setRouteError(routed.message ?? "No se pudo cerrar el bucle.");
    const upd = segsRef.current.map(s =>
      s.id === activeIdRef.current
        ? {
            ...s,
            waypoints: closed,
            waypointKinds: closedKinds,
            routePoints: routed.ok ? routed.points : [],
            routingFailed: !routed.ok,
            absurdDetour: !!routed.absurd,
          }
        : s,
    );
    segsRef.current = upd;
    setSegments(upd);
    syncMap(upd);
    pushHist(upd);
    setRouting(false);
  }, [syncMap, pushHist]);

  const handleAddSeg = useCallback(() => {
    const idx = segsRef.current.length % COLORS.length;
    const seg = mkSeg(COLORS[idx].value);
    const upd = [...segsRef.current, seg];
    segsRef.current = upd;
    setSegments(upd);
    setActiveId(seg.id);
    activeIdRef.current = seg.id;
    pushHist(upd);
  }, [pushHist]);

  const handleDeleteSeg = useCallback((segId: string) => {
    let upd = segsRef.current.filter(s => s.id !== segId);
    if (upd.length === 0) { upd = [mkSeg()]; }
    if (activeIdRef.current === segId) {
      setActiveId(upd[0].id);
      activeIdRef.current = upd[0].id;
    }
    segsRef.current = upd;
    setSegments(upd);
    setActiveWpt(null);
    syncMap(upd, null);
    pushHist(upd);
  }, [syncMap, pushHist]);

  const handleColor = useCallback((segId: string, color: string) => {
    const safe = ensureMinBrightness(color);
    const upd = segsRef.current.map(s => s.id === segId ? { ...s, color: safe } : s);
    segsRef.current = upd;
    setSegments(upd);
    syncMap(upd);
    pushHist(upd); // color changes enter undo stack
  }, [syncMap, pushHist]);

  const handleRenameSeg = useCallback((segId: string, name: string) => {
    const upd = segsRef.current.map(s => s.id === segId ? { ...s, name } : s);
    segsRef.current = upd;
    setSegments(upd);
    pushHist(upd);
  }, [pushHist]);

  const handleDeleteWaypoint = useCallback(async (segId: string, idx: number) => {
    const upd = segsRef.current.map(s => {
      if (s.id !== segId) return s;
      const wpts = s.waypoints.filter((_, i) => i !== idx);
      const kinds = ensureWaypointKinds(s).filter((_, i) => i !== idx);
      return { ...s, waypoints: wpts, waypointKinds: kinds, routePoints: wpts.length < 2 ? [] : s.routePoints };
    });
    segsRef.current = upd;
    setSegments(upd);
    setActiveWpt(null);
    activeWptRef.current = null;

    const seg = upd.find(s => s.id === segId);
    if (seg && seg.waypoints.length >= 2) {
      setRouting(true);
      const routed = await routeForMode(seg.waypoints, transportModeRef.current);
      if (!routed.ok) setRouteError(routed.message ?? "Punto inalcanzable.");
      const r = upd.map(s => s.id === segId ? {
        ...s,
        routePoints: routed.ok ? routed.points : [],
        routingFailed: !routed.ok,
        absurdDetour: !!routed.absurd,
      } : s);
      segsRef.current = r;
      setSegments(r);
      syncMap(r, null);
      pushHist(r);
      setRouting(false);
    } else {
      syncMap(upd, null);
      pushHist(upd);
    }
  }, [syncMap, pushHist]);

  const handleReorderWaypoint = useCallback(async (segId: string, idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    const seg0 = segsRef.current.find(s => s.id === segId);
    if (!seg0 || target < 0 || target >= seg0.waypoints.length) return;
    const upd = segsRef.current.map(s => {
      if (s.id !== segId) return s;
      const wpts = [...s.waypoints];
      const kinds = ensureWaypointKinds(s);
      const tmp = wpts[idx];
      wpts[idx] = wpts[target];
      wpts[target] = tmp;
      const tmpK = kinds[idx];
      kinds[idx] = kinds[target];
      kinds[target] = tmpK;
      return { ...s, waypoints: wpts, waypointKinds: kinds };
    });
    segsRef.current = upd;
    setActiveWpt({ segId, idx: target });
    activeWptRef.current = { segId, idx: target };

    const seg = upd.find(s => s.id === segId)!;
    if (seg.waypoints.length >= 2) {
      setRouting(true);
      const routed = await routeForMode(seg.waypoints, transportModeRef.current);
      const r = upd.map(s => s.id === segId ? {
        ...s,
        routePoints: routed.ok ? routed.points : [],
        routingFailed: !routed.ok,
        absurdDetour: !!routed.absurd,
      } : s);
      segsRef.current = r;
      setSegments(r);
      syncMap(r);
      pushHist(r);
      setRouting(false);
    } else {
      setSegments(upd);
      syncMap(upd);
      pushHist(upd);
    }
  }, [syncMap, pushHist]);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setRouteError("Geolocalización no disponible en este navegador.");
      return;
    }
    if (!mapRef.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const ll: LngLat = [coords.longitude, coords.latitude];
        setUserLngLat(ll);
        syncUserMarker(ll);
        mapRef.current?.flyTo({
          center: ll,
          zoom: 15,
          duration: 1200,
        });
        setLocating(false);
        if (coords.accuracy > 80) {
          setRouteError("Precisión GPS aún baja — espera unos segundos.");
        } else {
          setRouteError(null);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setRouteError("Ubicación denegada. Activa el permiso de geolocalización en el navegador.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setRouteError("Ubicación no disponible en este momento.");
        } else {
          setRouteError("No se pudo obtener tu ubicación. Revisa permisos del navegador.");
        }
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }, [syncUserMarker]);

  const handleFitRoute = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const allPts = segsRef.current.flatMap(s =>
      s.routePoints.length >= 2 && !s.routingFailed ? s.routePoints : s.waypoints,
    );
    if (allPts.length < 2) return;
    const lngs = allPts.map(p => p[0]);
    const lats  = allPts.map(p => p[1]);
    map.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 64, duration: 900 },
    );
  }, []);

  const handleDownload = useCallback(() => {
    const allPts = segments.flatMap(s =>
      s.routePoints.length >= 2 && !s.routingFailed ? s.routePoints : [],
    );
    if (allPts.length < 2) return;
    const gpx  = exportGpx(segments, routeTitle, cues);
    const blob = new Blob([gpx], { type: "application/gpx+xml" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${routeTitle.replace(/\s+/g, "_")}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  }, [segments, routeTitle, cues]);

  const applyImportedGeometry = useCallback((
    geometry: { lat: number; lon: number }[],
    extensions: NavRideRoute | null,
    asTrackOnly: boolean,
  ) => {
    const pts: LngLat[] = geometry.map((p) => [p.lon, p.lat]);
    if (pts.length < 1) return;

    const color = ensureMinBrightness(COLORS[0].value);
    const viaFromExt = extensions?.viaPoints ?? [];
    const shpFromExt = extensions?.shapingPoints ?? [];
    let waypoints: LngLat[] = [];
    let waypointKinds: WaypointKind[] = [];

    if (!asTrackOnly && (viaFromExt.length > 0 || shpFromExt.length > 0)) {
      const merged = [
        ...viaFromExt.map((p) => ({ ll: [p.lon, p.lat] as LngLat, kind: "via" as WaypointKind })),
        ...shpFromExt.map((p) => ({ ll: [p.lon, p.lat] as LngLat, kind: "shaping" as WaypointKind })),
      ];
      waypoints = merged.map((m) => m.ll);
      waypointKinds = merged.map((m) => m.kind);
    } else {
      // Sample as track waypoints (cap for UI)
      const step = Math.max(1, Math.floor(pts.length / 40));
      for (let i = 0; i < pts.length; i += step) {
        waypoints.push(pts[i]);
        waypointKinds.push("via");
      }
      if (waypoints.length > 0) {
        const last = pts[pts.length - 1];
        const prev = waypoints[waypoints.length - 1];
        if (prev[0] !== last[0] || prev[1] !== last[1]) {
          waypoints.push(last);
          waypointKinds.push("via");
        }
      }
    }

    const seg: Segment = {
      id: uid(),
      name: extensions?.name || "Importado",
      color,
      waypoints,
      waypointKinds,
      routePoints: pts.length >= 2 ? pts : [],
      routingFailed: pts.length < 2,
    };
    const next = [seg];
    segsRef.current = next;
    setSegments(next);
    setActiveId(seg.id);
    activeIdRef.current = seg.id;
    if (extensions?.name) setRouteTitle(extensions.name);
    if (extensions?.cues?.length) setCues(extensions.cues);
    else setCues([]);
    syncMap(next);
    pushHist(next);
    setImportDialog(null);
    setRouteError(null);
  }, [syncMap, pushHist]);

  const handleGpxFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const parsed = parseGpxFile(text);
      if (!parsed.recoverable) {
        setRouteError(parsed.issues[0] ?? "GPX no válido.");
        setImportDialog(null);
        return;
      }
      if (parsed.issues.length === 0 && parsed.geometry.length >= 2) {
        applyImportedGeometry(parsed.geometry, parsed.extensions, false);
        return;
      }
      // Recoverable UX instead of only INVALID
      setImportDialog({
        issues: parsed.issues.length ? parsed.issues : ["GPX parcial — elige cómo importar."],
        geometry: parsed.geometry,
        extensions: parsed.extensions,
        fileName: file.name,
      });
    };
    reader.onerror = () => setRouteError("No se pudo leer el archivo GPX.");
    reader.readAsText(file);
  }, [applyImportedGeometry]);

  const handleToggleViaShaping = useCallback((segId: string, idx: number) => {
    const upd = segsRef.current.map((s) => {
      if (s.id !== segId) return s;
      const kinds = ensureWaypointKinds(s);
      kinds[idx] = toggleViaShaping(kinds[idx] ?? "via");
      return { ...s, waypointKinds: kinds };
    });
    segsRef.current = upd;
    setSegments(upd);
    pushHist(upd);
  }, [pushHist]);

  const handleAddCue = useCallback(() => {
    const msg = cueDraftMessage.trim();
    if (!msg) return;
    const progressM = Math.max(0, totalKm(segsRef.current) * 1000 * 0.5);
    const cue = createCue({
      message: msg,
      severity: cueDraftSeverity,
      progressM,
      segmentId: activeIdRef.current,
    });
    setCues((prev) => [...prev, cue]);
    setCueDraftMessage("");
  }, [cueDraftMessage, cueDraftSeverity]);

  const handleDeleteCue = useCallback((cueId: string) => {
    setCues((prev) => prev.filter((c) => c.cueId !== cueId));
  }, []);

  const routeSignature = useCallback(() => {
    const allPts = segments.flatMap(s =>
      s.routePoints.length >= 2 && !s.routingFailed ? s.routePoints : [],
    );
    return `${routeTitle}|${allPts.length}|${totalKm(segments).toFixed(3)}`;
  }, [segments, routeTitle]);

  const persistRoute = useCallback(async (): Promise<string | null> => {
    const allPts = segments.flatMap(s =>
      s.routePoints.length >= 2 && !s.routingFailed ? s.routePoints : [],
    );
    if (allPts.length < 2) {
      setUploadMsg({
        ok: false,
        text: "No hay geometría enrutada válida para guardar (evita líneas rectas fallidas).",
      });
      return null;
    }

    const gpx = exportGpx(segments, routeTitle, cues);
    const res = await fetch("/api/gpx/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title: routeTitle,
        gpxXml: gpx,
        waypointsCount: allPts.length,
        distanceM: totalKm(segments) * 1000,
        existingRouteId: savedRouteId,
      }),
    });

    const result = (await res.json()) as
      | { ok: true; routeId: string; storageUrl: string }
      | { ok: false; error: string };

    if (!result.ok) {
      setUploadMsg({ ok: false, text: result.error });
      return null;
    }

    setSavedRouteId(result.routeId);
    setSavedSignature(routeSignature());
    clearDraft();
    setDraftBanner(null);
    return result.routeId;
  }, [segments, routeTitle, routeSignature, savedRouteId, cues]);

  const handleSave = useCallback(async () => {
    if (saving || uploading) return;
    setSaving(true);
    setUploadMsg(null);
    const id = await persistRoute();
    if (id) {
      const isUpdate = savedRouteId != null && savedRouteId === id;
      setUploadMsg({
        ok: true,
        text: isUpdate
          ? "Ruta actualizada en la web. Visible al instante en NavRide → menú GPX Web."
          : "Ruta guardada en la web. Visible al instante en NavRide → menú GPX Web.",
      });
    }
    setSaving(false);
  }, [persistRoute, saving, uploading, savedRouteId]);

  const handleLaunch = useCallback(async () => {
    if (saving || uploading) return;
    setUploading(true);
    setUploadMsg(null);

    try {
      let routeId = savedRouteId;
      const sig = routeSignature();
      if (!routeId || savedSignature !== sig) {
        routeId = await persistRoute();
      }
      if (!routeId) {
        setUploading(false);
        return;
      }

      const links = buildRouteDeepLinks(routeId);
      const opened = tryOpenNavRideApp(routeId);
      const copied = await copyRouteLink(routeId);

      setUploadMsg({
        ok: true,
        text: opened
          ? "Ruta guardada. Abriendo NavRide… (misma cuenta Supabase en la app)."
          : copied
            ? `Ruta guardada. Enlace copiado. Ábrelo en el móvil con NavRide instalada: ${links.https}`
            : `Ruta guardada. Abre en el móvil: ${links.https}`,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setUploadMsg({ ok: false, text: `Error inesperado: ${msg}` });
    }
    setUploading(false);
  }, [persistRoute, routeSignature, savedRouteId, savedSignature, saving, uploading]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const km            = totalKm(segments);
  const totalWpts     = segments.reduce((a, s) => a + s.waypoints.length, 0);
  const totalRoutePts = segments.reduce(
    (a, s) => a + (s.routingFailed ? 0 : s.routePoints.length),
    0,
  );
  const activeSeg     = segments.find(s => s.id === activeId) ?? segments[0];
  const advanced = editorMode === "advanced";
  const modeLabel = TRANSPORT_MODES.find(m => m.id === transportMode)?.label ?? transportMode;
  const routeHealth   = analyzeRouteHealth(
    segments.map((s) => ({
      waypoints: s.waypoints,
      routePoints: s.routingFailed ? [] : s.routePoints,
      mode: transportMode,
      routingFailed: s.routingFailed,
    })),
  );

  const restoreDraft = useCallback(() => {
    const draft = loadDraft();
    if (!draft?.segments || !Array.isArray(draft.segments)) return;
    const restored = draft.segments as Segment[];
    segsRef.current = restored;
    setSegments(restored);
    setRouteTitle(draft.routeTitle);
    setTransportMode((draft.transportMode as TransportMode) || "moto");
    setEditorMode(draft.editorMode === "advanced" ? "advanced" : "simple");
    setDraftBanner(null);
    syncMap(restored);
    pushHist(restored);
  }, [syncMap, pushHist]);

  const dismissDraft = useCallback(() => {
    clearDraft();
    setDraftBanner(null);
  }, []);

  // ── Sidebar content (shared: desktop aside + mobile drawer) ──────────────
  const sidebarContent = (
    <div className="p-4 flex flex-col gap-4">

      {/* Header */}
      <div>
        <h2 className="text-sm font-bold text-white">NavRide Route Studio</h2>
        <p className="text-xs text-white/40 mt-0.5">
          Mapa a pantalla completa · Clic · Deshacer (Ctrl+Z)
        </p>
      </div>

      {draftBanner && (
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={restoreDraft}
            className="text-left text-xs rounded-lg border border-[#FF9500]/30 bg-[#FF9500]/10 px-3 py-2 text-[#FF9500]"
          >
            Recuperar borrador — {draftBanner}
          </button>
          <button
            type="button"
            onClick={dismissDraft}
            className="text-[10px] text-white/35 hover:text-white/60 self-end"
          >
            Descartar borrador
          </button>
        </div>
      )}

      <div className="flex gap-1 rounded-lg bg-white/5 p-1">
        {(["simple", "advanced"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setEditorMode(m)}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium ${
              editorMode === m ? "bg-[#FF5A1F] text-white" : "text-white/50"
            }`}
          >
            {m === "simple" ? "Básico" : "Avanzado"}
          </button>
        ))}
      </div>

      {/* Activity / transport — always (basic) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-white/40 uppercase tracking-widest">Actividad</label>
        <div className="grid grid-cols-2 gap-1.5">
          {TRANSPORT_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handleTransportChange(m.id)}
              className={`rounded-lg border px-2 py-2 text-xs text-left ${
                transportMode === m.id
                  ? "border-[#FF5A1F]/50 bg-[#FF5A1F]/10 text-white"
                  : "border-white/10 text-white/50"
              }`}
            >
              <span className="font-medium">{m.label}</span>
            </button>
          ))}
        </div>
        {(transportMode === "moto" || transportMode === "car") && (
          <p className="text-[10px] text-white/35 leading-snug">
            Moto y coche usan el perfil OSRM <span className="text-white/50">driving</span> por ahora;
            se mantienen modos separados para un perfil moto futuro. Cambiar modo re-enruta.
          </p>
        )}
      </div>

      {/* Compact health in basic; details in advanced */}
      <div
        className={`rounded-lg px-3 py-2 text-xs border ${
          routeHealth.health === "GOOD"
            ? "border-green-500/30 text-green-400 bg-green-500/5"
            : routeHealth.health === "REVIEW"
              ? "border-[#FF9500]/30 text-[#FF9500] bg-[#FF9500]/5"
              : "border-red-500/30 text-red-400 bg-red-500/5"
        }`}
      >
        Salud: {routeHealth.health}
        {(routeHealth.issues[0] ?? routeHealth.warnings[0]) && (
          <p className="mt-1 opacity-80">
            {routeHealth.issues[0] ?? routeHealth.warnings[0]}
          </p>
        )}
      </div>

      {routeError && (
        <div className="text-xs rounded-lg px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-300">
          {routeError}
        </div>
      )}

      {/* Route name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-white/40 uppercase tracking-widest">Nombre</label>
        <input
          value={routeTitle}
          onChange={e => setRouteTitle(e.target.value)}
          className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f97316]/50"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white/3 border border-white/8 p-2.5 text-center">
          <p className="text-base font-bold text-white">{km.toFixed(2)}</p>
          <p className="text-xs text-white/40">km</p>
        </div>
        <div className="rounded-xl bg-white/3 border border-white/8 p-2.5 text-center">
          <p className="text-base font-bold text-white">{totalWpts}</p>
          <p className="text-xs text-white/40">nodos</p>
        </div>
        <div className="rounded-xl bg-white/3 border border-white/8 p-2.5 text-center">
          <p className="text-base font-bold text-white">{totalRoutePts}</p>
          <p className="text-xs text-white/40">pts ruta</p>
        </div>
      </div>

      {/* Segments */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40 uppercase tracking-widest">Segmentos</span>
          {advanced && (
            <button onClick={handleAddSeg}
              className="flex items-center gap-1 text-xs text-[#f97316] hover:text-[#fb923c] transition">
              <Plus size={12} /> Nuevo
            </button>
          )}
        </div>

        {segments.map(seg => (
          <div
            key={seg.id}
            onClick={() => { setActiveId(seg.id); activeIdRef.current = seg.id; }}
            className={`rounded-xl border p-3 cursor-pointer transition ${
              seg.id === activeId
                ? "border-[#f97316]/40 bg-[#f97316]/5"
                : "border-white/8 bg-white/2 hover:bg-white/4"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {seg.id === activeId ? (
                  <div className="relative shrink-0">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setColorPopoverSegId(colorPopoverSegId === seg.id ? null : seg.id);
                      }}
                      className="w-5 h-5 rounded-full ring-2 ring-white/40 flex items-center justify-center"
                      style={{ backgroundColor: seg.color }}
                      title="Cambiar color"
                    >
                      <Palette size={9} className="text-white/90" />
                    </button>
                    {colorPopoverSegId === seg.id && (
                      <div className="absolute top-full mt-2 left-0 bg-[#1a1a1a] border border-white/15 rounded-xl p-2 shadow-2xl z-30 min-w-[140px]">
                        {advanced ? (
                          <TrackColorPicker
                            value={seg.color}
                            onChange={(c) => handleColor(seg.id, c)}
                          />
                        ) : (
                        <div className="flex flex-wrap gap-1.5" style={{ width: "116px" }}>
                          {COLORS.map(c => (
                            <button
                              key={c.value}
                              title={`${c.label} — ${c.desc}`}
                              onClick={ev => {
                                ev.stopPropagation();
                                handleColor(seg.id, c.value);
                                setColorPopoverSegId(null);
                              }}
                              className={`w-6 h-6 rounded-full border-2 transition ${
                                seg.color === c.value
                                  ? "border-white scale-110"
                                  : "border-transparent hover:border-white/50"
                              }`}
                              style={{ backgroundColor: c.value }}
                            />
                          ))}
                        </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/20"
                    style={{ backgroundColor: seg.color }}
                  />
                )}
                {advanced && seg.id === activeId ? (
                  <input
                    value={seg.name}
                    onClick={e => e.stopPropagation()}
                    onChange={e => {
                      const name = e.target.value;
                      const upd = segsRef.current.map(s =>
                        s.id === seg.id ? { ...s, name } : s,
                      );
                      segsRef.current = upd;
                      setSegments(upd);
                    }}
                    onBlur={e => handleRenameSeg(seg.id, e.target.value)}
                    className="text-xs text-white font-medium bg-transparent border-b border-white/20 focus:outline-none focus:border-[#f97316]/50 min-w-0 flex-1"
                  />
                ) : (
                  <span className="text-xs text-white font-medium truncate">{seg.name}</span>
                )}
                <span className="text-xs text-white/30 shrink-0">
                  {segKm(
                    seg.routePoints.length >= 2 && !seg.routingFailed
                      ? seg.routePoints
                      : seg.waypoints,
                  ).toFixed(2)} km
                </span>
              </div>
              {advanced && (
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteSeg(seg.id); }}
                  className="text-white/20 hover:text-red-400 transition shrink-0 ml-1">
                  <X size={13} />
                </button>
              )}
            </div>
            {seg.routingFailed && (
              <p className="text-[10px] text-red-400 mt-1">Tramo sin ruta — no se dibuja recta falsa</p>
            )}
            {advanced && seg.absurdDetour && (
              <p className="text-[10px] text-[#FF9500] mt-1">Desvío absurdo — revisa waypoints</p>
            )}
          </div>
        ))}
      </div>

      {/* Advanced: waypoint list + track controls */}
      {advanced && activeSeg && (
        <div className="flex flex-col gap-2 border-t border-white/8 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40 uppercase tracking-widest">Waypoints</span>
            <button
              type="button"
              onClick={() => setInsertMode(v => !v)}
              disabled={!activeWpt || activeWpt.segId !== activeSeg.id}
              className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border transition ${
                insertMode
                  ? "border-[#FF5A1F]/50 text-[#FF5A1F] bg-[#FF5A1F]/10"
                  : "border-white/10 text-white/50 disabled:opacity-30"
              }`}
              title="Insertar punto tras el waypoint seleccionado"
            >
              <Crosshair size={11} /> Insertar
            </button>
          </div>
          {insertMode && (
            <p className="text-[10px] text-[#FF5A1F]/80">
              Clic en el mapa para insertar después del waypoint seleccionado.
            </p>
          )}
          <ul className="max-h-40 overflow-y-auto flex flex-col gap-1">
            {activeSeg.waypoints.map((p, i) => {
              const selected = activeWpt?.segId === activeSeg.id && activeWpt.idx === i;
              const kind = ensureWaypointKinds(activeSeg)[i] ?? "via";
              return (
                <li
                  key={`${activeSeg.id}-${i}`}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] ${
                    selected ? "bg-[#FF5A1F]/15 border border-[#FF5A1F]/40" : "bg-white/3 border border-transparent"
                  }`}
                >
                  <button
                    type="button"
                    className="flex-1 text-left text-white/70 truncate"
                    onClick={() => {
                      const sel = { segId: activeSeg.id, idx: i };
                      setActiveWpt(sel);
                      activeWptRef.current = sel;
                      syncMap(segsRef.current, sel);
                      mapRef.current?.flyTo({ center: p, zoom: Math.max(mapRef.current.getZoom(), 14), duration: 600 });
                    }}
                  >
                    #{i + 1} {p[1].toFixed(5)}, {p[0].toFixed(5)}
                  </button>
                  <button
                    type="button"
                    title="Alternar VIA ↔ SHAPING"
                    onClick={() => handleToggleViaShaping(activeSeg.id, i)}
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide border ${
                      kind === "shaping"
                        ? "border-sky-400/40 text-sky-300 bg-sky-500/10"
                        : "border-white/15 text-white/50 hover:text-white"
                    }`}
                  >
                    {kind === "shaping" ? "SHP" : "VIA"}
                  </button>
                  <button type="button" title="Subir" disabled={i === 0}
                    onClick={() => void handleReorderWaypoint(activeSeg.id, i, -1)}
                    className="text-white/30 hover:text-white disabled:opacity-20">
                    <ChevronUp size={12} />
                  </button>
                  <button type="button" title="Bajar" disabled={i >= activeSeg.waypoints.length - 1}
                    onClick={() => void handleReorderWaypoint(activeSeg.id, i, 1)}
                    className="text-white/30 hover:text-white disabled:opacity-20">
                    <ChevronDown size={12} />
                  </button>
                  <button type="button" title="Eliminar"
                    onClick={() => void handleDeleteWaypoint(activeSeg.id, i)}
                    className="text-white/30 hover:text-red-400">
                    <Trash2 size={12} />
                  </button>
                </li>
              );
            })}
            {activeSeg.waypoints.length === 0 && (
              <li className="text-[11px] text-white/30">Sin waypoints — clic en el mapa.</li>
            )}
          </ul>

          {/* Cues panel (advanced) */}
          <div className="flex flex-col gap-2 border-t border-white/8 pt-3">
            <span className="text-xs text-white/40 uppercase tracking-widest">Cues</span>
            <ul className="max-h-28 overflow-y-auto flex flex-col gap-1">
              {cues.map((c) => (
                <li
                  key={c.cueId}
                  className="flex items-start gap-2 rounded-lg bg-white/3 px-2 py-1.5 text-[11px]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 truncate">
                      <span className="text-white/40">{cueSeverityLabel(c.severity)}</span>
                      {" · "}
                      {c.message}
                    </p>
                    <p className="text-white/25 text-[10px]">
                      @{Math.round(c.progressM)} m
                    </p>
                  </div>
                  <button
                    type="button"
                    title="Eliminar cue"
                    onClick={() => handleDeleteCue(c.cueId)}
                    className="text-white/30 hover:text-red-400 shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
              {cues.length === 0 && (
                <li className="text-[11px] text-white/30">Sin cues — añade uno abajo.</li>
              )}
            </ul>
            <div className="flex flex-col gap-1.5">
              <select
                value={cueDraftSeverity}
                onChange={(e) => setCueDraftSeverity(e.target.value as NavRideCueSeverity)}
                className="rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-white"
              >
                {(Object.keys(CUE_SEVERITY_LABELS_ES) as NavRideCueSeverity[]).map((s) => (
                  <option key={s} value={s}>{CUE_SEVERITY_LABELS_ES[s]}</option>
                ))}
              </select>
              <input
                value={cueDraftMessage}
                onChange={(e) => setCueDraftMessage(e.target.value)}
                placeholder="Mensaje del cue…"
                className="rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/25"
              />
              <button
                type="button"
                onClick={handleAddCue}
                disabled={!cueDraftMessage.trim()}
                className="rounded-lg border border-[#FF5A1F]/40 text-[#FF5A1F] text-xs py-1.5 disabled:opacity-30"
              >
                Añadir cue
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-xs text-white/40 uppercase tracking-widest">
              Grosor pista ({trackWidth.toFixed(1)})
            </label>
            <input
              type="range"
              min={2}
              max={14}
              step={0.5}
              value={trackWidth}
              onChange={e => setTrackWidth(clampTrackWidth(Number(e.target.value)))}
              className="w-full accent-[#FF5A1F]"
            />
            <label className="text-xs text-white/40 uppercase tracking-widest">
              Opacidad ({Math.round(trackOpacity * 100)}%)
            </label>
            <input
              type="range"
              min={35}
              max={100}
              step={1}
              value={Math.round(trackOpacity * 100)}
              onChange={e => setTrackOpacity(clampTrackOpacity(Number(e.target.value) / 100))}
              className="w-full accent-[#FF5A1F]"
            />
          </div>
        </div>
      )}

      {/* Note */}
      <p className="text-xs text-white/25 flex items-start gap-1.5">
        <MapPin size={11} className="shrink-0 mt-0.5" />
        Snap OSRM · Satélite ESRI + labels vector OpenFreeMap · {SATELLITE_ATTRIBUTION.split("|")[0]}
      </p>

      {/* Import GPX (advanced capability) */}
      {advanced && (
        <>
          <input
            ref={gpxFileInputRef}
            type="file"
            accept=".gpx,application/gpx+xml,text/xml"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) handleGpxFile(f);
            }}
          />
          <button
            type="button"
            onClick={() => gpxFileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-full border border-white/15 py-2.5 text-sm text-white/70 hover:text-white hover:border-white/30 transition"
          >
            <Upload size={14} />
            Importar GPX
          </button>
        </>
      )}

      {/* Descargar local */}
      <button onClick={handleDownload} disabled={totalRoutePts < 2}
        className="flex items-center justify-center gap-2 rounded-full border border-white/15 py-2.5 text-sm text-white/70 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition">
        <Download size={14} />
        Descargar GPX ({totalRoutePts} pts)
      </button>

      {/* Guardar en la nube */}
      <button onClick={() => void handleSave()} disabled={totalRoutePts < 2 || saving || uploading}
        className="flex items-center justify-center gap-2 rounded-full border border-[#3b82f6]/50 bg-[#3b82f6]/10 py-2.5 text-sm font-semibold text-[#60a5fa] hover:bg-[#3b82f6]/20 disabled:opacity-40 disabled:cursor-not-allowed transition">
        {saving
          ? <Loader2 size={14} className="animate-spin" />
          : <Cloud size={14} />}
        {saving
          ? "Guardando en la web…"
          : savedRouteId
            ? "Actualizar en la web"
            : "Guardar en la web"}
      </button>

      {/* Enviar a la app */}
      <button onClick={() => void handleLaunch()} disabled={totalRoutePts < 2 || saving || uploading}
        className="flex items-center justify-center gap-2 rounded-full bg-[#f97316] py-2.5 text-sm font-semibold text-white hover:bg-[#f97316]/90 disabled:opacity-40 disabled:cursor-not-allowed transition">
        {uploading
          ? <Loader2 size={14} className="animate-spin" />
          : <Smartphone size={14} />}
        {uploading ? "Enviando a la app…" : "Enviar a NavRide App"}
      </button>

      {savedRouteId && (
        <p className="text-[10px] text-white/35 flex items-center gap-1">
          <Link2 size={10} />
          ID guardado — sync automático con GPX Web en la app
        </p>
      )}

      {uploadMsg && (
        <div className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2.5 ${
          uploadMsg.ok
            ? "bg-green-500/10 border border-green-500/20 text-green-400"
            : "bg-red-500/10 border border-red-500/20 text-red-400"
        }`}>
          {uploadMsg.ok
            ? <CheckCircle2 size={13} className="shrink-0 mt-0.5" />
            : <AlertCircle  size={13} className="shrink-0 mt-0.5" />}
          {uploadMsg.text}
        </div>
      )}

      {advanced && (
        <RouteDoctorPanel
          report={routeHealth}
          modeLabel={modeLabel}
          pointCount={totalRoutePts > 0 ? totalRoutePts : totalWpts}
        />
      )}

    </div>
  );

  const mapInsetClass = sidebarCollapsed
    ? "absolute inset-0"
    : "absolute inset-0 md:right-80";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex-1 h-full overflow-hidden">

      {/* ── Map container: full browser when sidebar collapsed ── */}
      <div className={mapInsetClass}>
        <div ref={mapContainer} className="w-full h-full" />

        {/* Desktop: colapsar sidebar → mapa 100vw */}
        <button
          type="button"
          onClick={() => setSidebarCollapsed(v => !v)}
          title={sidebarCollapsed ? "Mostrar panel" : "Mapa a pantalla completa"}
          className={`hidden md:flex absolute top-3 z-20 w-9 h-9 rounded-lg bg-[#0a0a0a]/90 border border-white/15 items-center justify-center text-white/70 hover:text-white transition shadow-lg ${
            sidebarCollapsed ? "right-3" : "right-[21rem]"
          }`}
        >
          {sidebarCollapsed ? <PanelRightOpen size={15} /> : <PanelRightClose size={15} />}
        </button>

        {/* ── Floating edit toolbar (left) ── */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <button onClick={handleUndo} title="Deshacer (Ctrl+Z)" disabled={histIdx === 0}
            className="w-9 h-9 rounded-lg bg-[#0a0a0a]/90 border border-white/15 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 transition shadow-lg">
            <Undo2 size={15} />
          </button>
          <button onClick={handleRedo} title="Rehacer (Ctrl+Y)" disabled={histIdx >= histLen - 1}
            className="w-9 h-9 rounded-lg bg-[#0a0a0a]/90 border border-white/15 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 transition shadow-lg">
            <Redo2 size={15} />
          </button>
          <button onClick={handleClear} title="Borrar segmento activo"
            disabled={!activeSeg || activeSeg.waypoints.length === 0}
            className="w-9 h-9 rounded-lg bg-[#0a0a0a]/90 border border-white/15 flex items-center justify-center text-white/70 hover:text-red-400 disabled:opacity-30 transition shadow-lg">
            <Trash2 size={15} />
          </button>
          {advanced && (
            <button onClick={handleCloseLoop} title="Cerrar loop"
              disabled={!activeSeg || activeSeg.waypoints.length < 3}
              className="w-9 h-9 rounded-lg bg-[#0a0a0a]/90 border border-white/15 flex items-center justify-center text-white/70 hover:text-[#f97316] disabled:opacity-30 transition shadow-lg">
              <RotateCw size={15} />
            </button>
          )}
        </div>

        {/* ── Map style switcher button (bottom-left) ── */}
        <div className="absolute bottom-6 left-3 z-10">
          <div className="relative">
            <button
              onClick={() => setStyleMenuOpen(v => !v)}
              title="Estilo de mapa"
              className={`w-9 h-9 rounded-lg bg-[#0a0a0a]/90 border flex items-center justify-center transition shadow-lg ${
                styleMenuOpen
                  ? "border-[#f97316]/40 text-[#f97316]"
                  : "border-white/15 text-white/70 hover:text-white"
              }`}
            >
              <Layers size={16} />
            </button>
            {styleMenuOpen && (
              <div className="absolute bottom-full mb-2 left-0 bg-[#0a0a0a]/98 border border-white/15 rounded-xl p-1.5 shadow-xl min-w-[100px] backdrop-blur-xl">
                {MAP_STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setMapStyleId(s.id); setStyleMenuOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition ${
                      mapStyleId === s.id
                        ? "bg-[#f97316]/20 text-[#f97316] font-semibold"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Floating nav tools ── */}
        <div
          className={`absolute top-14 z-10 flex flex-col gap-1.5 ${
            sidebarCollapsed ? "right-3" : "right-3 md:right-[21rem]"
          }`}
        >
          <button onClick={handleLocate} title="Mi ubicación GPS"
            className="w-9 h-9 rounded-lg bg-[#0a0a0a]/90 border border-white/15 flex items-center justify-center text-white/70 hover:text-[#3b82f6] transition shadow-lg">
            {locating ? <Loader2 size={15} className="animate-spin text-[#3b82f6]" /> : <Navigation size={15} />}
          </button>
          <button onClick={handleFitRoute} title="Ajustar vista a la ruta"
            disabled={totalWpts < 2}
            className="w-9 h-9 rounded-lg bg-[#0a0a0a]/90 border border-white/15 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 transition shadow-lg">
            <Maximize2 size={15} />
          </button>
        </div>

        {/* ── OSRM routing indicator ── */}
        {routing && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#0a0a0a]/90 border border-white/15 rounded-full px-4 py-2 text-xs text-white/70 z-10 whitespace-nowrap shadow-lg">
            <Loader2 size={13} className="animate-spin text-[#f97316]" />
            Calculando snap-to-road…
          </div>
        )}
      </div>

      {/* ── Desktop sidebar (md+) ── */}
      {!sidebarCollapsed && (
        <aside className="hidden md:flex absolute top-0 right-0 bottom-0 w-80 flex-col bg-[#0a0a0a] border-l border-white/8 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto">
            {sidebarContent}
          </div>
        </aside>
      )}

      {/* ── Mobile FAB (opens/closes drawer) ── */}
      <button
        onClick={() => setDrawerOpen(v => !v)}
        aria-label={drawerOpen ? "Cerrar panel" : "Abrir panel"}
        className="absolute bottom-6 right-6 z-30 md:hidden w-14 h-14 rounded-full bg-[#f97316] shadow-2xl flex items-center justify-center text-white"
      >
        {drawerOpen ? <X size={22} /> : <SlidersHorizontal size={22} />}
      </button>

      {/* ── Mobile drawer backdrop ── */}
      {drawerOpen && (
        <div
          className="absolute inset-0 z-10 md:hidden bg-black/40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile drawer: max-h 72dvh; parent overflow-hidden; scroll flex-1 min-h-0 ── */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 md:hidden flex flex-col overflow-hidden transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "72dvh" }}
      >
        <div className="bg-[#0a0a0a] border-t border-white/10 rounded-t-2xl overflow-hidden flex flex-col flex-1 min-h-0 max-h-[72dvh]">
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {sidebarContent}
          </div>
        </div>
      </div>

      {/* Recoverable GPX import dialog */}
      {importDialog && (
        <div className="absolute inset-0 z-40 flex items-end md:items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#121212] p-4 shadow-2xl flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white">Importar GPX — recoverable</h3>
            <p className="text-[11px] text-white/45 truncate">{importDialog.fileName}</p>
            <ul className="text-[11px] text-[#FF9500] space-y-1 max-h-24 overflow-y-auto">
              {importDialog.issues.map((iss, i) => (
                <li key={i}>• {iss}</li>
              ))}
            </ul>
            <p className="text-[11px] text-white/50">
              {importDialog.geometry.length} puntos detectados
              {importDialog.extensions ? " · extensiones NavRide presentes" : ""}
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() =>
                  applyImportedGeometry(importDialog.geometry, importDialog.extensions, true)
                }
                className="rounded-full bg-[#f97316] py-2.5 text-sm font-semibold text-white"
              >
                IMPORTAR COMO TRACK
              </button>
              <button
                type="button"
                onClick={() =>
                  applyImportedGeometry(importDialog.geometry, importDialog.extensions, false)
                }
                className="rounded-full border border-white/20 py-2.5 text-sm text-white/80 hover:text-white"
              >
                INTENTAR REPARAR
              </button>
              <button
                type="button"
                onClick={() => setImportDialog(null)}
                className="rounded-full py-2 text-sm text-white/40 hover:text-white/70"
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
