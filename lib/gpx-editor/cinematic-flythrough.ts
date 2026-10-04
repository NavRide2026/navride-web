import { LngLat, type Map as MapLibreMap } from "maplibre-gl";
import {
  flattenRouteLngLats,
  haversineKm,
  lngLatAtProgressM,
  type LngLat as RouteLngLat,
} from "@/lib/route-studio/geo";
import type { Segment } from "@/lib/gpx-editor/editor-types";
import {
  cinematicCameraAltitudeM,
  cinematicClearanceFromZoom,
  cinematicPitchFromGrade,
  clampCinematic,
} from "./cinematic-camera-math";

export const CINEMATIC_ZOOM_MIN = 14.5;
export const CINEMATIC_ZOOM_MAX = 19;
export const CINEMATIC_SPEED_MIN = 0.35;
export const CINEMATIC_SPEED_MAX = 3;

const GRADE_LOOKAHEAD_M = 90;
const PITCH_MIN = 48;
const PITCH_MAX = 72;
const GRADE_CLAMP = 0.45;

export type CinematicProgress = {
  progressM: number;
  totalM: number;
  progressKm: number;
  totalKm: number;
  zoom: number;
  speedFactor: number;
};

export type CinematicHandle = {
  stop: () => void;
  isPlaying: () => boolean;
  getZoom: () => number;
  setZoom: (zoom: number) => void;
  adjustZoom: (delta: number) => void;
  getSpeedFactor: () => number;
  setSpeedFactor: (factor: number) => void;
  adjustSpeedFactor: (delta: number) => void;
  getProgressKm: () => number;
  getTotalKm: () => number;
  seekToKm: (km: number) => void;
  setScrubbing: (scrubbing: boolean) => void;
};

type Options = {
  onStart?: () => void;
  onStop?: () => void;
  onProgress?: (state: CinematicProgress) => void;
  speedMps?: number;
  initialZoom?: number;
  initialSpeedFactor?: number;
};

function polylineLengthM(pts: RouteLngLat[]): number {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += haversineKm(pts[i - 1], pts[i]) * 1000;
  return d;
}

/** Densifica SOLO a lo largo de cada arista del track (sin atajar curvas). */
function densifyAlongTrack(pts: RouteLngLat[], stepM: number): RouteLngLat[] {
  if (pts.length < 2) return pts;
  const out: RouteLngLat[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const segM = haversineKm(a, b) * 1000;
    if (segM <= stepM) {
      out.push(b);
      continue;
    }
    const n = Math.ceil(segM / stepM);
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}

function adaptiveSpeedMps(lengthM: number, base: number): number {
  const durationS = Math.max(14, Math.min(80, lengthM / base));
  return Math.max(5, Math.min(38, lengthM / durationS));
}

function clamp(n: number, min: number, max: number) {
  return clampCinematic(n, min, max);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function finiteOr(value: number | null | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function queryElevationM(map: MapLibreMap, lngLat: RouteLngLat): number | null {
  try {
    const value = map.queryTerrainElevation(new LngLat(lngLat[0], lngLat[1]));
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    return value;
  } catch {
    return null;
  }
}

function sampleGrade(map: MapLibreMap, line: RouteLngLat[], lengthM: number, progressM: number) {
  const here = lngLatAtProgressM(line, progressM) ?? line[0];
  const ahead = lngLatAtProgressM(line, Math.min(lengthM, progressM + GRADE_LOOKAHEAD_M)) ?? line[line.length - 1];
  const e0 = queryElevationM(map, here);
  const e1 = queryElevationM(map, ahead);
  if (e0 == null || e1 == null) return { grade: 0, e0: e0 ?? 0, e1: e1 ?? 0, hasDem: e0 != null };
  const run = Math.max(8, haversineKm(here, ahead) * 1000);
  return { grade: clamp((e1 - e0) / run, -GRADE_CLAMP, GRADE_CLAMP), e0, e1, hasDem: true };
}

/**
 * Cámara tipo vehículo: posición y mirada están SIEMPRE sobre el track.
 * Usa calculateCameraOptionsFromTo. altitudeFrom/To son metros sobre el nivel
 * del mar según MapLibre 6.11 — hay que sumar DEM + clearance, nunca un
 * offset fijo que meta la cámara dentro de la montaña.
 */
function applyVehicleCamera(
  map: MapLibreMap,
  line: RouteLngLat[],
  lengthM: number,
  progressM: number,
  zoom: number,
  motion: {
    pitch: number;
    grade: number;
    camAlt: number;
    lookAlt: number;
  },
) {
  const altitude = cinematicClearanceFromZoom(zoom);
  const behindM = clamp(altitude * 0.5, 3, 40);
  const aheadM = clamp(altitude * 1.35, 12, 90);

  const vehicle = Math.min(lengthM, Math.max(0, progressM));
  const camProgress = Math.max(0, vehicle - behindM);
  let lookProgress = Math.min(lengthM, vehicle + aheadM);
  if (lookProgress <= camProgress + 1) {
    lookProgress = Math.min(lengthM, camProgress + 12);
  }

  const camGround = lngLatAtProgressM(line, camProgress) ?? line[0];
  const lookGround =
    lngLatAtProgressM(line, lookProgress) ?? line[line.length - 1];
  const sampled = sampleGrade(map, line, lengthM, vehicle);

  motion.grade = lerp(motion.grade, sampled.grade, 0.18);
  const grade = motion.grade;

  const targetPitch = cinematicPitchFromGrade(grade);
  motion.pitch = lerp(motion.pitch, targetPitch, 0.16);

  const lookElev = sampled.hasDem ? sampled.e1 : 0;
  const camAltTarget = cinematicCameraAltitudeM(sampled.hasDem ? sampled.e0 : null, zoom, grade);
  const lookAltTarget = lookElev + Math.max(0, altitude * 0.12);
  motion.camAlt = lerp(motion.camAlt || camAltTarget, camAltTarget, 0.22);
  motion.lookAlt = lerp(motion.lookAlt || lookAltTarget, lookAltTarget, 0.22);

  const from = new LngLat(camGround[0], camGround[1]);
  const to = new LngLat(lookGround[0], lookGround[1]);

  try {
    const camera = map.calculateCameraOptionsFromTo(
      from,
      motion.camAlt,
      to,
      motion.lookAlt,
    );
    const pitch = finiteOr(camera.pitch, motion.pitch);
    map.jumpTo({
      center: camera.center,
      zoom: finiteOr(camera.zoom, zoom),
      pitch: clamp(Number.isFinite(pitch) ? lerp(pitch, motion.pitch, 0.35) : motion.pitch, PITCH_MIN, PITCH_MAX),
      bearing: finiteOr(camera.bearing, map.getBearing()),
    });
  } catch {
    const onVehicle = lngLatAtProgressM(line, vehicle) ?? camGround;
    const tip = lngLatAtProgressM(line, Math.min(lengthM, vehicle + 18)) ?? lookGround;
    const la1 = (onVehicle[1] * Math.PI) / 180;
    const la2 = (tip[1] * Math.PI) / 180;
    const dLon = ((tip[0] - onVehicle[0]) * Math.PI) / 180;
    const y = Math.sin(dLon) * Math.cos(la2);
    const x =
      Math.cos(la1) * Math.sin(la2) -
      Math.sin(la1) * Math.cos(la2) * Math.cos(dLon);
    const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
    map.jumpTo({
      center: onVehicle,
      zoom,
      pitch: motion.pitch,
      bearing,
    });
  }
}

/**
 * Vista tipo vehículo: la cámara viaja por encima del GPX siguiendo
 * exactamente el trazado (sin líneas rectas fuera del track).
 */
export function startCinematicFlythrough(
  map: MapLibreMap,
  segments: Segment[],
  options: Options = {},
): CinematicHandle | null {
  const raw = flattenRouteLngLats(segments);
  if (raw.length < 2) return null;

  const line = densifyAlongTrack(raw, 3);
  const lengthM = polylineLengthM(line);
  if (lengthM < 8) return null;

  const baseSpeedMps = adaptiveSpeedMps(lengthM, options.speedMps ?? 18);
  let speedFactor = clamp(
    options.initialSpeedFactor ?? 1,
    CINEMATIC_SPEED_MIN,
    CINEMATIC_SPEED_MAX,
  );
  let zoom = clamp(
    options.initialZoom ?? (lengthM < 800 ? 17.8 : lengthM < 5000 ? 17.3 : 16.8),
    CINEMATIC_ZOOM_MIN,
    CINEMATIC_ZOOM_MAX,
  );

  let playing = true;
  let scrubbing = false;
  let raf = 0;
  let progressM = 0;
  let lastTs = 0;
  let lastProgressEmit = 0;
  const motion = {
    pitch: 62,
    grade: 0,
    camAlt: cinematicClearanceFromZoom(zoom),
    lookAlt: 0,
  };

  const snapshot = (): CinematicProgress => ({
    progressM,
    totalM: lengthM,
    progressKm: progressM / 1000,
    totalKm: lengthM / 1000,
    zoom,
    speedFactor,
  });

  const notify = () => {
    options.onProgress?.(snapshot());
  };

  const paint = () => {
    applyVehicleCamera(map, line, lengthM, progressM, zoom, motion);
  };

  map.stop();
  paint();

  const onWheel = (event: { originalEvent?: WheelEvent; preventDefault: () => void }) => {
    event.preventDefault();
    const dy = event.originalEvent?.deltaY ?? 0;
    if (!dy) return;
    zoom = clamp(zoom + (dy > 0 ? -0.18 : 0.18), CINEMATIC_ZOOM_MIN, CINEMATIC_ZOOM_MAX);
    paint();
    notify();
  };

  const stopUser = () => stop();

  const stop = () => {
    if (!playing) return;
    playing = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    map.off("mousedown", stopUser);
    map.off("touchstart", stopUser);
    map.off("dragstart", stopUser);
    map.off("wheel", onWheel);
    options.onStop?.();
  };

  map.on("mousedown", stopUser);
  map.on("touchstart", stopUser);
  map.on("dragstart", stopUser);
  map.on("wheel", onWheel);

  options.onStart?.();
  notify();

  const tick = (ts: number) => {
    if (!playing) return;
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.048, (ts - lastTs) / 1000);
    lastTs = ts;

    if (!scrubbing) {
      progressM += baseSpeedMps * speedFactor * dt;
    }

    if (progressM >= lengthM) {
      progressM = lengthM;
      paint();
      notify();
      stop();
      return;
    }

    paint();

    if (ts - lastProgressEmit > 70 || scrubbing) {
      lastProgressEmit = ts;
      notify();
    }

    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);

  return {
    stop,
    isPlaying: () => playing,
    getZoom: () => zoom,
    setZoom: (next) => {
      zoom = clamp(next, CINEMATIC_ZOOM_MIN, CINEMATIC_ZOOM_MAX);
      paint();
      notify();
    },
    adjustZoom: (delta) => {
      zoom = clamp(zoom + delta, CINEMATIC_ZOOM_MIN, CINEMATIC_ZOOM_MAX);
      paint();
      notify();
    },
    getSpeedFactor: () => speedFactor,
    setSpeedFactor: (next) => {
      speedFactor = clamp(next, CINEMATIC_SPEED_MIN, CINEMATIC_SPEED_MAX);
      notify();
    },
    adjustSpeedFactor: (delta) => {
      speedFactor = clamp(speedFactor + delta, CINEMATIC_SPEED_MIN, CINEMATIC_SPEED_MAX);
      notify();
    },
    getProgressKm: () => progressM / 1000,
    getTotalKm: () => lengthM / 1000,
    seekToKm: (km) => {
      progressM = clamp(km * 1000, 0, lengthM);
      lastTs = 0;
      paint();
      notify();
    },
    setScrubbing: (next) => {
      scrubbing = next;
      if (!next) lastTs = 0;
    },
  };
}

export function formatCinematicKm(km: number, totalKm: number): string {
  if (!Number.isFinite(km)) return "0 km";
  if (totalKm < 1) return `${Math.round(km * 1000)} m`;
  if (totalKm < 10) return `${km.toFixed(2)} km`;
  return `${km.toFixed(1)} km`;
}

export { cinematicCameraAltitudeM, cinematicPitchFromGrade } from "./cinematic-camera-math";
