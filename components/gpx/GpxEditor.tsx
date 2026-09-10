"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/refs, react-hooks/immutability, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

/**
 * NavRide GPX Editor — mapa primero.
 * Core: lib/gpx-editor (anchors, undo, crop/split/merge, lossless GPX).
 * Routing: red OSM maestra (Valhalla permanece en navegación App).
 * No clona editores de terceros. No GraphHopper.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Undo2, Redo2, Download, Plus, Layers, Wrench,
  Loader2, X, Crosshair, Upload, Search, ChevronUp, ChevronDown,
} from "lucide-react";
import {
  CompatibilityPromptCard,
  CompatibilityAltPreview,
  RouteCompatibilityReview,
  type CompatPrompt,
} from "@/components/gpx/RouteCompatibilityPanel";
import { fetchWaysAround, fetchWaysAlongRoute } from "@/lib/route-studio/route-compatibility-overpass";
import { compatibleWaysOnly, routeOnOsmNetwork, snapClickToOsmNetwork } from "@/lib/route-studio/editor-osm-network";
import {
  POI_CATEGORIES,
  POI_MODE_DEFAULTS,
  fetchPoisBbox,
  PoiTileStore,
  type PoiCategory,
  type NavRidePoi,
} from "@/lib/route-studio/navride-poi";
import {
  auditRouteGeometry,
  type CompatibilityAudit,
  type CompatibilityIssue,
} from "@/lib/route-studio/route-compatibility-audit";
import { type TransportMode } from "@/lib/route-studio/routing";
import { buildSatelliteStyleSync } from "@/lib/route-studio/satellite-style";
import { parseGpxFile, type RouteCapsule } from "@/lib/route-studio/navride-route/gpx-codec";
import { createEmptyRoute, type NavRideRoute } from "@/lib/route-studio/navride-route/types";
import {
  postToNavRideApp,
  registerAppToEditorHandler,
  newBridgeRequestId,
  type NavRideEditorBridgeMessage,
} from "@/lib/route-studio/navride-editor-bridge";
import { emptyDocument, GpxEditorEngine, visibleAnchors, lngLatsOf, allPoints, computeStats, elevationProfile, estimateSimplify, nearestOnPolyline, pointAtDistanceM, type GpxDocument, type ToolId, type TraceMode } from "@/lib/gpx-editor";
import { serializeGpx } from "@/lib/gpx-editor/serialize";
import type { LngLat } from "@/lib/gpx-editor/geo";
import type { OsmWay } from "@/lib/route-studio/route-compatibility-snap";

type StyleId = "liberty" | "satellite" | "topo" | "bright";

const OPEN_TOPO_STYLE = {
  version: 8,
  name: "NavRide Topografico",
  sources: {
    opentopo: {
      type: "raster",
      tiles: [
        "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
        "https://b.tile.opentopomap.org/{z}/{x}/{y}.png",
        "https://c.tile.opentopomap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap, SRTM | © OpenTopoMap (CC-BY-SA)",
    },
  },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#e8e0d8" } },
    { id: "opentopo", type: "raster", source: "opentopo", minzoom: 0, maxzoom: 17 },
  ],
};

const MAP_STYLES: { id: StyleId; label: string }[] = [
  { id: "liberty", label: "Carretera" },
  { id: "topo", label: "Topográfico" },
  { id: "satellite", label: "Satélite" },
  { id: "bright", label: "Outdoor / caminos" },
];

function styleUrl(id: StyleId): string | object {
  if (id === "liberty") return "https://tiles.openfreemap.org/styles/liberty";
  if (id === "topo") return OPEN_TOPO_STYLE;
  if (id === "satellite") return buildSatelliteStyleSync();
  return "https://tiles.openfreemap.org/styles/bright";
}

const SRC_LINE = "nr-gpx-line";
const SRC_ANCHOR = "nr-gpx-anchors";
const SRC_WPT = "nr-gpx-wpt";
const SRC_POI = "nr-gpx-poi";
const SRC_HL = "nr-gpx-hl";
const SRC_MARK = "nr-gpx-mark";
const SRC_ARROWS = "nr-gpx-arrows";
const SRC_COMPAT = "nr-gpx-compat";
const SRC_USER = "nr-gpx-user";

const PROFILES: { id: TransportMode; label: string; icon: string }[] = [
  { id: "car", label: "COCHE", icon: "🚗" },
  { id: "moto", label: "MOTO", icon: "🏍" },
  { id: "bike", label: "BICI", icon: "🚲" },
  { id: "walk", label: "CAMINAR", icon: "🚶" },
];

function exportGpx(doc: GpxDocument, capsule: RouteCapsule | null): string {
  return serializeGpx({ ...doc, capsule: capsule ?? doc.capsule });
}

function buildRouteJson(doc: GpxDocument, title: string, routeId?: string | null): NavRideRoute {
  const pts = allPoints(doc);
  return createEmptyRoute({
    routeId: routeId || `web-${Date.now()}`,
    name: title,
    geometry: { points: pts.map((p) => ({ lat: p.lat, lon: p.lon, ele: p.ele })) },
    routeProfile: "moto",
  });
}

export default function GpxEditor({
  embedNavRideApp = false,
}: {
  embedNavRideApp?: boolean;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const engineRef = useRef(new GpxEditorEngine());
  const capsuleRef = useRef<RouteCapsule | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const poiStore = useRef(new PoiTileStore());
  const [doc, setDoc] = useState(() => emptyDocument());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const redraw = useCallback(() => {
    const e = engineRef.current;
    setDoc(e.snapshot());
    setCanUndo(e.canUndo);
    setCanRedo(e.canRedo);
  }, []);

  const [title, setTitle] = useState("Mi ruta");
  const [mode, setMode] = useState<TransportMode>("moto");
  const [trace, setTrace] = useState<TraceMode>("FOLLOW_WAYS");
  const [mapStyleId, setMapStyleId] = useState<StyleId>("liberty");
  const [panel, setPanel] = useState<"none" | "tools" | "layers" | "poi" | "tracks">("none");
  const [tool, setTool] = useState<ToolId>("none");
  const [routing, setRouting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<CompatPrompt | null>(null);
  const [altPreview, setAltPreview] = useState<LngLat[] | null>(null);
  const [findingAlt, setFindingAlt] = useState(false);
  const [audit, setAudit] = useState<CompatibilityAudit | null>(null);
  const [crop, setCrop] = useState<[number, number] | null>(null);
  const [simplify, setSimplify] = useState(12);
  const [poiOn, setPoiOn] = useState(false);
  const [poiCats, setPoiCats] = useState<PoiCategory[]>([]);
  const [pois, setPois] = useState<NavRidePoi[]>([]);
  const [poiPick, setPoiPick] = useState<NavRidePoi | null>(null);
  const [showArrows, setShowArrows] = useState(false);
  const [showMarks, setShowMarks] = useState(false);
  const [pitch3d, setPitch3d] = useState(false);
  const [profileOpen, setProfileOpen] = useState(true);
  const [hlDistM, setHlDistM] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savedRouteId, setSavedRouteId] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<CompatibilityIssue | null>(null);
  const [wptEdit, setWptEdit] = useState<{ id: string; name: string; desc: string } | null>(null);
  const zoomRef = useRef(12);
  const waysCache = useRef<OsmWay[]>([]);
  const pendingClick = useRef<LngLat | null>(null);

  useEffect(() => {
    engineRef.current.mode = mode;
    engineRef.current.followRoads = trace;
    engineRef.current.doc.name = title;
  }, [mode, trace, title]);

  const stats = computeStats(doc, crop ? { startM: crop[0], endM: crop[1] } : null);
  const profile = elevationProfile(doc, 40);
  const multi = doc.tracks.length > 1 || doc.tracks[0]?.segments.length > 1;
  const simEst = estimateSimplify(doc, simplify);

  const syncMap = useCallback(() => {
    const m = mapRef.current;
    if (!m) return;
    const line = lngLatsOf(doc);
    const fc = {
      type: "FeatureCollection",
      features: line.length >= 2
        ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: line } }]
        : [],
    };
    const anchors = visibleAnchors(doc, zoomRef.current);
    const afc = {
      type: "FeatureCollection",
      features: anchors.map((a) => ({
        type: "Feature",
        properties: { ti: a.trackIndex, si: a.segmentIndex, pi: a.pointIndex },
        geometry: { type: "Point", coordinates: [a.lon, a.lat] },
      })),
    };
    const wfc = {
      type: "FeatureCollection",
      features: doc.waypoints.map((w) => ({
        type: "Feature",
        properties: { id: w.id, name: w.name },
        geometry: { type: "Point", coordinates: [w.lon, w.lat] },
      })),
    };
    const src = m.getSource(SRC_LINE);
    if (src) src.setData(fc);
    const as = m.getSource(SRC_ANCHOR);
    if (as) as.setData(afc);
    const ws = m.getSource(SRC_WPT);
    if (ws) ws.setData(wfc);

    const marks: { type: string; properties: Record<string, string>; geometry: { type: string; coordinates: number[] } }[] = [];
    if (showMarks && line.length >= 2) {
      const total = stats.distanceM;
      for (let km = 1000; km < total; km += 1000) {
        const p = pointAtDistanceM(line, km);
        if (p) {
          marks.push({
            type: "Feature",
            properties: { label: `${Math.round(km / 1000)}` },
            geometry: { type: "Point", coordinates: p },
          });
        }
      }
    }
    const ms = m.getSource(SRC_MARK);
    if (ms) ms.setData({ type: "FeatureCollection", features: marks });
    const arrows = m.getSource(SRC_ARROWS);
    if (arrows) arrows.setData(showArrows ? fc : { type: "FeatureCollection", features: [] });

    const hl: { type: string; properties: Record<string, unknown>; geometry: { type: string; coordinates: unknown } }[] = [];
    if (hlDistM != null && line.length >= 2) {
      const p = pointAtDistanceM(line, hlDistM);
      if (p) {
        hl.push({
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: p },
        });
      }
    }
    if (selectedIssue) {
      hl.push({
        type: "Feature",
        properties: { issue: true },
        geometry: { type: "LineString", coordinates: selectedIssue.geometry },
      });
    }
    const hs = m.getSource(SRC_HL);
    if (hs) hs.setData({ type: "FeatureCollection", features: hl });

    const pfc = {
      type: "FeatureCollection",
      features: poiOn
        ? pois.map((p) => ({
            type: "Feature",
            properties: { id: p.id, cat: p.category, name: p.name ?? p.category },
            geometry: { type: "Point", coordinates: [p.lon, p.lat] },
          }))
        : [],
    };
    const ps = m.getSource(SRC_POI);
    if (ps) ps.setData(pfc);
  }, [doc, hlDistM, poiOn, pois, selectedIssue, showArrows, showMarks, stats.distanceM]);

  useEffect(() => { syncMap(); }, [syncMap, doc, tool, panel]);

  const ensureLayers = useCallback((m: any) => {
    if (!m.getSource(SRC_LINE)) {
      m.addSource(SRC_LINE, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      m.addLayer({
        id: "nr-line-casing",
        type: "line",
        source: SRC_LINE,
        paint: { "line-color": "#111", "line-width": 8, "line-opacity": 0.55 },
      });
      m.addLayer({
        id: "nr-line",
        type: "line",
        source: SRC_LINE,
        paint: { "line-color": "#f97316", "line-width": 4.5, "line-opacity": 0.98 },
      });
    }
    if (!m.getSource(SRC_ARROWS)) {
      m.addSource(SRC_ARROWS, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      m.addLayer({
        id: "nr-arrows",
        type: "symbol",
        source: SRC_ARROWS,
        layout: {
          "symbol-placement": "line",
          "text-field": "▶",
          "text-size": 12,
          "symbol-spacing": 70,
        },
        paint: { "text-color": "#fff", "text-halo-color": "#111", "text-halo-width": 1 },
      });
    }
    if (!m.getSource(SRC_HL)) {
      m.addSource(SRC_HL, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      m.addLayer({
        id: "nr-hl-line",
        type: "line",
        source: SRC_HL,
        filter: ["==", ["geometry-type"], "LineString"],
        paint: { "line-color": "#22d3ee", "line-width": 7, "line-opacity": 0.85 },
      });
      m.addLayer({
        id: "nr-hl-pt",
        type: "circle",
        source: SRC_HL,
        filter: ["==", ["geometry-type"], "Point"],
        paint: { "circle-radius": 8, "circle-color": "#22d3ee", "circle-stroke-width": 2, "circle-stroke-color": "#fff" },
      });
    }
    if (!m.getSource(SRC_COMPAT)) {
      m.addSource(SRC_COMPAT, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      m.addLayer({
        id: "nr-compat",
        type: "line",
        source: SRC_COMPAT,
        paint: { "line-color": "#ef4444", "line-width": 6, "line-opacity": 0.7 },
      });
    }
    if (!m.getSource(SRC_ANCHOR)) {
      m.addSource(SRC_ANCHOR, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      m.addLayer({
        id: "nr-anchors",
        type: "circle",
        source: SRC_ANCHOR,
        paint: {
          "circle-radius": embedNavRideApp ? 11 : 7,
          "circle-color": "#fff",
          "circle-stroke-width": 3,
          "circle-stroke-color": "#f97316",
        },
      });
    }
    if (!m.getSource(SRC_WPT)) {
      m.addSource(SRC_WPT, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      m.addLayer({
        id: "nr-wpt",
        type: "circle",
        source: SRC_WPT,
        paint: { "circle-radius": 7, "circle-color": "#22c55e", "circle-stroke-width": 2, "circle-stroke-color": "#fff" },
      });
    }
    if (!m.getSource(SRC_MARK)) {
      m.addSource(SRC_MARK, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      m.addLayer({
        id: "nr-marks",
        type: "symbol",
        source: SRC_MARK,
        layout: { "text-field": ["get", "label"], "text-size": 11 },
        paint: { "text-color": "#fff", "text-halo-color": "#000", "text-halo-width": 1.2 },
      });
    }
    if (!m.getSource(SRC_POI)) {
      m.addSource(SRC_POI, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      m.addLayer({
        id: "nr-poi",
        type: "circle",
        source: SRC_POI,
        paint: { "circle-radius": 6, "circle-color": "#38bdf8", "circle-stroke-width": 1.5, "circle-stroke-color": "#fff" },
      });
    }
    if (!m.getSource(SRC_USER)) {
      m.addSource(SRC_USER, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      m.addLayer({
        id: "nr-user",
        type: "circle",
        source: SRC_USER,
        paint: { "circle-radius": 7, "circle-color": "#3b82f6", "circle-stroke-width": 2, "circle-stroke-color": "#fff" },
      });
    }
  }, [embedNavRideApp]);

  const routePair = useCallback(async (from: LngLat, to: LngLat, gen: number): Promise<LngLat[] | null> => {
    if (trace === "STRAIGHT") return [from, to];
    const fetched = await fetchWaysAround(to, 80);
    if (engineRef.current.isStale(gen)) return null;
    if (!fetched.ok) {
      setStatus("Servicio de cartografía no disponible.");
      return [from, to];
    }
    waysCache.current = fetched.ways;
    const path = routeOnOsmNetwork(fetched.ways, from, to, mode);
    if (engineRef.current.isStale(gen)) return null;
    return path;
  }, [mode, trace]);

  const handleMapClick = useCallback(async (lng: number, lat: number) => {
    const click: LngLat = [lng, lat];
    if (tool === "waypoint") {
      engineRef.current.addWpt(lat, lng);
      redraw();
      return;
    }
    if (tool === "split") {
      const near = nearestOnPolyline(click, lngLatsOf(engineRef.current.doc));
      if (near && near.distanceM < 40) {
        engineRef.current.split(near.index, embedNavRideApp ? "segments" : "tracks");
        setTool("none");
        redraw();
      }
      return;
    }
    if (tool === "select") return;

    const line = lngLatsOf(engineRef.current.doc);
    if (line.length >= 2) {
      const near = nearestOnPolyline(click, line);
      if (near && near.distanceM < 18) {
        const gen = engineRef.current.bump();
        engineRef.current.insert(0, 0, near.index + (near.fraction > 0.5 ? 1 : 0), click);
        if (engineRef.current.isStale(gen)) return;
        redraw();
        return;
      }
    }

    const gen = engineRef.current.bump();
    setRouting(true);
    setPrompt(null);
    try {
      const fetched = await fetchWaysAround(click, 40);
      if (engineRef.current.isStale(gen)) return;
      if (fetched.ok) {
        waysCache.current = fetched.ways;
        const decision = snapClickToOsmNetwork(click, fetched.ways, mode);
        if (decision.kind === "prompt") {
          setPrompt({ hit: decision.hit, nearbyCompatible: decision.nearbyCompatible });
          pendingClick.current = click;
          setStatus(`${decision.hit.classification.wayTypeLabel} detectada · no compatible con ${PROFILES.find((p) => p.id === mode)?.label ?? mode}`);
          return;
        }
        if (decision.kind === "place") {
          click[0] = decision.snapped[0];
          click[1] = decision.snapped[1];
        }
      }
      const last = engineRef.current.lastPoint();
      let routed: LngLat[] | undefined;
      if (last) {
        const path = await routePair([last.lon, last.lat], click, gen);
        if (engineRef.current.isStale(gen)) return;
        routed = path ?? undefined;
      }
      engineRef.current.addClick(click[1], click[0], routed);
      redraw();
    } finally {
      setRouting(false);
    }
  }, [embedNavRideApp, mode, routePair, tool]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    let cancelled = false;
    import("maplibre-gl").then((ml) => {
      if (cancelled || !mapContainer.current) return;
      const map = new ml.default.Map({
        container: mapContainer.current,
        style: styleUrl(mapStyleId) as any,
        center: [-3.7038, 40.4168],
        zoom: 12,
        attributionControl: { compact: true },
      });
      mapRef.current = map;
      let drag: { ti: number; si: number; pi: number } | null = null;
      map.on("load", () => {
        ensureLayers(map);
        syncMap();
      });
      map.on("style.load", () => {
        ensureLayers(map);
        syncMap();
      });
      map.on("zoom", () => {
        zoomRef.current = map.getZoom();
        syncMap();
      });
      map.on("click", (e: any) => {
        if (drag) return;
        const feats = map.queryRenderedFeatures(e.point, { layers: ["nr-poi"] });
        if (feats[0]) {
          const id = String(feats[0].properties?.id ?? "");
          const p = poisRef.current.find((x) => x.id === id);
          if (p) {
            setPoiPick(p);
            return;
          }
        }
        const w = map.queryRenderedFeatures(e.point, { layers: ["nr-wpt"] });
        if (w[0]) {
          const id = String(w[0].properties?.id ?? "");
          const wp = engineRef.current.doc.waypoints.find((x) => x.id === id);
          if (wp) setWptEdit({ id, name: wp.name, desc: wp.desc });
          return;
        }
        void handleClickRef.current(e.lngLat.lng, e.lngLat.lat);
      });
      map.on("mousedown", "nr-anchors", (e: any) => {
        const f = e.features?.[0];
        if (!f) return;
        drag = { ti: Number(f.properties.ti), si: Number(f.properties.si), pi: Number(f.properties.pi) };
        map.dragPan.disable();
        e.preventDefault();
      });
      map.on("mousemove", (e: any) => {
        if (!drag) return;
        const pts = engineRef.current.doc.tracks[drag.ti]?.segments[drag.si]?.points;
        if (!pts?.[drag.pi]) return;
        pts[drag.pi] = { ...pts[drag.pi], lat: e.lngLat.lat, lon: e.lngLat.lng };
        syncMap();
      });
      map.on("mouseup", async () => {
        if (!drag) return;
        const d = drag;
        drag = null;
        map.dragPan.enable();
        const gen = engineRef.current.bump();
        const seg = engineRef.current.doc.tracks[d.ti]?.segments[d.si];
        if (!seg) return;
        const p = seg.points[d.pi];
        const dest: LngLat = [p.lon, p.lat];
        setRouting(true);
        try {
          let prevR: LngLat[] | undefined;
          let nextR: LngLat[] | undefined;
          const anchors = visibleAnchors(engineRef.current.doc, 22);
          const same = anchors.filter((a) => a.trackIndex === d.ti && a.segmentIndex === d.si);
          const idx = same.findIndex((a) => a.pointIndex === d.pi);
          const prevA = idx > 0 ? same[idx - 1] : null;
          const nextA = idx >= 0 && idx < same.length - 1 ? same[idx + 1] : null;
          if (prevA) prevR = (await routePair([prevA.lon, prevA.lat], dest, gen)) ?? undefined;
          if (engineRef.current.isStale(gen)) return;
          if (nextA) nextR = (await routePair(dest, [nextA.lon, nextA.lat], gen)) ?? undefined;
          if (engineRef.current.isStale(gen)) return;
          engineRef.current.move(d.ti, d.si, d.pi, dest, prevR, nextR);
          redraw();
        } finally {
          setRouting(false);
        }
      });
    });
    return () => { cancelled = true; };
  }, []);

  const handleClickRef = useRef(handleMapClick);
  handleClickRef.current = handleMapClick;
  const poisRef = useRef(pois);
  poisRef.current = pois;

  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    m.setStyle(styleUrl(mapStyleId) as any);
  }, [mapStyleId]);

  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    m.easeTo({ pitch: pitch3d ? 55 : 0, duration: 400 });
  }, [pitch3d]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) engineRef.current.redo();
        else engineRef.current.undo();
        redraw();
      } else if (meta && e.key.toLowerCase() === "y") {
        e.preventDefault();
        engineRef.current.redo();
        redraw();
      } else if (e.key === "Escape") {
        setTool("none");
        setPanel("none");
        setPrompt(null);
        setAltPreview(null);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        const a = visibleAnchors(engineRef.current.doc, 22);
        if (a.length) {
          const last = a[a.length - 1];
          engineRef.current.removeAnchor(last.trackIndex, last.segmentIndex, last.pointIndex);
          redraw();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const applyImportedGeometry = useCallback((xml: string) => {
    const parsed = engineRef.current.loadXml(xml);
    capsuleRef.current = parsed.doc.capsule;
    if (parsed.doc.capsule) engineRef.current.doc.capsule = parsed.doc.capsule;
    setTitle(parsed.doc.name);
    redraw();
    const line = lngLatsOf(engineRef.current.doc);
    if (line.length && mapRef.current) {
      const b = line.reduce(
        (acc, p) => ({
          minX: Math.min(acc.minX, p[0]),
          minY: Math.min(acc.minY, p[1]),
          maxX: Math.max(acc.maxX, p[0]),
          maxY: Math.max(acc.maxY, p[1]),
        }),
        { minX: 180, minY: 90, maxX: -180, maxY: -90 },
      );
      mapRef.current.fitBounds([[b.minX, b.minY], [b.maxX, b.maxY]], { padding: 60, duration: 400 });
    }
    return parsed;
  }, [redraw]);

  const onOpenFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseGpxFile(text);
    if (!parsed.recoverable) {
      setStatus(parsed.issues[0] ?? "GPX no válido.");
      return;
    }
    applyImportedGeometry(text);
    capsuleRef.current = parsed.capsule;
  };

  const persistRoute = useCallback(async () => {
    const gpx = exportGpx(engineRef.current.doc, capsuleRef.current);
    const res = await fetch("/api/gpx/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title,
        gpxXml: gpx,
        waypointsCount: allPoints(engineRef.current.doc).length,
        distanceM: stats.distanceM,
        existingRouteId: savedRouteId,
      }),
    });
    const result = (await res.json()) as { ok: true; routeId: string } | { ok: false; error: string };
    if (!result.ok) {
      setUploadMsg({ ok: false, text: result.error });
      return null;
    }
    setSavedRouteId(result.routeId);
    return result.routeId;
  }, [doc, savedRouteId, stats.distanceM, title]);

  const persistToApp = useCallback((alsoOpen: boolean) => {
    const gpx = exportGpx(engineRef.current.doc, capsuleRef.current);
    const routeJson = buildRouteJson(engineRef.current.doc, title, savedRouteId);
    postToNavRideApp(alsoOpen ? "OPEN_IN_NAVRIDE" : "SAVE_ROUTE", {
      gpxXml: gpx,
      route: routeJson as unknown as Record<string, unknown>,
      name: title,
      routeId: savedRouteId,
      distanceM: stats.distanceM,
      waypointsCount: allPoints(engineRef.current.doc).length,
    });
  }, [doc, savedRouteId, stats.distanceM, title]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setUploadMsg(null);
    if (embedNavRideApp) {
      persistToApp(false);
      setSaving(false);
      return;
    }
    const id = await persistRoute();
    if (id) setUploadMsg({ ok: true, text: "Ruta guardada. Visible en NavRide → GPX Web." });
    setSaving(false);
  };

  useEffect(() => {
    if (!embedNavRideApp) return;
    window.__navrideEmbedReady = true;
    postToNavRideApp("READY", {
      capabilities: { save: true, exportGpx: true, openInNavRide: true, importGpx: true, cloudSaveViaApp: true },
    });
    const unreg = registerAppToEditorHandler((msg: NavRideEditorBridgeMessage) => {
      if (msg.type === "LOAD_ROUTE") {
        const gpxXml = typeof msg.payload?.gpxXml === "string" ? msg.payload.gpxXml : "";
        if (!gpxXml) return;
        const parsed = parseGpxFile(gpxXml);
        if (!parsed.recoverable) {
          setStatus(parsed.issues[0] ?? "GPX no válido.");
          return;
        }
        applyImportedGeometry(gpxXml);
        if (parsed.capsule) capsuleRef.current = parsed.capsule;
        if (typeof msg.payload?.routeId === "string") setSavedRouteId(msg.payload.routeId);
      }
      if (msg.type === "CURRENT_LOCATION") {
        const lat = Number(msg.payload?.lat);
        const lon = Number(msg.payload?.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
        mapRef.current?.easeTo({ center: [lon, lat], zoom: 14 });
        const src = mapRef.current?.getSource(SRC_USER);
        if (src) src.setData({ type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [lon, lat] } }] });
      }
    });
    return () => unreg();
  }, [applyImportedGeometry, embedNavRideApp]);

  useEffect(() => {
    postToNavRideApp("DIRTY_STATE_CHANGED", { dirty: doc.dirty });
  }, [doc.dirty]);

  useEffect(() => {
    if (!poiOn || poiCats.length === 0) {
      setPois([]);
      return;
    }
    const m = mapRef.current;
    if (!m) return;
    const b = m.getBounds();
    const gen = poiStore.current.bump();
    fetchPoisBbox(poiCats, b.getSouth(), b.getWest(), b.getNorth(), b.getEast(), gen, poiStore.current)
      .then((r) => {
        if (poiStore.current.isStale(r.generation)) return;
        setPois(r.pois);
      })
      .catch(() => setStatus("Puntos de interés: tiempo de espera agotado."));
  }, [poiOn, poiCats, mapStyleId]);

  const runDoctor = async () => {
    const line = lngLatsOf(engineRef.current.doc);
    if (line.length < 2) return;
    const fetched = await fetchWaysAlongRoute(line);
    if (!fetched.ok) {
      setStatus("Route Doctor: Overpass no disponible.");
      return;
    }
    const a = auditRouteGeometry(line, fetched.ways, mode);
    setAudit(a);
    setPanel("tools");
  };

  const flyIssue = (issue: CompatibilityIssue) => {
    setSelectedIssue(issue);
    mapRef.current?.flyTo({ center: issue.midpoint, zoom: 16, duration: 600 });
  };

  const findAlt = async () => {
    if (!prompt) return;
    setFindingAlt(true);
    const last = engineRef.current.lastPoint();
    const click = pendingClick.current;
    if (!last || !click) {
      setFindingAlt(false);
      return;
    }
    const fetched = await fetchWaysAround(click, 120);
    const preferred = compatibleWaysOnly(fetched.ways, mode);
    const path = routeOnOsmNetwork(preferred.length ? preferred : fetched.ways, [last.lon, last.lat], click, mode);
    setAltPreview(path);
    setFindingAlt(false);
  };

  const acceptAlt = () => {
    if (!altPreview || altPreview.length < 2) return;
    const last = altPreview[altPreview.length - 1];
    engineRef.current.addClick(last[1], last[0], altPreview);
    setAltPreview(null);
    setPrompt(null);
    redraw();
  };

  const locate = () => {
    if (embedNavRideApp) {
      postToNavRideApp("REQUEST_CURRENT_LOCATION", {}, newBridgeRequestId());
      return;
    }
    navigator.geolocation?.getCurrentPosition((pos) => {
      mapRef.current?.easeTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 14 });
    });
  };

  const doSearch = async () => {
    const q = search.trim();
    if (!q) return;
    const coord = q.match(/^\s*(-?\d+\.?\d*)\s*[, ]\s*(-?\d+\.?\d*)\s*$/);
    if (coord) {
      const lat = Number(coord[1]);
      const lon = Number(coord[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
        mapRef.current?.easeTo({ center: [lon, lat], zoom: 14 });
        return;
      }
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
        { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) },
      );
      const json = (await res.json()) as { lon: string; lat: string }[];
      if (json[0]) mapRef.current?.easeTo({ center: [Number(json[0].lon), Number(json[0].lat)], zoom: 13 });
    } catch {
      setStatus("Búsqueda no disponible.");
    }
  };

  const barBtn = "h-9 px-2.5 rounded-lg text-xs font-medium bg-black/55 hover:bg-black/75 border border-white/10 backdrop-blur-md";
  const sheet = embedNavRideApp
    ? "absolute left-2 right-2 bottom-3 rounded-2xl bg-[#121214]/95 border border-white/10 p-3 max-h-[46vh] overflow-auto"
    : "absolute top-16 right-3 w-72 rounded-xl bg-[#121214]/95 border border-white/10 p-3 max-h-[70vh] overflow-auto";

  return (
    <div
      className="relative w-full h-full min-h-[100dvh] overflow-hidden bg-[#050608]"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f) void onOpenFile(f);
      }}
    >
      <div ref={mapContainer} className="absolute inset-0" />

      <div className={`absolute ${embedNavRideApp ? "top-2 left-2 right-2" : "top-3 left-1/2 -translate-x-1/2"} z-10 flex flex-wrap items-center justify-center gap-1`}>
        <button type="button" className={barBtn} onClick={() => { engineRef.current.reset(title); capsuleRef.current = null; redraw(); }}><Plus size={14} /> Nueva</button>
        <button type="button" className={barBtn} onClick={() => fileRef.current?.click()}><Upload size={14} /> Abrir</button>
        <button type="button" className={barBtn} onClick={() => void handleSave()}>Guardar</button>
        <button type="button" className={barBtn} disabled={!canUndo} onClick={() => { engineRef.current.undo(); redraw(); }}><Undo2 size={14} /></button>
        <button type="button" className={barBtn} disabled={!canRedo} onClick={() => { engineRef.current.redo(); redraw(); }}><Redo2 size={14} /></button>
        <button type="button" className={`${barBtn} ${panel === "tools" ? "bg-orange-600" : ""}`} onClick={() => setPanel(panel === "tools" ? "none" : "tools")}><Wrench size={14} /> Herramientas</button>
        <button type="button" className={`${barBtn} ${panel === "layers" ? "bg-orange-600" : ""}`} onClick={() => setPanel(panel === "layers" ? "none" : "layers")}><Layers size={14} /> Capas</button>
        {PROFILES.map((p) => (
          <button key={p.id} type="button" className={`${barBtn} ${mode === p.id ? "bg-orange-600 text-white" : ""}`} onClick={() => setMode(p.id)}>
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      <div className="absolute top-14 left-3 z-10 flex gap-1">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void doSearch()}
          placeholder="Localidad, dirección, GPS"
          className="h-9 w-52 rounded-lg bg-black/55 border border-white/10 px-2 text-xs"
        />
        <button type="button" className={barBtn} onClick={() => void doSearch()}><Search size={14} /></button>
        <button type="button" className={barBtn} onClick={locate}><Crosshair size={14} /> Mi ubicación</button>
      </div>

      <input ref={fileRef} type="file" accept=".gpx,application/gpx+xml,text/xml" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onOpenFile(f); }} />

      {routing && (
        <div className="absolute top-14 right-3 z-10 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] text-white/80">
          <Loader2 size={12} className="animate-spin" /> Calculando…
        </div>
      )}

      {panel === "tools" && (
        <div className={sheet}>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Herramientas</p>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button className={barBtn} onClick={() => setTrace(trace === "FOLLOW_WAYS" ? "STRAIGHT" : "FOLLOW_WAYS")}>
              {trace === "FOLLOW_WAYS" ? "Seguir vías" : "Línea directa"}
            </button>
            <button className={barBtn} onClick={() => { engineRef.current.reverse(); redraw(); }}>Invertir</button>
            <button className={barBtn} onClick={() => { engineRef.current.roundTrip(); redraw(); }}>Ida y vuelta</button>
            <button className={barBtn} onClick={async () => {
              const last = engineRef.current.lastPoint();
              const first = engineRef.current.firstPoint();
              if (!last || !first) return;
              const gen = engineRef.current.bump();
              const path = await routePair([last.lon, last.lat], [first.lon, first.lat], gen);
              if (!path || engineRef.current.isStale(gen)) return;
              engineRef.current.backToStart(path);
              redraw();
            }}>Volver al inicio</button>
            <button className={barBtn} onClick={async () => {
              const last = engineRef.current.lastPoint();
              const first = engineRef.current.firstPoint();
              if (!last || !first) return;
              const gen = engineRef.current.bump();
              const path = await routePair([last.lon, last.lat], [first.lon, first.lat], gen);
              if (!path || engineRef.current.isStale(gen)) return;
              engineRef.current.closeLoop(path);
              redraw();
            }}>Cerrar circuito</button>
            <button className={barBtn} onClick={() => {
              const line = lngLatsOf(engineRef.current.doc);
              const near = nearestOnPolyline(line[0] ?? [0, 0], line);
              if (near) engineRef.current.startLoopHere(near.index);
              redraw();
            }}>Empezar aquí</button>
            <button className={barBtn} onClick={() => setTool(tool === "crop" ? "none" : "crop")}>Recortar</button>
            <button className={barBtn} onClick={() => setTool(tool === "split" ? "none" : "split")}>Dividir aquí</button>
            <button className={barBtn} onClick={() => { engineRef.current.merge("connect"); redraw(); }}>Conectar</button>
            <button className={barBtn} onClick={() => { engineRef.current.merge("group"); redraw(); }}>Agrupar</button>
            <button className={barBtn} onClick={() => setTool(tool === "waypoint" ? "none" : "waypoint")}>Waypoint</button>
            <button className={barBtn} onClick={() => setTool(tool === "select" ? "none" : "select")}>Selección</button>
            <button className={barBtn} onClick={() => void runDoctor()}>Route Doctor</button>
            <button className={barBtn} onClick={() => setPanel("poi")}>Puntos de interés</button>
          </div>
          <div className="mt-3">
            <p className="text-[11px] text-white/50">Reducir puntos · {simEst.before.toLocaleString("es")} → {simEst.after.toLocaleString("es")}</p>
            <input type="range" min={2} max={80} value={simplify} onChange={(e) => setSimplify(Number(e.target.value))} className="w-full" />
            <div className="flex justify-between text-[10px] text-white/35"><span>Más detalle</span><span>Menos detalle</span></div>
            <button className={`${barBtn} mt-1 w-full`} onClick={() => { engineRef.current.simplify(simplify); redraw(); }}>Aplicar simplificar</button>
          </div>
          {tool === "crop" && (
            <div className="mt-3 text-xs">
              <p>Inicio / final (m)</p>
              <input type="range" min={0} max={stats.distanceM} value={crop?.[0] ?? 0} onChange={(e) => setCrop([Number(e.target.value), crop?.[1] ?? stats.distanceM])} className="w-full" />
              <input type="range" min={0} max={stats.distanceM} value={crop?.[1] ?? stats.distanceM} onChange={(e) => setCrop([crop?.[0] ?? 0, Number(e.target.value)])} className="w-full" />
              <p className="text-white/50">{((crop ? crop[1] - crop[0] : stats.distanceM) / 1000).toFixed(2)} km</p>
              <button className={`${barBtn} w-full mt-1`} onClick={() => {
                if (!crop) return;
                const line = lngLatsOf(engineRef.current.doc);
                const a = nearestOnPolyline(pointAtDistanceM(line, crop[0]) ?? line[0], line);
                const b = nearestOnPolyline(pointAtDistanceM(line, crop[1]) ?? line[line.length - 1], line);
                if (a && b) engineRef.current.crop(a.index, b.index);
                setTool("none");
                setCrop(null);
                redraw();
              }}>Confirmar recorte</button>
            </div>
          )}
          {audit && (
            <div className="mt-3">
              <RouteCompatibilityReview
                audit={audit}
                loading={false}
                selected={selectedIssue}
                onReview={() => void runDoctor()}
                onSelectIssue={(issue) => flyIssue(issue)}
                onKeep={() => setSelectedIssue(null)}
                onFindAlt={() => void findAlt()}
                onEdit={() => setTool("none")}
                onBack={() => setSelectedIssue(null)}
              />
            </div>
          )}
        </div>
      )}

      {panel === "layers" && (
        <div className={sheet}>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Mapa</p>
          {MAP_STYLES.map((s) => (
            <button key={s.id} type="button" className={`${barBtn} w-full mb-1 ${mapStyleId === s.id ? "bg-orange-600" : ""}`} onClick={() => setMapStyleId(s.id)}>
              {s.label}
            </button>
          ))}
          <button className={`${barBtn} w-full mt-2`} onClick={() => setPitch3d((v) => !v)}>{pitch3d ? "3D" : "2D"}</button>
          <button className={`${barBtn} w-full mt-1`} onClick={() => setShowArrows((v) => !v)}>Flechas de dirección {showArrows ? "ON" : "OFF"}</button>
          <button className={`${barBtn} w-full mt-1`} onClick={() => setShowMarks((v) => !v)}>Marcadores de distancia {showMarks ? "ON" : "OFF"}</button>
          {multi && (
            <button className={`${barBtn} w-full mt-2`} onClick={() => setPanel("tracks")}>Trazas ({doc.tracks.length})</button>
          )}
        </div>
      )}

      {panel === "poi" && (
        <div className={sheet}>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Puntos de interés</p>
          <button className={`${barBtn} w-full mb-2`} onClick={() => {
            const next = !poiOn;
            setPoiOn(next);
            if (next && poiCats.length === 0) setPoiCats(POI_MODE_DEFAULTS[mode] ?? []);
          }}>{poiOn ? "POI ON" : "POI apagados"}</button>
          {POI_CATEGORIES.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-xs py-1">
              <input
                type="checkbox"
                checked={poiCats.includes(c.id)}
                onChange={() => {
                  setPoiCats((cur) => cur.includes(c.id) ? cur.filter((x) => x !== c.id) : [...cur, c.id]);
                  setPoiOn(true);
                }}
              />
              {c.label}
            </label>
          ))}
        </div>
      )}

      {panel === "tracks" && multi && (
        <div className={sheet}>
          {doc.tracks.map((t, i) => (
            <div key={t.id} className="flex items-center gap-2 text-xs py-1">
              <input type="checkbox" checked={!t.hidden} onChange={() => { engineRef.current.hideTrack(i, !t.hidden); redraw(); }} />
              <input className="bg-transparent flex-1 border-b border-white/10" value={t.name} onChange={(e) => { engineRef.current.rename(i, e.target.value); redraw(); }} />
              <button onClick={() => { engineRef.current.duplicate(i); redraw(); }}>Dup</button>
              <button onClick={() => { engineRef.current.dropTrack(i); redraw(); }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {prompt && (
        <div className="absolute bottom-28 left-3 z-20 w-72">
          <CompatibilityPromptCard
            prompt={prompt}
            mode={mode}
            findingAlt={findingAlt}
            onViewMap={() => mapRef.current?.flyTo({ center: prompt.hit.snapped, zoom: 16 })}
            onFindAlt={() => void findAlt()}
            onCancel={() => { setPrompt(null); pendingClick.current = null; }}
          />
        </div>
      )}
      {altPreview && (
        <div className="absolute bottom-28 left-80 z-20 w-64">
          <CompatibilityAltPreview
            onAccept={acceptAlt}
            onDismiss={() => setAltPreview(null)}
          />
        </div>
      )}

      {poiPick && (
        <div className="absolute bottom-28 right-3 z-20 w-64 rounded-xl bg-[#121214] border border-white/10 p-3 text-xs">
          <p className="font-semibold">{poiPick.name ?? poiPick.category}</p>
          <p className="text-white/50">{poiPick.category}</p>
          <div className="mt-2 grid gap-1">
            <button className={barBtn} onClick={() => { engineRef.current.addClick(poiPick.lat, poiPick.lon); setPoiPick(null); redraw(); }}>Añadir a ruta</button>
            <button className={barBtn} onClick={() => { engineRef.current.addWpt(poiPick.lat, poiPick.lon, poiPick.name ?? poiPick.category); setPoiPick(null); redraw(); }}>Añadir como waypoint</button>
            <button className={barBtn} onClick={() => setPoiPick(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {wptEdit && (
        <div className="absolute bottom-28 right-3 z-20 w-64 rounded-xl bg-[#121214] border border-white/10 p-3 text-xs">
          <input className="w-full bg-black/40 rounded px-2 py-1 mb-1" value={wptEdit.name} onChange={(e) => setWptEdit({ ...wptEdit, name: e.target.value })} />
          <textarea className="w-full bg-black/40 rounded px-2 py-1 h-16" value={wptEdit.desc} onChange={(e) => setWptEdit({ ...wptEdit, desc: e.target.value })} />
          <div className="flex gap-1 mt-1">
            <button className={barBtn} onClick={() => { engineRef.current.patchWpt(wptEdit.id, { name: wptEdit.name, desc: wptEdit.desc }); setWptEdit(null); redraw(); }}>OK</button>
            <button className={barBtn} onClick={() => { engineRef.current.deleteWpt(wptEdit.id); setWptEdit(null); redraw(); }}>Borrar</button>
          </div>
        </div>
      )}

      <div className={`absolute ${embedNavRideApp ? "bottom-[4.5rem]" : "bottom-2"} left-3 right-3 z-10`}>
        <button type="button" className="mb-1 text-[10px] text-white/50" onClick={() => setProfileOpen((v) => !v)}>
          {profileOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />} Perfil
        </button>
        {profileOpen && (
          <div className="rounded-xl bg-black/60 border border-white/10 px-3 py-2">
            <div className="flex flex-wrap gap-3 text-[11px] text-white/80">
              <span>{(stats.distanceM / 1000).toFixed(2)} km</span>
              <span>↑ {Math.round(stats.ascentM)} m</span>
              <span>↓ {Math.round(stats.descentM)} m</span>
              {stats.eleMin != null && <span>min {Math.round(stats.eleMin)} m</span>}
              {stats.eleMax != null && <span>max {Math.round(stats.eleMax)} m</span>}
              {crop && <span>sel {((crop[1] - crop[0]) / 1000).toFixed(2)} km</span>}
            </div>
            <svg
              viewBox="0 0 400 56"
              className="w-full h-14 mt-1"
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const t = (e.clientX - r.left) / r.width;
                setHlDistM(t * stats.distanceM);
              }}
              onMouseLeave={() => setHlDistM(null)}
            >
              {profile.filter((p) => p.ele != null).length >= 2 && (() => {
                const eles = profile.map((p) => p.ele ?? 0);
                const min = Math.min(...eles);
                const max = Math.max(...eles);
                const span = Math.max(1, max - min);
                const d = profile.map((p, i) => {
                  const x = (p.distM / Math.max(1, stats.distanceM)) * 400;
                  const y = 50 - ((p.ele ?? min) - min) / span * 44;
                  return `${i === 0 ? "M" : "L"}${x},${y}`;
                }).join(" ");
                return <path d={d} fill="none" stroke="#f97316" strokeWidth="2" />;
              })()}
            </svg>
          </div>
        )}
      </div>

      <div className="absolute bottom-2 right-3 z-10 flex gap-1">
        <button type="button" className={barBtn} onClick={() => {
          const gpx = exportGpx(engineRef.current.doc, capsuleRef.current);
          const blob = new Blob([gpx], { type: "application/gpx+xml" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `${title.replace(/\s+/g, "_")}.gpx`;
          a.click();
          if (embedNavRideApp) postToNavRideApp("EXPORT_GPX", { gpxXml: gpx, name: title });
        }}><Download size={14} /></button>
      </div>

      {status && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 rounded-lg bg-black/75 px-3 py-1.5 text-xs text-white/80 flex items-center gap-2">
          {status}
          <button type="button" onClick={() => setStatus(null)}><X size={12} /></button>
        </div>
      )}
      {uploadMsg && (
        <div className={`absolute top-24 left-1/2 -translate-x-1/2 z-20 rounded-lg px-3 py-1.5 text-xs ${uploadMsg.ok ? "bg-emerald-900/80" : "bg-red-900/80"}`}>
          {uploadMsg.text}
        </div>
      )}

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="absolute bottom-2 left-3 z-0 sr-only"
        aria-label="Nombre de ruta"
      />
    </div>
  );
}
