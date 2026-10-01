"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Map as MapLibreMap, MapLayerMouseEvent, MapMouseEvent, MapTouchEvent } from "maplibre-gl";
import { useGpxEditorStore } from "@/lib/gpx-editor/editor-store";
import type { LngLat, Segment, StyleId, WaypointKind } from "@/lib/gpx-editor/editor-types";
import {
  GpxMapAdapter,
  LYR_POINTS,
  LYR_ROUTE_NOTES,
} from "@/lib/gpx-editor/map-adapter";
import { useGpxMap } from "@/lib/gpx-editor/useGpxMap";
import {
  routeForMode,
  rerouteAllSegments,
  rerouteActiveSegment,
} from "@/lib/gpx-editor/routing-controller";
import { EditorHistory } from "@/lib/gpx-editor/editor-history";
import {
  appendSegment,
  clearActiveSegment,
  closeLoopWaypoints,
  deleteSegment,
  joinWithNextSegment,
  recolorSegment,
  removeWaypoint,
  renameSegment,
  reorderWaypoint,
  reverseRoute,
  splitSegmentAt,
} from "@/lib/gpx-editor/editor-commands";
import {
  applyAppCurrentLocation as applyAppCurrentLocationCommand,
  applyAppLocationError as applyAppLocationErrorCommand,
  fitRouteViewport,
  requestCurrentLocation,
} from "@/lib/gpx-editor/location-controller";
import { downloadOrSendGpx } from "@/lib/gpx-editor/export-gpx";
import {
  parseGpxUpload,
  rebuildImportedGeometry,
  type ImportedGeometry,
} from "@/lib/gpx-editor/import-gpx";
import {
  cuePlacementMessage,
  deleteCue,
  toggleWaypointViaShaping,
  updateCueSeverity,
} from "@/lib/gpx-editor/route-notes-controller";
import { GpxFloatingToolbar } from "@/components/gpx/GpxFloatingToolbar";
import { GpxNavTools } from "@/components/gpx/GpxNavTools";
import { GpxToolPalette } from "@/components/gpx/GpxToolPalette";
import { GpxImportDialog, type ImportChoice } from "@/components/gpx/GpxImportDialog";
import { GpxPointContextMenu, type PointMenuAction } from "@/components/gpx/GpxPointContextMenu";
import { GpxWayInspector, propsToWayInspector, type WayInspectorData } from "@/components/gpx/GpxWayInspector";
import { GpxRouteAnalysisPanel } from "@/components/gpx/GpxRouteAnalysisPanel";
import { GpxAlternativesPanel } from "@/components/gpx/GpxAlternativesPanel";
import { analyzeRouteMetrics } from "@/lib/gpx-editor/route-analysis";
import { analyzeRouteHealth } from "@/lib/route-studio/route-health";
import {
  persistRouteToCloud,
  routeSignature as computeRouteSignature,
} from "@/lib/gpx-editor/persistence";
import {
  persistRouteToApp,
  useNavRideAppBridge,
} from "@/lib/gpx-editor/app-bridge-controller";
import {
  useEditorDraftAutosave,
} from "@/lib/gpx-editor/use-editor-draft";
import { Loader2 } from "lucide-react";
import {
  tryOpenNavRideApp,
  buildRouteDeepLinks,
  copyRouteLink,
} from "@/lib/gpx/saveRouteToCloud";
import {
  snapClickToRoute,
  type TransportMode,
} from "@/lib/route-studio/routing";
import {
  DEFAULT_ROUTE_SEGMENT_MODE,
  parseRouteSegmentMode,
  pathKindForSegmentMode,
  isRoutedSegmentMode,
  type RouteSegmentMode,
} from "@/lib/route-studio/segment-routing-mode";
import { clearDraft } from "@/lib/route-studio/autosave";
import { type EditorMode } from "@/lib/route-studio/mode-capabilities";
import {
  DEFAULT_TRACK_WIDTH,
  DEFAULT_TRACK_OPACITY,
  ensureMinBrightness,
} from "@/lib/route-studio/track-style";
import {
  buildSatelliteStyleSync,
} from "@/lib/route-studio/satellite-style";
import {
  EDITOR_BASE_STYLE_URLS,
} from "@/lib/route-studio/editor-map-style";
import {
  type RouteCapsule,
} from "@/lib/route-studio/navride-route/gpx-codec";
import {
  type NavRideCue,
  type NavRideCueSeverity,
  type NavRideRoute,
} from "@/lib/route-studio/navride-route/types";
import {
  createCue,
} from "@/lib/route-studio/cues";
import { reprojectCuesOnTrack } from "@/lib/route-studio/route-notes-geojson";
import {
  EDITOR_MAX_SNAP_METERS,
  NOTE_OFF_TRACK_METERS,
  flattenRouteLngLats,
  progressMNearestOnPolyline,
} from "@/lib/route-studio/geo";

// ─── Map styles ───────────────────────────────────────────────────────────────
const MAP_STYLES: { id: StyleId; label: string; url: string | object }[] = [
  { id: "liberty",   label: "Carretera",      url: EDITOR_BASE_STYLE_URLS.liberty  },
  { id: "bright",    label: "Adventure",      url: EDITOR_BASE_STYLE_URLS.bright   },
  { id: "positron",  label: "Topo / Offroad", url: EDITOR_BASE_STYLE_URLS.positron },
  { id: "satellite", label: "Satélite",       url: buildSatelliteStyleSync()       },
];

// ─── Constants ────────────────────────────────────────────────────────────────
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



function ensureWaypointKinds(seg: Segment): WaypointKind[] {
  const kinds = seg.waypointKinds ? [...seg.waypointKinds] : [];
  while (kinds.length < seg.waypoints.length) kinds.push("via");
  return kinds.slice(0, seg.waypoints.length);
}

function mkSeg(color = COLORS[0].value): Segment {
  return {
    id: uid(),
    name: "Segmento",
    color: ensureMinBrightness(color),
    waypoints: [],
    waypointKinds: [],
    routePoints: [],
    routeSegmentMode: DEFAULT_ROUTE_SEGMENT_MODE,
    pathKind: "routed",
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
const INIT_SEG = mkSeg();

export default function GpxEditor({
  embedNavRideApp = false,
}: {
  embedNavRideApp?: boolean;
}) {
  const router = useRouter();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const mapReadyRef = useRef(false);
  const mapAdapterRef = useRef<GpxMapAdapter | null>(null);
  const originalImportRef = useRef<Segment[] | null>(null);
  const lastMapClickTsRef = useRef(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pointMenu, setPointMenu] = useState<{
    x: number;
    y: number;
    segId: string;
    idx: number;
  } | null>(null);
  const [wayInspector, setWayInspector] = useState<WayInspectorData | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);

  const [editorState, editorActions] = useGpxEditorStore(INIT_SEG);
  const {
    segments,
    activeId,
    mapStyleId,
    routeTitle,
    routing,
    histIdx,
    histLen,
    uploading,
    saving,
    savedRouteId,
    savedSignature,
    transportMode,
    editorMode,
    routeError,
    locating,

    activeWpt,
    trackWidth,
    trackOpacity,
    userLngLat,
    insertMode,
    cues,
    selectedCueId,
    cueDraftSeverity,
    cueDraftMessage,
    placeNotePending,
    drawMode,
    importDialog,

    styleMenuOpen,
  } = editorState;
  const {
    setSegments,
    setActiveId,
    setMapStyleId,
    setRouteTitle,
    setRouting,
    setHistIdx,
    setHistLen,
    setUploading,
    setSaving,
    setUploadMsg,
    setSavedRouteId,
    setSavedSignature,
    setTransportMode,
    setEditorMode,
    setRouteError,
    setLocating,
    setDraftBanner,

    setActiveWpt,
    setUserLngLat,
    setInsertMode,
    setCues,
    setSelectedCueId,
    setCueDraftSeverity,
    setCueDraftMessage,
    setPlaceNotePending,
    setDrawMode,
    setImportDialog,

    setStyleMenuOpen,
  } = editorActions;
  const gpxFileInputRef = useRef<HTMLInputElement>(null);
  const cuesRef = useRef<NavRideCue[]>([]);
  /** Preserved NavRide Route Capsule across open→edit→save (never silently drop). */
  const capsuleRef = useRef<RouteCapsule | null>(null);
  const pendingLocateReqRef = useRef<string | null>(null);
  const drawModeRef = useRef<RouteSegmentMode>(DEFAULT_ROUTE_SEGMENT_MODE);
  const placeNotePendingRef = useRef(false);
  const routeGenerationRef = useRef(0);
  const cueDraftMessageRef = useRef("");
  const cueDraftSeverityRef = useRef<NavRideCueSeverity>("attention");

  const transportModeRef = useRef<TransportMode>("moto");
  const editorModeRef = useRef<EditorMode>("simple");
  const trackWidthRef = useRef(DEFAULT_TRACK_WIDTH);
  const trackOpacityRef = useRef(DEFAULT_TRACK_OPACITY);
  const mapStyleIdRef = useRef<StyleId>("liberty");
  const activeWptRef = useRef<{ segId: string; idx: number } | null>(null);
  const insertModeRef = useRef(false);

  // Refs to avoid stale closures inside map handlers
  const segsRef      = useRef<Segment[]>([INIT_SEG]);
  const activeIdRef  = useRef<string>(INIT_SEG.id);
  const historyRef = useRef(new EditorHistory([INIT_SEG]));
  const styleChangingRef = useRef(false);

  useEffect(() => { segsRef.current = segments; },   [segments]);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);
  useEffect(() => { cuesRef.current = cues; }, [cues]);
  useEffect(() => { transportModeRef.current = transportMode; }, [transportMode]);
  useEffect(() => { editorModeRef.current = editorMode; }, [editorMode]);
  useEffect(() => { trackWidthRef.current = trackWidth; }, [trackWidth]);
  useEffect(() => { trackOpacityRef.current = trackOpacity; }, [trackOpacity]);
  useEffect(() => { mapStyleIdRef.current = mapStyleId; }, [mapStyleId]);
  useEffect(() => { activeWptRef.current = activeWpt; }, [activeWpt]);
  useEffect(() => { insertModeRef.current = insertMode; }, [insertMode]);
  useEffect(() => { drawModeRef.current = drawMode; }, [drawMode]);
  useEffect(() => { placeNotePendingRef.current = placeNotePending; }, [placeNotePending]);
  useEffect(() => { cueDraftMessageRef.current = cueDraftMessage; }, [cueDraftMessage]);
  useEffect(() => { cueDraftSeverityRef.current = cueDraftSeverity; }, [cueDraftSeverity]);

  useEditorDraftAutosave({
    segments,
    routeTitle,
    transportMode,
    editorMode,
  });

  // ── Map sync ──
  const syncMap = useCallback(
    (
      nextSegments: Segment[],
      selection?: { segId: string; idx: number } | null,
    ) => {
      mapAdapterRef.current?.setGeometry(
        nextSegments,
        selection === undefined ? activeWptRef.current : selection,
      );
    },
    [],
  );

  const applyTrackPaint = useCallback(() => {
    mapAdapterRef.current?.applyTrackPaint(
      mapStyleIdRef.current,
      trackWidthRef.current,
      trackOpacityRef.current,
    );
  }, []);

  const syncUserMarker = useCallback((point: LngLat | null) => {
    mapAdapterRef.current?.setUserMarker(point);
  }, []);

  const syncRouteNotes = useCallback((
    nextCues: NavRideCue[] = cuesRef.current,
    nextSegments: Segment[] = segsRef.current,
  ) => {
    mapAdapterRef.current?.setNotes(nextCues, nextSegments);
  }, []);

  useEffect(() => { syncMap(segments); }, [segments, syncMap, activeWpt]);
  useEffect(() => { applyTrackPaint(); }, [trackWidth, trackOpacity, mapStyleId, applyTrackPaint]);
  useEffect(() => { syncUserMarker(userLngLat); }, [userLngLat, syncUserMarker]);
  useEffect(() => { syncRouteNotes(cues, segments); }, [cues, segments, syncRouteNotes]);

  // ── History ──
  const syncHistoryMeta = useCallback(() => {
    setHistIdx(historyRef.current.currentIndex);
    setHistLen(historyRef.current.length);
  }, [setHistIdx, setHistLen]);

  const pushHist = useCallback((nextSegments: Segment[]) => {
    historyRef.current.push(nextSegments);
    syncHistoryMeta();
  }, [syncHistoryMeta]);

  const bindMapEvents = useCallback((m: MapLibreMap) => {
      let dragInfo: { segId: string; ptIdx: number } | null = null;

      m.on("click", LYR_ROUTE_NOTES, (e: MapLayerMouseEvent) => {
        if (!e.features?.[0]) return;
        e.originalEvent?.stopPropagation?.();
        const id = String(e.features[0].properties?.id ?? "");
        if (id) setSelectedCueId(id);
      });

      m.on("click", LYR_POINTS, (e: MapLayerMouseEvent) => {
        if (!e.features?.[0]) return;
        e.originalEvent?.stopPropagation?.();
        const props = e.features[0].properties;
        const sel = { segId: String(props?.segId), idx: Number(props?.ptIdx) };
        setActiveWpt(sel);
        activeWptRef.current = sel;
        setActiveId(sel.segId);
        activeIdRef.current = sel.segId;
        syncMap(segsRef.current, sel);
      });

      m.on("click", async (e: MapMouseEvent) => {
        const native = e.originalEvent as MouseEvent | undefined;
        if (native && typeof native.detail === "number" && native.detail > 1) return;
        const now = Date.now();
        if (now - lastMapClickTsRef.current < 280) return;
        lastMapClickTsRef.current = now;

        const noteHit = m.queryRenderedFeatures(e.point, { layers: [LYR_ROUTE_NOTES] });
        if (noteHit.length > 0) return;
        const hit = m.queryRenderedFeatures(e.point, { layers: [LYR_POINTS] });
        if (hit.length > 0) return;
        if (styleChangingRef.current) return;

        const inspectLayers = [
          "nr-road",
          "nr-road-casing",
          "nr-track",
          "nr-path",
          "nr-road-name",
        ].filter((id) => !!m.getLayer(id));
        if (inspectLayers.length > 0) {
          const wayHits = m.queryRenderedFeatures(e.point, { layers: inspectLayers });
          if (wayHits[0]) {
            setWayInspector(
              propsToWayInspector(
                wayHits[0].properties as Record<string, unknown>,
                wayHits[0].layer?.id,
              ),
            );
          }
        }

        const { lng, lat } = e.lngLat;
        const clickPt: LngLat = [lng, lat];

        // Place map note at exact click (not mid-route default).
        if (placeNotePendingRef.current) {
          const msg = cueDraftMessageRef.current.trim();
          if (!msg) {
            setRouteError("Escribe el mensaje de la nota antes de pulsar el mapa.");
            return;
          }
          const line = flattenRouteLngLats(segsRef.current);
          const hitProj = progressMNearestOnPolyline(line, clickPt);
          const off =
            !hitProj || hitProj.distanceToTrackM > NOTE_OFF_TRACK_METERS;
          const cue = createCue({
            message: msg,
            severity: cueDraftSeverityRef.current,
            lat,
            lon: lng,
            progressM: off ? null : hitProj!.progressM,
            noteStatus: off ? "off_track" : "on_track",
            nearestSegmentIndex: hitProj?.segmentIndex ?? null,
            projectionFraction: hitProj?.fraction ?? null,
            segmentId: activeIdRef.current,
          });
          setCues((prev) => [...prev, cue]);
          setCueDraftMessage("");
          setPlaceNotePending(false);
          placeNotePendingRef.current = false;
          if (off) {
            setRouteError("Nota fuera del track — se conserva lat/lon sin km de ruta.");
          } else {
            setRouteError(null);
          }
          return;
        }

        const aId  = activeIdRef.current;
        const curr = segsRef.current;
        const activeSeg0 = curr.find(s => s.id === aId);
        // Imported track is geometric authority — do not append routed waypoints silently.
        if (activeSeg0?.pathKind === "track") {
          setRouteError(
            "GPX importado: geometría fija. Usa LÍNEA DIRECTA para editar a mano, o crea un segmento nuevo.",
          );
          return;
        }

        const mode = transportModeRef.current;
        const segMode =
          activeSeg0?.routeSegmentMode ??
          drawModeRef.current ??
          DEFAULT_ROUTE_SEGMENT_MODE;
        const follow = isRoutedSegmentMode(segMode);
        let newPt: LngLat = clickPt;

        const prev =
          activeSeg0 && activeSeg0.waypoints.length > 0
            ? activeSeg0.waypoints[activeSeg0.waypoints.length - 1]
            : null;

        if (follow && prev) {
          const snapped = await snapClickToRoute(
            clickPt,
            prev,
            mode,
            EDITOR_MAX_SNAP_METERS,
            segMode,
          );
          if (snapped.rejectedFar) {
            setRouteError(
              "Este camino no está disponible en los datos de routing actuales (snap > " +
                EDITOR_MAX_SNAP_METERS +
                " m). Usa LÍNEA DIRECTA o elige un punto más cercano al graph.",
            );
            return;
          }
          newPt = snapped.snapped;
        }

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
                  pathKind: pathKindForSegmentMode(segMode),
                  routeSegmentMode: segMode,
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

        // MANUAL_STRAIGHT: waypoints ARE the geometry — no router.
        if (!follow || activeSeg.pathKind === "freehand" || segMode === "MANUAL_STRAIGHT") {
          const freePts = [...activeSeg.waypoints];
          const gen = ++routeGenerationRef.current;
          setSegments(prev => {
            if (gen !== routeGenerationRef.current) return prev;
            const r = prev.map(s =>
              s.id === aId
                ? {
                    ...s,
                    routePoints: freePts,
                    routingFailed: false,
                    absurdDetour: false,
                    pathKind: "freehand" as const,
                    routeSegmentMode: "MANUAL_STRAIGHT" as const,
                  }
                : s,
            );
            segsRef.current = r;
            syncMap(r);
            return r;
          });
          pushHist(segsRef.current);
          setRouteError(null);
          return;
        }

        const gen = ++routeGenerationRef.current;
        setRouting(true);
        setRouteError(null);
        const routed = await routeForMode(activeSeg.waypoints, mode, segMode);
        if (gen !== routeGenerationRef.current) return; // latest-wins
        if (!routed.ok) {
          setRouteError(
            (routed.message ?? "Sin ruta en este control point.") +
              " No se inventa geometría. Prueba LÍNEA DIRECTA.",
          );
        } else if (routed.absurd && editorModeRef.current === "advanced") {
          setRouteError(routed.message ?? "Desvío absurdo detectado.");
        }
        setSegments(prev => {
          if (gen !== routeGenerationRef.current) return prev;
          const r = prev.map(s => s.id === aId ? {
            ...s,
            routePoints: routed.ok ? routed.points : (s.routePoints.length >= 2 ? s.routePoints : []),
            routingFailed: !routed.ok,
            absurdDetour: !!routed.absurd,
            pathKind: "routed" as const,
            routeSegmentMode: segMode,
          } : s);
          segsRef.current = r;
          const reproj = reprojectCuesOnTrack(cuesRef.current, r);
          cuesRef.current = reproj;
          setCues(reproj);
          syncMap(r);
          return r;
        });
        pushHist(segsRef.current);
        setRouting(false);
      });

      m.on("mousedown", LYR_POINTS, (e: MapLayerMouseEvent) => {
        e.preventDefault();
        const props = e.features?.[0]?.properties;
        if (!props) return;
        dragInfo = { segId: String(props.segId), ptIdx: Number(props.ptIdx) };
        const sel = { segId: dragInfo.segId, idx: dragInfo.ptIdx };
        setActiveWpt(sel);
        activeWptRef.current = sel;
        m.getCanvas().style.cursor = "grabbing";
        m.dragPan.disable();
      });

      m.on("mousemove", (e: MapMouseEvent) => {
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
        const pathKind = seg.pathKind ?? "routed";
        if (pathKind === "track") {
          setRouteError("GPX importado: geometría de track fija — no se re-enruta al mover waypoints.");
          pushHist(segsRef.current);
          setRouting(false);
          return;
        }
        if (pathKind === "freehand") {
          const freePts = [...seg.waypoints];
          setSegments(prev => {
            const r = prev.map(s =>
              s.id === di.segId
                ? { ...s, routePoints: freePts, routingFailed: false, absurdDetour: false }
                : s,
            );
            segsRef.current = r;
            const reproj = reprojectCuesOnTrack(cuesRef.current, r);
            cuesRef.current = reproj;
            setCues(reproj);
            syncMap(r);
            pushHist(r);
            return r;
          });
          setRouting(false);
          return;
        }
        const gen = ++routeGenerationRef.current;
        const sm = parseRouteSegmentMode(
          seg.routeSegmentMode ?? (seg.pathKind === "freehand" ? "MANUAL_STRAIGHT" : "FOLLOW_ROAD"),
        );
        const routed = await routeForMode(seg.waypoints, transportModeRef.current, sm);
        if (gen !== routeGenerationRef.current) return;
        if (!routed.ok) {
          setRouteError(
            (routed.message ?? "Punto inalcanzable — no se dibuja línea recta."),
          );
        } else if (routed.absurd && editorModeRef.current === "advanced") {
          setRouteError(routed.message ?? "Desvío absurdo detectado.");
        }
        setSegments(prev => {
          if (gen !== routeGenerationRef.current) return prev;
          const r = prev.map(s => s.id === di.segId ? {
            ...s,
            routePoints: routed.ok ? routed.points : (s.routePoints.length >= 2 ? s.routePoints : []),
            routingFailed: !routed.ok,
            absurdDetour: !!routed.absurd,
          } : s);
          segsRef.current = r;
          const reproj = reprojectCuesOnTrack(cuesRef.current, r);
          cuesRef.current = reproj;
          setCues(reproj);
          syncMap(r);
          pushHist(r);
          return r;
        });
        setRouting(false);
      });

      const openPointMenu = (segId: string, idx: number, clientX: number, clientY: number) => {
        setPointMenu({ x: clientX, y: clientY, segId, idx });
        const sel = { segId, idx };
        setActiveWpt(sel);
        activeWptRef.current = sel;
        setActiveId(segId);
        activeIdRef.current = segId;
      };

      m.on("contextmenu", (e: MapMouseEvent) => {
        e.preventDefault();
        const hits = m.queryRenderedFeatures(e.point, { layers: [LYR_POINTS] });
        if (!hits[0]) return;
        const props = hits[0].properties;
        if (!props) return;
        const oe = e.originalEvent as MouseEvent;
        openPointMenu(String(props.segId), Number(props.ptIdx), oe.clientX, oe.clientY);
      });

      m.on("touchstart", LYR_POINTS, (e: MapTouchEvent & { features?: GeoJSON.Feature[] }) => {
        const props = e.features?.[0]?.properties;
        if (!props) return;
        const oe = e.originalEvent as unknown as TouchEvent;
        const touch = oe.touches?.[0];
        if (!touch) return;
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        const segId = String(props.segId);
        const idx = Number(props.ptIdx);
        const x = touch.clientX;
        const y = touch.clientY;
        longPressTimerRef.current = setTimeout(() => {
          openPointMenu(segId, idx, x, y);
        }, 520);
      });
      m.on("touchend", LYR_POINTS, () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      });
      m.on("touchcancel", LYR_POINTS, () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      });
      // Cancel long-press if the finger moves the map/point.
      m.on("touchmove", () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      });

      m.on("mouseenter", LYR_POINTS, () => {
        if (!dragInfo) m.getCanvas().style.cursor = "grab";
      });
      m.on("mouseleave", LYR_POINTS, () => {
        if (!dragInfo) m.getCanvas().style.cursor = "";
      });
  }, [
    pushHist,
    syncMap,
    setActiveId,
    setActiveWpt,
    setCueDraftMessage,
    setCues,
    setInsertMode,
    setPlaceNotePending,
    setRouteError,
    setRouting,
    setSegments,
    setSelectedCueId,
    setPointMenu,
    setWayInspector,
  ]);

  useGpxMap({
    containerRef: mapContainer,
    mapRef,
    mapReadyRef,
    adapterRef: mapAdapterRef,
    styleChangingRef,
    getSnapshot: () => ({
      segments: segsRef.current,
      activeWpt: activeWptRef.current,
      cues: cuesRef.current,
      styleId: mapStyleIdRef.current,
      trackWidth: trackWidthRef.current,
      trackOpacity: trackOpacityRef.current,
      transportMode: transportModeRef.current,
    }),
    styleId: mapStyleId,
    bindEvents: bindMapEvents,
  });

  // Re-route only routed segments (FOLLOW_ROAD / FOLLOW_TRAIL).
  const rerouteAll = useCallback(async (mode: TransportMode) => {
    const generation = ++routeGenerationRef.current;
    setRouting(true);
    setRouteError(null);
    const result = await rerouteAllSegments({
      segments: segsRef.current,
      mode,
      editorMode: editorModeRef.current,
      generation,
      isCurrent: (value) => value === routeGenerationRef.current,
    });
    if (result.stale) return;
    if (result.segments !== segsRef.current) {
      segsRef.current = result.segments;
      setSegments(result.segments);
      const reproj = reprojectCuesOnTrack(
        cuesRef.current,
        result.segments,
      );
      cuesRef.current = reproj;
      setCues(reproj);
      syncMap(result.segments);
      pushHist(result.segments);
    }
    setRouteError(result.error);
    setRouting(false);
  }, [pushHist, setCues, setRouteError, setRouting, setSegments, syncMap]);

  const handleTransportChange = useCallback((mode: TransportMode) => {
    setTransportMode(mode);
    transportModeRef.current = mode;
    void rerouteAll(mode);
  }, [rerouteAll, setTransportMode]);

  const handleSegmentModeChange = useCallback(
    async (mode: RouteSegmentMode) => {
      setDrawMode(mode);
      drawModeRef.current = mode;
      const generation = ++routeGenerationRef.current;
      setRouting(true);
      setRouteError(null);
      const result = await rerouteActiveSegment({
        segments: segsRef.current,
        activeId: activeIdRef.current,
        mode,
        transportMode: transportModeRef.current,
        editorMode: editorModeRef.current,
        generation,
        isCurrent: (value) => value === routeGenerationRef.current,
      });
      if (result.stale) return;
      if (result.segments !== segsRef.current) {
        segsRef.current = result.segments;
        setSegments(result.segments);
        const reproj = reprojectCuesOnTrack(
          cuesRef.current,
          result.segments,
        );
        cuesRef.current = reproj;
        setCues(reproj);
        syncMap(result.segments);
        pushHist(result.segments);
      }
      setRouteError(result.error);
      setRouting(false);
    },
    [
      pushHist,
      setCues,
      setDrawMode,
      setRouteError,
      setRouting,
      setSegments,
      syncMap,
    ],
  );

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleUndo = useCallback(() => {
    const restored = historyRef.current.undo();
    segsRef.current = restored;
    setSegments(restored);
    syncMap(restored);
    syncHistoryMeta();
  }, [setSegments, syncHistoryMeta, syncMap]);

  const handleRedo = useCallback(() => {
    const restored = historyRef.current.redo();
    segsRef.current = restored;
    setSegments(restored);
    syncMap(restored);
    syncHistoryMeta();
  }, [setSegments, syncHistoryMeta, syncMap]);

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
    const upd = clearActiveSegment(segsRef.current, activeIdRef.current);
    segsRef.current = upd;
    setSegments(upd);
    setActiveWpt(null);
    syncMap(upd, null);
    pushHist(upd);
  }, [syncMap, pushHist, setSegments, setActiveWpt]);

  const handleCloseLoop = useCallback(async () => {
    const seg = segsRef.current.find(s => s.id === activeIdRef.current);
    if (!seg || seg.waypoints.length < 3) return;
    const closedCommand = closeLoopWaypoints(seg);
    if (!closedCommand) return;
    const closed = closedCommand.waypoints;
    const closedKinds = closedCommand.kinds;
    setRouting(true);
    setRouteError(null);
    const sm = parseRouteSegmentMode(
      seg.routeSegmentMode ?? (seg.pathKind === "freehand" ? "MANUAL_STRAIGHT" : "FOLLOW_ROAD"),
    );
    const routed = await routeForMode(closed, transportModeRef.current, sm);
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
  }, [syncMap, pushHist, setSegments, setRouting, setRouteError]);

  const handleAddSeg = useCallback(() => {
    const idx = segsRef.current.length % COLORS.length;
    const seg = mkSeg(COLORS[idx].value);
    const upd = appendSegment(segsRef.current, seg);
    segsRef.current = upd;
    setSegments(upd);
    setActiveId(seg.id);
    activeIdRef.current = seg.id;
    pushHist(upd);
  }, [pushHist, setSegments, setActiveId]);

  const handleDeleteSeg = useCallback((segId: string) => {
    const upd = deleteSegment(segsRef.current, segId, () => mkSeg());
    if (activeIdRef.current === segId) {
      setActiveId(upd[0].id);
      activeIdRef.current = upd[0].id;
    }
    segsRef.current = upd;
    setSegments(upd);
    setActiveWpt(null);
    syncMap(upd, null);
    pushHist(upd);
  }, [syncMap, pushHist, setSegments, setActiveId, setActiveWpt]);

  const handleColor = useCallback((segId: string, color: string) => {
    const upd = recolorSegment(segsRef.current, segId, color);
    segsRef.current = upd;
    setSegments(upd);
    syncMap(upd);
    pushHist(upd); // color changes enter undo stack
  }, [syncMap, pushHist, setSegments]);

  const handleRenameSeg = useCallback((segId: string, name: string) => {
    const upd = renameSegment(segsRef.current, segId, name);
    segsRef.current = upd;
    setSegments(upd);
    pushHist(upd);
  }, [pushHist, setSegments]);

  const handleDeleteWaypoint = useCallback(async (segId: string, idx: number) => {
    const upd = removeWaypoint(segsRef.current, segId, idx);
    segsRef.current = upd;
    setSegments(upd);
    setActiveWpt(null);
    activeWptRef.current = null;

    const seg = upd.find(s => s.id === segId);
    if (seg && seg.waypoints.length >= 2) {
      const pk = seg.pathKind ?? "routed";
      if (pk === "track") {
        syncMap(upd, null);
        pushHist(upd);
        return;
      }
      if (pk === "freehand") {
        const r = upd.map(s =>
          s.id === segId
            ? { ...s, routePoints: [...s.waypoints], routingFailed: false }
            : s,
        );
        segsRef.current = r;
        setSegments(r);
        syncMap(r, null);
        pushHist(r);
        return;
      }
      setRouting(true);
      const gen = ++routeGenerationRef.current;
      const smDel = parseRouteSegmentMode(
        seg.routeSegmentMode ?? (seg.pathKind === "freehand" ? "MANUAL_STRAIGHT" : "FOLLOW_ROAD"),
      );
      const routed = await routeForMode(seg.waypoints, transportModeRef.current, smDel);
      if (gen !== routeGenerationRef.current) return;
      if (!routed.ok) setRouteError(routed.message ?? "Punto inalcanzable.");
      const r = upd.map(s => s.id === segId ? {
        ...s,
        routePoints: routed.ok ? routed.points : (s.routePoints.length >= 2 ? s.routePoints : []),
        routingFailed: !routed.ok,
        absurdDetour: !!routed.absurd,
      } : s);
      segsRef.current = r;
      setSegments(r);
      const reproj = reprojectCuesOnTrack(cuesRef.current, r);
      cuesRef.current = reproj;
      setCues(reproj);
      syncMap(r, null);
      pushHist(r);
      setRouting(false);
    } else {
      syncMap(upd, null);
      pushHist(upd);
    }
  }, [syncMap, pushHist, setSegments, setActiveWpt, setCues, setRouteError, setRouting]);

  const handleReorderWaypoint = useCallback(async (segId: string, idx: number, dir: -1 | 1) => {
    const command = reorderWaypoint(segsRef.current, segId, idx, dir);
    if (!command) return;
    const { segments: upd, nextIndex: target } = command;
    segsRef.current = upd;
    setActiveWpt({ segId, idx: target });
    activeWptRef.current = { segId, idx: target };

    const seg = upd.find(s => s.id === segId)!;
    if (seg.waypoints.length >= 2) {
      const pk = seg.pathKind ?? "routed";
      if (pk === "freehand") {
        const r = upd.map(s =>
          s.id === segId
            ? { ...s, routePoints: [...s.waypoints], routingFailed: false }
            : s,
        );
        segsRef.current = r;
        setSegments(r);
        syncMap(r);
        pushHist(r);
        return;
      }
      if (pk === "track") {
        setSegments(upd);
        syncMap(upd);
        pushHist(upd);
        return;
      }
      setRouting(true);
      const gen = ++routeGenerationRef.current;
      const smOrd = parseRouteSegmentMode(
        seg.routeSegmentMode ?? (seg.pathKind === "freehand" ? "MANUAL_STRAIGHT" : "FOLLOW_ROAD"),
      );
      const routed = await routeForMode(seg.waypoints, transportModeRef.current, smOrd);
      if (gen !== routeGenerationRef.current) return;
      const r = upd.map(s => s.id === segId ? {
        ...s,
        routePoints: routed.ok ? routed.points : (s.routePoints.length >= 2 ? s.routePoints : []),
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
  }, [syncMap, pushHist, setSegments, setActiveWpt, setRouting]);

  const locationDeps = useCallback(() => ({
    embedNavRideApp,
    map: () => mapRef.current,
    adapter: () => mapAdapterRef.current,
    pendingRequest: pendingLocateReqRef,
    setLocating,
    setError: setRouteError,
    setLocation: setUserLngLat,
    syncUserMarker,
  }), [
    embedNavRideApp,
    setLocating,
    setRouteError,
    setUserLngLat,
    syncUserMarker,
  ]);

  const handleLocate = useCallback(() => {
    requestCurrentLocation(locationDeps());
  }, [locationDeps]);

  const applyAppCurrentLocation = useCallback(
    (payload: Record<string, unknown> | undefined) => {
      applyAppCurrentLocationCommand(payload, locationDeps());
    },
    [locationDeps],
  );

  const applyAppLocationError = useCallback(
    (payload: Record<string, unknown> | undefined) => {
      applyAppLocationErrorCommand(payload, locationDeps());
    },
    [locationDeps],
  );

  const handleFitRoute = useCallback(() => {
    fitRouteViewport(mapAdapterRef.current, segsRef.current);
  }, []);

  const handleDownload = useCallback(() => {
    downloadOrSendGpx({
      segments,
      title: routeTitle,
      cues,
      capsule: capsuleRef.current,
      embedNavRideApp,
    });
  }, [segments, routeTitle, cues, embedNavRideApp]);

  const applyImportedResult = useCallback(
    (imported: ImportedGeometry) => {
      if (imported.capsule !== undefined) {
        capsuleRef.current = imported.capsule;
      }
      segsRef.current = imported.segments;
      setSegments(imported.segments);
      setActiveId(imported.activeId);
      activeIdRef.current = imported.activeId;
      setDrawMode(imported.drawMode);
      drawModeRef.current = imported.drawMode;
      if (imported.title) setRouteTitle(imported.title);
      setCues(imported.cues);
      cuesRef.current = imported.cues;
      syncMap(imported.segments);
      pushHist(imported.segments);
      setImportDialog(null);
      setRouteError(null);
    },
    [
      pushHist,
      setActiveId,
      setCues,
      setDrawMode,
      setImportDialog,
      setRouteError,
      setRouteTitle,
      setSegments,
      syncMap,
    ],
  );

  const applyImportedGeometry = useCallback(
    (
      geometry: { lat: number; lon: number }[],
      extensions: NavRideRoute | null,
      asTrackOnly: boolean,
      capsule?: RouteCapsule | null,
    ) => {
      const imported = rebuildImportedGeometry({
        geometry,
        extensions,
        asTrackOnly,
        capsule,
      });
      if (imported) applyImportedResult(imported);
    },
    [applyImportedResult],
  );

  const handleGpxFile = useCallback(
    async (file: File) => {
      try {
        const result = await parseGpxUpload(file);
        if (result.kind === "invalid") {
          setRouteError(result.message);
          setImportDialog(null);
          return;
        }
        if (result.kind === "ready") {
          applyImportedResult(result.imported);
          return;
        }
        setImportDialog(result.dialog);
      } catch {
        setRouteError("No se pudo leer el archivo GPX.");
      }
    },
    [applyImportedResult, setImportDialog, setRouteError],
  );

  // Open from Mis rutas / perfil: ?importSession=1 or ?routeId=
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const importSession = params.get("importSession");
      const routeId = params.get("routeId");

      if (importSession === "1") {
        try {
          const raw = sessionStorage.getItem("navride:pending-gpx-import");
          sessionStorage.removeItem("navride:pending-gpx-import");
          if (!raw) return;
          const parsed = JSON.parse(raw) as { fileName?: string; xml?: string };
          if (!parsed.xml) return;
          const file = new File(
            [parsed.xml],
            parsed.fileName || "ruta.gpx",
            { type: "application/gpx+xml" },
          );
          if (!cancelled) await handleGpxFile(file);
        } catch {
          if (!cancelled) setRouteError("No se pudo abrir la ruta desde Mis rutas.");
        }
        return;
      }

      if (routeId) {
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const { fetchGpxViaEdge } = await import("@/lib/gpx/saveRouteToCloud");
          const supabase = createClient();
          const result = await fetchGpxViaEdge(supabase, routeId);
          if (!result.ok) {
            if (!cancelled) setRouteError(result.error);
            return;
          }
          const file = new File(
            [result.gpxXml],
            `${result.title || "ruta"}.gpx`,
            { type: "application/gpx+xml" },
          );
          if (!cancelled) {
            setSavedRouteId(routeId);
            await handleGpxFile(file);
          }
        } catch {
          if (!cancelled) setRouteError("No se pudo cargar la ruta guardada.");
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
    // Intentionally once on mount for deep-link open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleViaShaping = useCallback(
    (segId: string, idx: number) => {
      const upd = toggleWaypointViaShaping(
        segsRef.current,
        segId,
        idx,
      );
      segsRef.current = upd;
      setSegments(upd);
      pushHist(upd);
    },
    [pushHist, setSegments],
  );

  const rerouteSegmentById = useCallback(async (segId: string, base: Segment[]) => {
    const seg = base.find((s) => s.id === segId);
    if (!seg || seg.waypoints.length < 2) {
      segsRef.current = base;
      setSegments(base);
      syncMap(base);
      pushHist(base);
      return;
    }
    const pk = seg.pathKind ?? "routed";
    if (pk === "track") {
      segsRef.current = base;
      setSegments(base);
      syncMap(base);
      pushHist(base);
      return;
    }
    if (pk === "freehand" || seg.routeSegmentMode === "MANUAL_STRAIGHT") {
      const r = base.map((s) =>
        s.id === segId
          ? { ...s, routePoints: [...s.waypoints], routingFailed: false, absurdDetour: false }
          : s,
      );
      segsRef.current = r;
      setSegments(r);
      syncMap(r);
      pushHist(r);
      return;
    }
    setRouting(true);
    const gen = ++routeGenerationRef.current;
    const sm = parseRouteSegmentMode(seg.routeSegmentMode ?? "FOLLOW_ROAD");
    const routed = await routeForMode(seg.waypoints, transportModeRef.current, sm);
    if (gen !== routeGenerationRef.current) return;
    const r = base.map((s) =>
      s.id === segId
        ? {
            ...s,
            routePoints: routed.ok ? routed.points : [],
            routingFailed: !routed.ok,
            absurdDetour: !!routed.absurd,
          }
        : s,
    );
    segsRef.current = r;
    setSegments(r);
    const reproj = reprojectCuesOnTrack(cuesRef.current, r);
    cuesRef.current = reproj;
    setCues(reproj);
    syncMap(r);
    pushHist(r);
    setRouting(false);
    if (!routed.ok) setRouteError(routed.message ?? "No se pudo recalcular el tramo.");
  }, [pushHist, setCues, setRouteError, setRouting, setSegments, syncMap]);

  const handleSplitAtActive = useCallback(async () => {
    const sel = activeWptRef.current;
    if (!sel) {
      setRouteError("Selecciona un punto intermedio para dividir.");
      return;
    }
    const next = splitSegmentAt(segsRef.current, sel.segId, sel.idx);
    if (!next) {
      setRouteError("No se puede dividir en ese punto.");
      return;
    }
    segsRef.current = next;
    setSegments(next);
    setActiveId(next[0].id);
    activeIdRef.current = next[0].id;
    for (const seg of next) {
      await rerouteSegmentById(seg.id, segsRef.current);
    }
  }, [rerouteSegmentById, setActiveId, setRouteError, setSegments]);

  const handleJoinNext = useCallback(async () => {
    const next = joinWithNextSegment(segsRef.current, activeIdRef.current);
    if (!next) {
      setRouteError("No hay segmento siguiente para unir.");
      return;
    }
    const mergedId = next.find((s) => s.id === activeIdRef.current)?.id ?? next[0].id;
    segsRef.current = next;
    setSegments(next);
    await rerouteSegmentById(mergedId, next);
  }, [rerouteSegmentById, setRouteError, setSegments]);

  const handleReverse = useCallback(async () => {
    const next = reverseRoute(segsRef.current);
    segsRef.current = next;
    setSegments(next);
    setActiveId(next[0]?.id ?? activeIdRef.current);
    activeIdRef.current = next[0]?.id ?? activeIdRef.current;
    for (const seg of next) {
      await rerouteSegmentById(seg.id, segsRef.current);
    }
  }, [rerouteSegmentById, setActiveId, setSegments]);

  const handlePointMenuAction = useCallback(
    async (action: PointMenuAction) => {
      if (!pointMenu) return;
      const { segId, idx } = pointMenu;
      setPointMenu(null);
      if (action === "delete") {
        await handleDeleteWaypoint(segId, idx);
        return;
      }
      if (action === "insertAfter") {
        setInsertMode(true);
        insertModeRef.current = true;
        setActiveWpt({ segId, idx });
        activeWptRef.current = { segId, idx };
        setRouteError("Toca el mapa para insertar el punto después del seleccionado.");
        return;
      }
      if (action === "toggleShaping") {
        handleToggleViaShaping(segId, idx);
        return;
      }
      if (action === "splitHere") {
        const next = splitSegmentAt(segsRef.current, segId, idx);
        if (!next) {
          setRouteError("No se puede dividir en ese punto.");
          return;
        }
        segsRef.current = next;
        setSegments(next);
        for (const seg of next) {
          await rerouteSegmentById(seg.id, segsRef.current);
        }
      }
    },
    [
      handleDeleteWaypoint,
      handleToggleViaShaping,
      pointMenu,
      rerouteSegmentById,
      setInsertMode,
      setActiveWpt,
      setRouteError,
      setSegments,
    ],
  );

  const handleImportChoice = useCallback(
    async (choice: ImportChoice) => {
      if (!importDialog) return;
      const { geometry, extensions, capsule } = importDialog;
      setImportDialog(null);

      if (choice === "track") {
        applyImportedGeometry(geometry, extensions, true, capsule);
        originalImportRef.current = null;
        return;
      }

      if (choice === "keep-original" || choice === "edit") {
        if (choice === "keep-original") {
          const trackCopy = rebuildImportedGeometry({
            geometry,
            extensions,
            asTrackOnly: true,
            capsule,
          });
          originalImportRef.current = trackCopy?.segments
            ? JSON.parse(JSON.stringify(trackCopy.segments))
            : null;
        } else {
          originalImportRef.current = null;
        }
        applyImportedGeometry(geometry, extensions, false, capsule);
        return;
      }

      const trackCopy = rebuildImportedGeometry({
        geometry,
        extensions,
        asTrackOnly: true,
        capsule,
      });
      if (trackCopy?.segments) {
        originalImportRef.current = JSON.parse(JSON.stringify(trackCopy.segments));
      }
      applyImportedGeometry(geometry, extensions, false, capsule);
      const mode = choice === "snap-trail" ? "FOLLOW_TRAIL" : "FOLLOW_ROAD";
      setDrawMode(mode);
      drawModeRef.current = mode;
      await handleSegmentModeChange(mode);
      setRouteError(
        choice === "snap-trail"
          ? "Copia ajustada a pistas/senderos. Original conservado en memoria de sesión."
          : "Copia ajustada a carreteras. Original conservado en memoria de sesión.",
      );
    },
    [
      applyImportedGeometry,
      handleSegmentModeChange,
      importDialog,
      setDrawMode,
      setImportDialog,
      setRouteError,
    ],
  );


  const handleAddCue = useCallback(() => {
    const result = cuePlacementMessage(cueDraftMessage);
    if (!result.ok) return;
    setPlaceNotePending(true);
    placeNotePendingRef.current = true;
    setRouteError(result.error);
  }, [cueDraftMessage, setPlaceNotePending, setRouteError]);

  const handleDeleteCue = useCallback(
    (cueId: string) => {
      setCues((previous) => deleteCue(previous, cueId));
      setSelectedCueId((current) =>
        current === cueId ? null : current,
      );
    },
    [setCues, setSelectedCueId],
  );

  const handleUpdateCueSeverity = useCallback(
    (cueId: string, severity: NavRideCueSeverity) => {
      setCues((previous) =>
        updateCueSeverity(previous, cueId, severity),
      );
    },
    [setCues],
  );

  const routeSignature = useCallback(
    () => computeRouteSignature(segments, routeTitle),
    [segments, routeTitle],
  );

  const persistRoute = useCallback(async (): Promise<string | null> => {
    const result = await persistRouteToCloud({
      segments,
      title: routeTitle,
      cues,
      capsule: capsuleRef.current,
      savedRouteId,
    });
    if (!result.ok) {
      setUploadMsg({ ok: false, text: result.error });
      return null;
    }

    setSavedRouteId(result.routeId);
    setSavedSignature(result.signature);
    clearDraft();
    setDraftBanner(null);
    return result.routeId;
  }, [
    cues,
    routeTitle,
    savedRouteId,
    segments,
    setDraftBanner,
    setSavedRouteId,
    setSavedSignature,
    setUploadMsg,
  ]);

  const persistToApp = useCallback(
    (alsoOpen: boolean) => {
      const result = persistRouteToApp({
        alsoOpen,
        segments,
        title: routeTitle,
        cues,
        capsule: capsuleRef.current,
        savedRouteId,
      });
      if (!result.ok) {
        setUploadMsg({ ok: false, text: result.message });
        return;
      }
      setSavedSignature(result.signature);
      clearDraft();
      setDraftBanner(null);
      setUploadMsg({ ok: true, text: result.message });
    },
    [
      cues,
      routeTitle,
      savedRouteId,
      segments,
      setDraftBanner,
      setSavedSignature,
      setUploadMsg,
    ],
  );

  const handleSave = useCallback(async () => {
    if (saving || uploading) return;
    if (embedNavRideApp) {
      setSaving(true);
      setUploadMsg(null);
      persistToApp(false);
      setSaving(false);
      return;
    }
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
  }, [persistRoute, saving, uploading, savedRouteId, embedNavRideApp, persistToApp, setSaving, setUploadMsg]);

  const handleLaunch = useCallback(async () => {
    if (saving || uploading) return;
    setUploading(true);
    setUploadMsg(null);

    if (embedNavRideApp) {
      persistToApp(true);
      setUploading(false);
      return;
    }

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
  }, [persistRoute, routeSignature, savedRouteId, savedSignature, saving, uploading, embedNavRideApp, persistToApp, setUploading, setUploadMsg]);

  // ── App embed bridge ──────────────────────────────────────────────────────
  useNavRideAppBridge({
    enabled: embedNavRideApp,
    segments,
    routeTitle,
    cues,
    savedSignature,
    pendingLocationRequest: pendingLocateReqRef,
    applyImportedGeometry,
    applyCurrentLocation: applyAppCurrentLocation,
    applyLocationError: applyAppLocationError,
    setRouteError,
    setSavedRouteId,
    setSavedSignature,
    setUploadMsg,
  });

  // ── Derived ───────────────────────────────────────────────────────────────

  const totalWpts     = segments.reduce((a, s) => a + s.waypoints.length, 0);
  const totalRoutePts = segments.reduce(
    (a, s) => a + (s.routingFailed ? 0 : s.routePoints.length),
    0,
  );
  const activeSeg     = segments.find(s => s.id === activeId) ?? segments[0];
  const advanced = editorMode === "advanced";
  const routeAnalysis = useMemo(
    () => analyzeRouteMetrics(segments, transportMode),
    [segments, transportMode],
  );
  const routeHealth = useMemo(
    () =>
      analyzeRouteHealth(
        segments.map((s) => ({
          waypoints: s.waypoints,
          routePoints: s.routingFailed ? [] : s.routePoints,
          mode: transportMode,
          routingFailed: s.routingFailed,
        })),
      ),
    [segments, transportMode],
  );
  const modeLabel =
    transportMode === "walk"
      ? "Caminar"
      : transportMode === "bike"
        ? "Bici"
        : transportMode === "car"
          ? "Coche"
          : "Moto";
  const menuSeg = pointMenu
    ? segments.find((s) => s.id === pointMenu.segId)
    : null;
  const menuKind =
    menuSeg && pointMenu
      ? (menuSeg.waypointKinds?.[pointMenu.idx] ?? "via")
      : "via";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex-1 h-full overflow-hidden">
      <div className="absolute inset-0">
        <div ref={mapContainer} className="w-full h-full" />

        <GpxFloatingToolbar
          embedNavRideApp={embedNavRideApp}
          canClear={!!activeSeg && activeSeg.waypoints.length > 0}
          canUndo={histIdx > 0}
          canRedo={histIdx < histLen - 1}
          styleMenuOpen={styleMenuOpen}
          mapStyleId={mapStyleId}
          styles={MAP_STYLES.map(({ id, label }) => ({ id, label }))}
          onClear={handleClear}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onToggleStyleMenu={() => setStyleMenuOpen((value) => !value)}
          onChangeStyle={(style) => {
            setMapStyleId(style);
            setStyleMenuOpen(false);
          }}
        />

        <GpxNavTools
          locating={locating}
          canFit={totalWpts >= 2}
          showExit={!embedNavRideApp}
          onLocate={handleLocate}
          onFit={handleFitRoute}
          onResetNorth={() => {
            mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 400 });
          }}
          onExit={() => router.push("/")}
        />

        {routing && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#0a0a0a]/90 border border-white/15 rounded-full px-4 py-2 text-xs text-white/70 z-10 whitespace-nowrap shadow-lg">
            <Loader2 size={13} className="animate-spin text-[#f97316]" />
            Calculando snap-to-road…
          </div>
        )}

        {routeError && (
          <div className="absolute top-14 left-1/2 z-10 max-w-[min(420px,calc(100vw-24px))] -translate-x-1/2 rounded-xl border border-white/15 bg-[#0a0a0a]/92 px-3 py-2 text-[11px] text-white/75 shadow-lg">
            {routeError}
          </div>
        )}

        {wayInspector && (
          <GpxWayInspector data={wayInspector} onClose={() => setWayInspector(null)} />
        )}

        {showAnalysis && (
          <GpxRouteAnalysisPanel
            analysis={routeAnalysis}
            health={routeHealth}
            modeLabel={modeLabel}
            pointCount={totalWpts}
            onClose={() => setShowAnalysis(false)}
          />
        )}

        {showAlternatives && activeSeg && (
          <GpxAlternativesPanel
            waypoints={activeSeg.waypoints}
            transportMode={transportMode}
            onClose={() => setShowAlternatives(false)}
            onApply={(mode, points) => {
              const pathKind = (
                mode === "MANUAL_STRAIGHT" ? "freehand" : "routed"
              ) as Segment["pathKind"];
              const upd: Segment[] = segsRef.current.map((s) =>
                s.id === activeIdRef.current
                  ? {
                      ...s,
                      routePoints: points,
                      routeSegmentMode: mode,
                      pathKind,
                      routingFailed: false,
                    }
                  : s,
              );
              segsRef.current = upd;
              setSegments(upd);
              setDrawMode(mode);
              drawModeRef.current = mode;
              syncMap(upd);
              pushHist(upd);
              setShowAlternatives(false);
            }}
          />
        )}
      </div>

      <input
        ref={gpxFileInputRef}
        type="file"
        accept=".gpx,application/gpx+xml,text/xml"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void handleGpxFile(f);
        }}
      />

      <GpxToolPalette
        editorMode={editorMode}
        transportMode={transportMode}
        segmentMode={drawMode}
        onLayers={() => setStyleMenuOpen((value) => !value)}
        onSave={() => void handleSave()}
        onImport={() => gpxFileInputRef.current?.click()}
        onExport={handleDownload}
        onLaunch={() => void handleLaunch()}
        onExit={() => router.push("/")}
        showExit={!embedNavRideApp}
        onAddSegment={handleAddSeg}
        onSplitSegment={() => void handleSplitAtActive()}
        onJoinSegment={() => void handleJoinNext()}
        onReverseRoute={() => void handleReverse()}
        onInsertMode={() => {
          if (!activeWpt) {
            setRouteError("Selecciona un punto y luego Insertar entre puntos.");
            return;
          }
          setInsertMode(true);
          insertModeRef.current = true;
          setRouteError("Toca el mapa para insertar después del punto seleccionado.");
        }}
        onShowAnalysis={() => {
          setShowAnalysis(true);
          setShowAlternatives(false);
        }}
        onShowAlternatives={() => {
          setShowAlternatives(true);
          setShowAnalysis(false);
        }}
        onEditorModeChange={setEditorMode}
        onTransportChange={handleTransportChange}
        onSegmentModeChange={(mode) => {
          void handleSegmentModeChange(mode);
        }}
        canSave={totalRoutePts >= 2 && !saving && !uploading}
        canExport={totalRoutePts >= 2}
        canLaunch={totalRoutePts >= 2 && !saving && !uploading}
        canAddSegment={advanced}
        canSplit={advanced && !!activeWpt && !!activeSeg && activeSeg.waypoints.length >= 3}
        canJoin={advanced && segments.length >= 2}
        canReverse={totalWpts >= 2}
        canInsert={advanced && !!activeWpt}
      />

      {pointMenu && menuSeg && (
        <GpxPointContextMenu
          x={pointMenu.x}
          y={pointMenu.y}
          pointIndex={pointMenu.idx}
          totalPoints={menuSeg.waypoints.length}
          isShaping={menuKind === "shaping"}
          advanced={advanced}
          onClose={() => setPointMenu(null)}
          onAction={(action) => void handlePointMenuAction(action)}
        />
      )}

      {importDialog && (
        <GpxImportDialog
          dialog={importDialog}
          onChoose={(choice) => void handleImportChoice(choice)}
          onCancel={() => setImportDialog(null)}
        />
      )}
    </div>
  );
}
