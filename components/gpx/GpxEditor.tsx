"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Trash2, Undo2, Redo2, Download, Upload, MapPin, Plus,
  RotateCw, Loader2, AlertCircle, CheckCircle2, X,
  Navigation, Maximize2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────
type LngLat = [number, number];

interface Segment {
  id: string;
  name: string;
  color: string;
  waypoints: LngLat[];
  routePoints: LngLat[];
}

// ─── Map styles ───────────────────────────────────────────────────────────────
// Inline satellite style (ESRI World Imagery — free, no API key)
const SAT_STYLE = {
  version: 8 as const,
  glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  sources: {
    satellite: {
      type: "raster" as const,
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© Esri, Maxar, Earthstar Geographics",
    },
    // Overlay roads/labels from OSM on top of satellite
    "osm-labels": {
      type: "raster" as const,
      tiles: [
        "https://tiles.openfreemap.org/planet/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
    },
  },
  layers: [
    { id: "sat-bg", type: "raster" as const, source: "satellite" },
  ],
};

type StyleId = "liberty" | "satellite" | "bright" | "positron";

const MAP_STYLES: { id: StyleId; label: string; url: string | object }[] = [
  { id: "liberty",   label: "Rutas",     url: "https://tiles.openfreemap.org/styles/liberty"   },
  { id: "satellite", label: "Satélite",  url: SAT_STYLE                                        },
  { id: "bright",    label: "Outdoor",   url: "https://tiles.openfreemap.org/styles/bright"    },
  { id: "positron",  label: "Claro",     url: "https://tiles.openfreemap.org/styles/positron"  },
];

// ─── Constants ────────────────────────────────────────────────────────────────
const SRC_LINES  = "nav-lines";
const SRC_POINTS = "nav-points";
const LYR_GLOW   = "nav-glow";       // blurred halo behind the line
const LYR_LINES  = "nav-lyr-lines";  // crisp route line
const LYR_POINTS = "nav-lyr-points"; // waypoint circles

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

async function osrmRoute(waypoints: LngLat[]): Promise<LngLat[]> {
  if (waypoints.length < 2) return waypoints;
  const coords = waypoints
    .map(([lng, lat]) => `${lng.toFixed(6)},${lat.toFixed(6)}`)
    .join(";");

  // Try driving first (paved roads), then foot (dirt tracks/paths), then bike
  const profiles = ["driving", "foot", "bike"];
  for (const profile of profiles) {
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson`,
        { signal: AbortSignal.timeout(7000) },
      );
      if (!res.ok) continue;
      const data = await res.json();
      if (data.code === "Ok" && data.routes?.[0]?.geometry?.coordinates?.length > 0) {
        return data.routes[0].geometry.coordinates as LngLat[];
      }
    } catch {
      // network error or timeout — try next profile
    }
  }
  // All profiles failed — fall back to straight lines
  return waypoints;
}

function buildGeoJSON(segs: Segment[]) {
  const lines = segs
    .filter(s => s.routePoints.length >= 2 || s.waypoints.length >= 2)
    .map(s => ({
      type: "Feature" as const,
      properties: { color: s.color },
      geometry: {
        type: "LineString" as const,
        coordinates: s.routePoints.length >= 2 ? s.routePoints : s.waypoints,
      },
    }));

  const points = segs.flatMap(s =>
    s.waypoints.map((p, pi) => ({
      type: "Feature" as const,
      properties: { color: s.color, segId: s.id, ptIdx: pi },
      geometry: { type: "Point" as const, coordinates: p },
    })),
  );

  return {
    lines:  { type: "FeatureCollection" as const, features: lines  },
    points: { type: "FeatureCollection" as const, features: points },
  };
}

function exportGpx(segs: Segment[], title: string): string {
  const pts = segs.flatMap(s =>
    s.routePoints.length >= 2 ? s.routePoints : s.waypoints,
  );
  const trkpts = pts
    .map(
      ([lng, lat]) =>
        `      <trkpt lat="${lat.toFixed(7)}" lon="${lng.toFixed(7)}"><ele>0</ele></trkpt>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="NavRide Web Editor" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${title}</name></metadata>
  <trk>
    <name>${title}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

function mkSeg(color = COLORS[0].value): Segment {
  return { id: uid(), name: "Segmento", color, waypoints: [], routePoints: [] };
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
  const [uploading,  setUploading]  = useState(false);
  const [uploadMsg,  setUploadMsg]  = useState<{ ok: boolean; text: string } | null>(null);

  // Refs to avoid stale closures inside map handlers
  const segsRef      = useRef<Segment[]>([INIT_SEG]);
  const activeIdRef  = useRef<string>(INIT_SEG.id);
  const histRef      = useRef<Segment[][]>([[INIT_SEG]]);
  const histIdxRef   = useRef(0);
  const styleChangingRef = useRef(false);

  useEffect(() => { segsRef.current = segments; },   [segments]);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  // ── Map sync ──
  const syncMap = useCallback((segs: Segment[]) => {
    const map = mapRef.current;
    if (!map || !mapReady.current) return;
    const { lines, points } = buildGeoJSON(segs);
    try {
      map.getSource(SRC_LINES)?.setData(lines);
      map.getSource(SRC_POINTS)?.setData(points);
    } catch { /* style change in progress */ }
  }, []);

  useEffect(() => { syncMap(segments); }, [segments, syncMap]);

  // ── History ──
  const pushHist = useCallback((segs: Segment[]) => {
    const trimmed = histRef.current.slice(0, histIdxRef.current + 1);
    const h = [...trimmed, JSON.parse(JSON.stringify(segs))];
    histRef.current = h;
    histIdxRef.current = h.length - 1;
    setHistIdx(histIdxRef.current);
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

    // Called on initial load AND after every style change
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setupLayers = (m: any) => {
      // Remove existing nav layers/sources if present (after style change they're gone, but be safe)
      [LYR_POINTS, LYR_LINES, LYR_GLOW].forEach(l => {
        if (m.getLayer(l)) m.removeLayer(l);
      });
      [SRC_LINES, SRC_POINTS].forEach(s => {
        if (m.getSource(s)) m.removeSource(s);
      });

      const { lines, points } = buildGeoJSON(segsRef.current);

      m.addSource(SRC_LINES,  { type: "geojson", data: lines  });
      m.addSource(SRC_POINTS, { type: "geojson", data: points });

      // Glow (blurred halo below the route line)
      m.addLayer({
        id: LYR_GLOW,
        type: "line",
        source: SRC_LINES,
        paint: {
          "line-color":   ["get", "color"],
          "line-width":   16,
          "line-opacity": 0.22,
          "line-blur":    8,
        },
      });

      // Route line (crisp, on top of glow)
      m.addLayer({
        id: LYR_LINES,
        type: "line",
        source: SRC_LINES,
        paint: {
          "line-color":   ["get", "color"],
          "line-width":   4.5,
          "line-opacity": 0.95,
          "line-cap":     "round",
          "line-join":    "round",
        },
      });

      // Waypoint circles
      m.addLayer({
        id: LYR_POINTS,
        type: "circle",
        source: SRC_POINTS,
        paint: {
          "circle-radius":         7,
          "circle-color":          ["get", "color"],
          "circle-stroke-color":   "#ffffff",
          "circle-stroke-width":   2.5,
          "circle-stroke-opacity": 1,
        },
      });

      mapReady.current = true;
      styleChangingRef.current = false;
    };

    const attachEvents = (m: any) => {
      if (eventsAttached) return;
      eventsAttached = true;

      // Click to add waypoint
      m.on("click", async (e: any) => {
        const hit = m.queryRenderedFeatures(e.point, { layers: [LYR_POINTS] });
        if (hit.length > 0) return;
        if (styleChangingRef.current) return;

        const { lng, lat } = e.lngLat;
        const newPt: LngLat = [lng, lat];
        const aId  = activeIdRef.current;
        const curr = segsRef.current;

        const withPt = curr.map(s =>
          s.id !== aId ? s : { ...s, waypoints: [...s.waypoints, newPt] },
        );
        segsRef.current = withPt;
        setSegments(withPt);
        syncMap(withPt);

        const activeSeg = withPt.find(s => s.id === aId);
        if (!activeSeg || activeSeg.waypoints.length < 2) {
          pushHist(withPt);
          return;
        }

        setRouting(true);
        const routePoints = await osrmRoute(activeSeg.waypoints);
        setSegments(prev => {
          const r = prev.map(s => s.id === aId ? { ...s, routePoints } : s);
          segsRef.current = r;
          syncMap(r);
          pushHist(r);
          return r;
        });
        setRouting(false);
      });

      // Drag start
      m.on("mousedown", LYR_POINTS, (e: any) => {
        e.preventDefault();
        const props = e.features[0].properties;
        dragInfo = { segId: String(props.segId), ptIdx: Number(props.ptIdx) };
        m.getCanvas().style.cursor = "grabbing";
        m.dragPan.disable();
      });

      // Drag move (live update)
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

      // Drag end — re-route via OSRM
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
        const routePoints = await osrmRoute(seg.waypoints);
        setSegments(prev => {
          const r = prev.map(s => s.id === di.segId ? { ...s, routePoints } : s);
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

      // Re-add our layers every time the style changes (setStyle removes them)
      map.on("style.load", () => {
        if (!eventsAttached) return; // initial load handled by 'load'
        setupLayers(map);
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
    const style = MAP_STYLES.find(s => s.id === mapStyleId);
    if (!style) return;
    mapReady.current     = false;
    styleChangingRef.current = true;
    map.setStyle(style.url as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  }, [mapStyleId]);

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

  const handleClear = useCallback(() => {
    const upd = segsRef.current.map(s =>
      s.id !== activeIdRef.current ? s : { ...s, waypoints: [], routePoints: [] },
    );
    segsRef.current = upd;
    setSegments(upd);
    syncMap(upd);
    pushHist(upd);
  }, [syncMap, pushHist]);

  const handleCloseLoop = useCallback(async () => {
    const seg = segsRef.current.find(s => s.id === activeIdRef.current);
    if (!seg || seg.waypoints.length < 3) return;
    const closed: LngLat[] = [...seg.waypoints, seg.waypoints[0]];
    setRouting(true);
    const routePoints = await osrmRoute(closed).catch(() => closed);
    const upd = segsRef.current.map(s =>
      s.id === activeIdRef.current ? { ...s, waypoints: closed, routePoints } : s,
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
    syncMap(upd);
    pushHist(upd);
  }, [syncMap, pushHist]);

  const handleColor = useCallback((segId: string, color: string) => {
    const upd = segsRef.current.map(s => s.id === segId ? { ...s, color } : s);
    segsRef.current = upd;
    setSegments(upd);
    syncMap(upd);
  }, [syncMap]);

  // GPS — fly to user's current location
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        mapRef.current?.flyTo({
          center: [coords.longitude, coords.latitude],
          zoom: 14,
          duration: 1200,
        });
      },
      () => { /* location denied or unavailable */ },
    );
  }, []);

  // Fit map view to current route extent
  const handleFitRoute = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const allPts = segsRef.current.flatMap(s =>
      s.routePoints.length >= 2 ? s.routePoints : s.waypoints,
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
      s.routePoints.length >= 2 ? s.routePoints : s.waypoints,
    );
    if (allPts.length < 2) return;
    const gpx  = exportGpx(segments, routeTitle);
    const blob = new Blob([gpx], { type: "application/gpx+xml" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${routeTitle.replace(/\s+/g, "_")}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  }, [segments, routeTitle]);

  const handleUpload = useCallback(async () => {
    const allPts = segments.flatMap(s =>
      s.routePoints.length >= 2 ? s.routePoints : s.waypoints,
    );
    if (allPts.length < 2) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      const supabase = createClient();
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        setUploadMsg({ ok: false, text: "Necesitas iniciar sesión para enviar rutas." });
        setUploading(false);
        return;
      }

      // 1 — Subir archivo GPX al bucket
      const gpx      = exportGpx(segments, routeTitle);
      const blob     = new Blob([gpx], { type: "application/gpx+xml" });
      const fileName = `${user.id}/${Date.now()}_${routeTitle.replace(/\s+/g, "_")}.gpx`;
      const { error: storageErr } = await supabase.storage
        .from("gpx")
        .upload(fileName, blob, { contentType: "application/gpx+xml" });
      if (storageErr) {
        setUploadMsg({ ok: false, text: `Error al subir el archivo: ${storageErr.message}` });
        setUploading(false);
        return;
      }

      // 2 — Obtener URL pública
      const { data: urlData } = supabase.storage.from("gpx").getPublicUrl(fileName);

      // 3 — Insertar en gpx_routes y capturar el error correctamente
      const { error: insertErr } = await supabase.from("gpx_routes").insert({
        author_id:       user.id,
        title:           routeTitle,
        storage_url:     urlData.publicUrl,
        waypoints_count: allPts.length,
        distance_m:      Math.round(totalKm(segments) * 1000),
        is_public:       false,
      });
      if (insertErr) {
        // Borrar el archivo que ya subimos para no dejar huérfanos
        await supabase.storage.from("gpx").remove([fileName]).catch(() => {});
        setUploadMsg({ ok: false, text: `Error al guardar la ruta: ${insertErr.message}` });
        setUploading(false);
        return;
      }

      setUploadMsg({ ok: true, text: "✅ Ruta guardada. Abre 'Mis Rutas Web' en la app para descargarla." });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setUploadMsg({ ok: false, text: `Error inesperado: ${msg}` });
    }
    setUploading(false);
  }, [segments, routeTitle]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const km            = totalKm(segments);
  const totalWpts     = segments.reduce((a, s) => a + s.waypoints.length, 0);
  const totalRoutePts = segments.reduce((a, s) => a + s.routePoints.length, 0);
  const activeSeg     = segments.find(s => s.id === activeId) ?? segments[0];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col md:flex-row flex-1 h-full overflow-hidden">

      {/* ── Map container ── */}
      <div className="relative flex-1 h-64 md:h-full">
        <div ref={mapContainer} className="w-full h-full" />

        {/* ── Floating edit toolbar (left) ── */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <button onClick={handleUndo} title="Deshacer" disabled={histIdx === 0}
            className="w-9 h-9 rounded-lg bg-[#0a0a0a]/90 border border-white/15 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 transition shadow-lg">
            <Undo2 size={15} />
          </button>
          <button onClick={handleRedo} title="Rehacer" disabled={histIdx >= histRef.current.length - 1}
            className="w-9 h-9 rounded-lg bg-[#0a0a0a]/90 border border-white/15 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 transition shadow-lg">
            <Redo2 size={15} />
          </button>
          <button onClick={handleClear} title="Borrar segmento activo"
            disabled={!activeSeg || activeSeg.waypoints.length === 0}
            className="w-9 h-9 rounded-lg bg-[#0a0a0a]/90 border border-white/15 flex items-center justify-center text-white/70 hover:text-red-400 disabled:opacity-30 transition shadow-lg">
            <Trash2 size={15} />
          </button>
          <button onClick={handleCloseLoop} title="Cerrar loop"
            disabled={!activeSeg || activeSeg.waypoints.length < 3}
            className="w-9 h-9 rounded-lg bg-[#0a0a0a]/90 border border-white/15 flex items-center justify-center text-white/70 hover:text-[#f97316] disabled:opacity-30 transition shadow-lg">
            <RotateCw size={15} />
          </button>
        </div>

        {/* ── Floating nav tools (right) ── */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
          <button onClick={handleLocate} title="Mi ubicación GPS"
            className="w-9 h-9 rounded-lg bg-[#0a0a0a]/90 border border-white/15 flex items-center justify-center text-white/70 hover:text-[#3b82f6] transition shadow-lg">
            <Navigation size={15} />
          </button>
          <button onClick={handleFitRoute} title="Ajustar vista a la ruta"
            disabled={totalWpts < 2}
            className="w-9 h-9 rounded-lg bg-[#0a0a0a]/90 border border-white/15 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-30 transition shadow-lg">
            <Maximize2 size={15} />
          </button>
        </div>

        {/* ── Map style switcher (bottom center) ── */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-[#0a0a0a]/90 border border-white/15 rounded-full px-1.5 py-1 shadow-xl">
          {MAP_STYLES.map(s => (
            <button
              key={s.id}
              onClick={() => setMapStyleId(s.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                mapStyleId === s.id
                  ? "bg-[#f97316] text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* ── OSRM routing indicator ── */}
        {routing && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#0a0a0a]/90 border border-white/15 rounded-full px-4 py-2 text-xs text-white/70 z-10 whitespace-nowrap shadow-lg">
            <Loader2 size={13} className="animate-spin text-[#f97316]" />
            Calculando snap-to-road…
          </div>
        )}
      </div>

      {/* ── Sidebar ── */}
      <aside className="w-full md:w-80 flex flex-col bg-[#0a0a0a] border-t md:border-t-0 md:border-l border-white/8 overflow-y-auto shrink-0">
        <div className="p-4 flex flex-col gap-4">

          {/* Header */}
          <div>
            <h2 className="text-sm font-bold text-white">Editor GPX Pro</h2>
            <p className="text-xs text-white/40 mt-0.5">
              Clic en mapa · Arrastra nodos · Colores por tramo
            </p>
          </div>

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
              <button onClick={handleAddSeg}
                className="flex items-center gap-1 text-xs text-[#f97316] hover:text-[#fb923c] transition">
                <Plus size={12} /> Nuevo
              </button>
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
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/20"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="text-xs text-white font-medium truncate">{seg.name}</span>
                    <span className="text-xs text-white/30 shrink-0">
                      {segKm(seg.routePoints.length >= 2 ? seg.routePoints : seg.waypoints).toFixed(2)} km
                    </span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteSeg(seg.id); }}
                    className="text-white/20 hover:text-red-400 transition shrink-0 ml-1">
                    <X size={13} />
                  </button>
                </div>

                {seg.id === activeId && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {COLORS.map(c => (
                      <button
                        key={c.value}
                        title={`${c.label} — ${c.desc}`}
                        onClick={ev => { ev.stopPropagation(); handleColor(seg.id, c.value); }}
                        className={`w-5 h-5 rounded-full border-2 transition ${
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
            ))}
          </div>

          {/* Note */}
          <p className="text-xs text-white/25 flex items-start gap-1.5">
            <MapPin size={11} className="shrink-0 mt-0.5" />
            Snap-to-road OSRM · Satélite ESRI · OpenFreeMap OSM
          </p>

          {/* Download */}
          <button onClick={handleDownload} disabled={totalWpts < 2}
            className="flex items-center justify-center gap-2 rounded-full border border-white/15 py-2.5 text-sm text-white/70 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition">
            <Download size={14} />
            Descargar GPX ({totalRoutePts > 0 ? totalRoutePts : totalWpts} pts)
          </button>

          {/* Upload */}
          <button onClick={handleUpload} disabled={totalWpts < 2 || uploading}
            className="flex items-center justify-center gap-2 rounded-full bg-[#f97316] py-2.5 text-sm font-semibold text-white hover:bg-[#f97316]/90 disabled:opacity-40 disabled:cursor-not-allowed transition">
            {uploading
              ? <Loader2 size={14} className="animate-spin" />
              : <Upload size={14} />}
            {uploading ? "Subiendo…" : "Lanzar a NavRide App"}
          </button>

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

        </div>
      </aside>
    </div>
  );
}
