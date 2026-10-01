import type { NavRideCue } from "@/lib/route-studio/navride-route/types";
import type { TransportMode } from "@/lib/route-studio/routing";
import {
  buildRouteNotesGeoJSON,
  routeNotesCirclePaint,
  SRC_ROUTE_NOTES,
  LYR_ROUTE_NOTES,
} from "@/lib/route-studio/route-notes-geojson";
import {
  casingColor,
  casingOpacity,
  casingWidth,
} from "@/lib/route-studio/track-style";
import type {
  LngLat,
  Segment,
  StyleId,
} from "./editor-types";

export { LYR_ROUTE_NOTES } from "@/lib/route-studio/route-notes-geojson";

export const SRC_LINES = "nav-lines";
export const SRC_POINTS = "nav-points";
export const SRC_USER = "nav-user";
export const LYR_CASING = "nav-casing";
export const LYR_GLOW = "nav-glow";
export const LYR_LINES = "nav-lyr-lines";
export const LYR_POINTS = "nav-lyr-points";
export const LYR_USER = "nav-user-dot";
export const LYR_USER_RING = "nav-user-ring";
export const LYR_RESTRICTED = "nav-access-restricted";

export type WaypointSelection = { segId: string; idx: number } | null;

function restrictionFilter(mode: TransportMode): unknown[] {
  const accessDenied: unknown[] = [
    "in",
    ["downcase", ["to-string", ["coalesce", ["get", "access"], ""]]],
    ["literal", ["no", "private", "false", "0"]],
  ];

  const motorwayOrExpressway: unknown[] = [
    "any",
    [
      "in",
      ["get", "class"],
      ["literal", ["motorway", "motorway_construction"]],
    ],
    [
      "==",
      ["to-string", ["coalesce", ["get", "expressway"], ""]],
      "1",
    ],
  ];

  if (mode === "walk") {
    return [
      "any",
      accessDenied,
      motorwayOrExpressway,
      [
        "in",
        ["downcase", ["to-string", ["coalesce", ["get", "foot"], ""]]],
        ["literal", ["no", "private"]],
      ],
    ];
  }

  if (mode === "bike") {
    return [
      "any",
      accessDenied,
      motorwayOrExpressway,
      ["==", ["get", "subclass"], "steps"],
      [
        "in",
        ["downcase", ["to-string", ["coalesce", ["get", "bicycle"], ""]]],
        ["literal", ["no", "private", "dismount", "use_sidepath"]],
      ],
    ];
  }

  return [
    "any",
    accessDenied,
    [
      "in",
      ["get", "subclass"],
      [
        "literal",
        [
          "pedestrian",
          "footway",
          "cycleway",
          "steps",
          "bridleway",
          "corridor",
          "platform",
        ],
      ],
    ],
  ];
}


function buildGeoJSON(
  segments: Segment[],
  activeWpt: WaypointSelection,
) {
  const lines = segments
    .filter((segment) =>
      segment.routePoints.length >= 2 && !segment.routingFailed,
    )
    .map((segment) => ({
      type: "Feature" as const,
      properties: { color: segment.color },
      geometry: {
        type: "LineString" as const,
        coordinates: segment.routePoints,
      },
    }));

  const points = segments.flatMap((segment) =>
    segment.waypoints.map((point, pointIndex) => ({
      type: "Feature" as const,
      properties: {
        color: segment.color,
        segId: segment.id,
        ptIdx: pointIndex,
        active:
          activeWpt?.segId === segment.id &&
          activeWpt.idx === pointIndex
            ? 1
            : 0,
      },
      geometry: {
        type: "Point" as const,
        coordinates: point,
      },
    })),
  );

  return {
    lines: { type: "FeatureCollection" as const, features: lines },
    points: { type: "FeatureCollection" as const, features: points },
  };
}

export interface GpxMapSnapshot {
  segments: Segment[];
  activeWpt: WaypointSelection;
  cues: NavRideCue[];
  styleId: StyleId;
  trackWidth: number;
  trackOpacity: number;
  transportMode: TransportMode;
}

export class GpxMapAdapter {
  // MapLibre is dynamically imported by the hook; keep its runtime type out
  // of editor domain modules.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly map: any) {}

  ready = false;

  invalidate(): void {
    this.ready = false;
  }

  setupLayers(snapshot: GpxMapSnapshot): void {
    const m = this.map;
    [
      LYR_USER,
      LYR_USER_RING,
      LYR_ROUTE_NOTES,
      LYR_POINTS,
      LYR_LINES,
      LYR_GLOW,
      LYR_CASING,
      LYR_RESTRICTED,
    ].forEach((layer) => {
      if (m.getLayer(layer)) m.removeLayer(layer);
    });
    [SRC_LINES, SRC_POINTS, SRC_USER, SRC_ROUTE_NOTES].forEach((source) => {
      if (m.getSource(source)) m.removeSource(source);
    });

    const geometry = buildGeoJSON(snapshot.segments, snapshot.activeWpt);
    const satellite = snapshot.styleId === "satellite";
    const width = snapshot.trackWidth;
    const opacity = snapshot.trackOpacity;

    m.addSource(SRC_LINES, { type: "geojson", data: geometry.lines });
    m.addSource(SRC_POINTS, { type: "geojson", data: geometry.points });
    m.addSource(SRC_USER, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
    m.addSource(SRC_ROUTE_NOTES, {
      type: "geojson",
      data: buildRouteNotesGeoJSON(snapshot.cues, snapshot.segments),
    });

    if (m.getSource("openmaptiles")) {
      m.addLayer({
        id: LYR_RESTRICTED,
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        minzoom: 8,
        filter: restrictionFilter(snapshot.transportMode),
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#ef4444",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            8, 1,
            12, 1.8,
            15, 3.2,
            18, 5.5,
            20, 8,
          ],
          "line-opacity": 0.86,
          "line-dasharray": [3, 1.5],
        },
      });
    }

    m.addLayer({
      id: LYR_CASING,
      type: "line",
      source: SRC_LINES,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": casingColor(satellite),
        "line-width": casingWidth(width),
        "line-opacity": casingOpacity(opacity, satellite),
      },
    });
    m.addLayer({
      id: LYR_GLOW,
      type: "line",
      source: SRC_LINES,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": ["get", "color"],
        "line-width": width * 2.8,
        "line-opacity": Math.min(0.35, opacity * 0.28),
        "line-blur": 8,
      },
    });
    m.addLayer({
      id: LYR_LINES,
      type: "line",
      source: SRC_LINES,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": ["get", "color"],
        "line-width": width,
        "line-opacity": opacity,
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
        "circle-color": ["get", "color"],
        "circle-stroke-color": [
          "case",
          ["==", ["get", "active"], 1],
          "#FF5A1F",
          "#ffffff",
        ],
        "circle-stroke-width": [
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
    m.addLayer({
      id: LYR_ROUTE_NOTES,
      type: "circle",
      source: SRC_ROUTE_NOTES,
      paint: { ...routeNotesCirclePaint },
    });
    this.ready = true;
  }

  setTransportMode(mode: TransportMode): void {
    if (!this.ready) return;
    try {
      if (this.map.getLayer(LYR_RESTRICTED)) {
        this.map.setFilter(LYR_RESTRICTED, restrictionFilter(mode));
      }
    } catch {
      // Style transition: style.load will rebuild the overlay.
    }
  }

  setGeometry(
    segments: Segment[],
    activeWpt: WaypointSelection,
  ): void {
    if (!this.ready) return;
    const geometry = buildGeoJSON(segments, activeWpt);
    try {
      this.map.getSource(SRC_LINES)?.setData(geometry.lines);
      this.map.getSource(SRC_POINTS)?.setData(geometry.points);
    } catch {
      // Style transition: style.load will rebuild all sources.
    }
  }

  setUserMarker(point: LngLat | null): void {
    if (!this.ready) return;
    const data = {
      type: "FeatureCollection" as const,
      features: point
        ? [
            {
              type: "Feature" as const,
              properties: {},
              geometry: {
                type: "Point" as const,
                coordinates: point,
              },
            },
          ]
        : [],
    };
    try {
      this.map.getSource(SRC_USER)?.setData(data);
    } catch {
      // Style transition.
    }
  }

  setNotes(cues: NavRideCue[], segments: Segment[]): void {
    if (!this.ready) return;
    try {
      this.map
        .getSource(SRC_ROUTE_NOTES)
        ?.setData(buildRouteNotesGeoJSON(cues, segments));
    } catch {
      // Style transition.
    }
  }

  applyTrackPaint(
    styleId: StyleId,
    width: number,
    opacity: number,
  ): void {
    if (!this.ready) return;
    const satellite = styleId === "satellite";
    try {
      if (this.map.getLayer(LYR_CASING)) {
        this.map.setPaintProperty(
          LYR_CASING,
          "line-width",
          casingWidth(width),
        );
        this.map.setPaintProperty(
          LYR_CASING,
          "line-opacity",
          casingOpacity(opacity, satellite),
        );
        this.map.setPaintProperty(
          LYR_CASING,
          "line-color",
          casingColor(satellite),
        );
      }
      if (this.map.getLayer(LYR_GLOW)) {
        this.map.setPaintProperty(LYR_GLOW, "line-width", width * 2.8);
        this.map.setPaintProperty(
          LYR_GLOW,
          "line-opacity",
          Math.min(0.35, opacity * 0.28),
        );
      }
      if (this.map.getLayer(LYR_LINES)) {
        this.map.setPaintProperty(LYR_LINES, "line-width", width);
        this.map.setPaintProperty(LYR_LINES, "line-opacity", opacity);
      }
    } catch {
      // Style transition.
    }
  }

  fit(points: LngLat[]): void {
    if (points.length === 0) return;
    const lngs = points.map((point) => point[0]);
    const lats = points.map((point) => point[1]);
    this.map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 70, duration: 700, maxZoom: 16 },
    );
  }

  destroy(): void {
    this.ready = false;
    this.map.remove();
  }
}
