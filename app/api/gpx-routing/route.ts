import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LngLat = [number, number];
type TransportMode = "walk" | "bike" | "moto" | "car";
type SegmentMode = "FOLLOW_ROAD" | "FOLLOW_ROAD_TRAIL" | "FOLLOW_TRAIL" | "MANUAL_STRAIGHT";
type Preference = "short" | "fast" | "balanced" | "adventure";

const configuredValhalla = process.env.NAVRIDE_VALHALLA_URL
  ?.trim()
  .replace(/\/$/, "");
const expectedDatasetId = process.env.NAVRIDE_OSM_DATASET_ID?.trim() || null;

const VALHALLA_HOSTS = configuredValhalla
  ? [configuredValhalla]
  : [
      "https://valhalla.openstreetmap.de",
      "https://valhalla1.openstreetmap.de",
    ];

function decodePolyline6(encoded: string): LngLat[] {
  const out: LngLat[] = [];
  let index = 0;
  let lat = 0;
  let lon = 0;

  const readDelta = () => {
    let result = 0;
    let shift = 0;
    let byte = 0;
    do {
      if (index >= encoded.length) throw new Error("TRUNCATED_POLYLINE");
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
  };

  while (index < encoded.length) {
    lat += readDelta();
    lon += readDelta();
    out.push([lon / 1e6, lat / 1e6]);
  }
  return out;
}

function pushDistinct(out: LngLat[], point: LngLat) {
  const last = out[out.length - 1];
  if (!last || Math.abs(last[0] - point[0]) > 1e-7 || Math.abs(last[1] - point[1]) > 1e-7) {
    out.push(point);
  }
}

/**
 * Adventure / trail costing leans on OSM-aware Valhalla factors:
 * use_trails, surface preference via trail bias, avoid highways/tolls,
 * motorcycle/mtb-oriented bicycle_type mountain.
 */
function valhallaProfile(
  mode: TransportMode,
  segmentMode: SegmentMode,
  preference: Preference = "balanced",
) {
  const adventure = preference === "adventure" || segmentMode === "FOLLOW_TRAIL";
  const mixed = segmentMode === "FOLLOW_ROAD_TRAIL";
  const shortBias = preference === "short";
  const fastBias = preference === "fast";

  if (mode === "walk") {
    return {
      costing: "pedestrian",
      costing_options: {
        pedestrian: adventure
          ? { walkway_factor: 0.9, alley_factor: 0.8, use_ferry: 0.2 }
          : { walkway_factor: 1.0 },
      },
    };
  }

  if (mode === "bike") {
    return {
      costing: "bicycle",
      costing_options: {
        bicycle: adventure
          ? {
              bicycle_type: "mountain",
              use_roads: 0.05,
              use_hills: 1.0,
              use_living_streets: 0.6,
              avoid_bad_surfaces: 0.1,
            }
          : shortBias
            ? { bicycle_type: "road", use_roads: 0.95, use_hills: 0.2 }
            : fastBias
              ? { bicycle_type: "road", use_roads: 1.0, use_hills: 0.1 }
              : { bicycle_type: "hybrid", use_roads: 0.75, use_hills: 0.5 },
      },
    };
  }

  if (mode === "moto") {
    return {
      costing: "motorcycle",
      costing_options: {
        motorcycle: adventure
          ? {
              use_trails: 1.0,
              use_highways: 0.05,
              use_tolls: 0.05,
              use_ferry: 0.2,
              top_speed: 90,
            }
          : shortBias
            ? { use_trails: 0.1, use_highways: 0.6, use_tolls: 0.4 }
            : fastBias
              ? { use_trails: 0.05, use_highways: 1.0, use_tolls: 0.8, top_speed: 130 }
              : mixed
                ? { use_trails: 0.75, use_highways: 0.55, use_tolls: 0.3, top_speed: 100 }
                : { use_trails: 0.2, use_highways: 0.8, use_tolls: 0.5 },
      },
    };
  }

  return {
    costing: "auto",
    costing_options: {
      auto: adventure
        ? { use_highways: 0.3, use_tolls: 0.2, use_ferry: 0.3 }
        : fastBias
          ? { use_highways: 1.0, use_tolls: 0.9 }
          : shortBias
            ? { use_highways: 0.5, use_tolls: 0.3 }
            : {},
    },
  };
}

function haversineKm(a: LngLat, b: LngLat): number {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const la1 = (a[1] * Math.PI) / 180;
  const la2 = (b[1] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

function pathDistanceKm(points: LngLat[]): number {
  let d = 0;
  for (let i = 1; i < points.length; i++) d += haversineKm(points[i - 1], points[i]);
  return d;
}

async function routeWithValhalla(
  waypoints: LngLat[],
  mode: TransportMode,
  segmentMode: SegmentMode,
  preference: Preference = "balanced",
) {
  const profile = valhallaProfile(mode, segmentMode, preference);
  const payload = {
    locations: waypoints.map(([lon, lat]) => ({ lat, lon, type: "break" })),
    costing: profile.costing,
    costing_options: profile.costing_options,
    directions_options: { units: "kilometers", language: "es-ES" },
  };

  let lastError = "VALHALLA_UNAVAILABLE";
  for (const host of VALHALLA_HOSTS) {
    try {
      const response = await fetch(`${host}/route`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": "NavRide-Web-GPX/1.0",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: AbortSignal.timeout(9000),
      });
      const body = (await response.json().catch(() => null)) as {
        trip?: {
          legs?: Array<{ shape?: string; summary?: { length?: number; time?: number } }>;
          summary?: { length?: number; time?: number };
        };
        error?: string;
        error_code?: string | number;
      } | null;
      const datasetId = response.headers.get("x-navride-dataset-id");
      if (
        configuredValhalla &&
        expectedDatasetId &&
        datasetId !== expectedDatasetId
      ) {
        lastError = datasetId
          ? `VALHALLA_DATASET_MISMATCH:${datasetId}`
          : "VALHALLA_DATASET_ID_MISSING";
        continue;
      }
      if (!response.ok || !body?.trip?.legs?.length) {
        lastError = body?.error
          ?? (body?.error_code == null ? null : String(body.error_code))
          ?? `VALHALLA_HTTP_${response.status}`;
        continue;
      }

      const points: LngLat[] = [];
      for (const leg of body.trip.legs) {
        if (!leg?.shape) continue;
        for (const point of decodePolyline6(leg.shape)) pushDistinct(points, point);
      }
      if (points.length >= 2) {
        const distanceKm =
          body.trip.summary?.length ??
          pathDistanceKm(points);
        const durationSec = body.trip.summary?.time ?? null;
        return {
          ok: true as const,
          points,
          distanceKm,
          durationSec,
          engine: "valhalla",
          profile: profile.costing,
          preference,
          datasetId: datasetId ?? (configuredValhalla ? expectedDatasetId : null),
          datasetVerified:
            !!configuredValhalla &&
            !!expectedDatasetId &&
            datasetId === expectedDatasetId,
        };
      }
      lastError = "VALHALLA_EMPTY_GEOMETRY";
    } catch (error) {
      lastError = error instanceof Error ? error.message : "VALHALLA_EXCEPTION";
    }
  }

  return {
    ok: false as const,
    points: [] as LngLat[],
    engine: "valhalla",
    profile: profile.costing,
    preference,
    message: lastError,
  };
}

function validLngLat(value: unknown): value is LngLat {
  return Array.isArray(value) &&
    value.length === 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1]) &&
    Number(value[0]) >= -180 &&
    Number(value[0]) <= 180 &&
    Number(value[1]) >= -90 &&
    Number(value[1]) <= 90;
}

async function execute(
  waypoints: unknown,
  mode: unknown,
  segmentMode: unknown,
  preference: unknown,
) {
  if (!Array.isArray(waypoints) || waypoints.length < 2 || waypoints.length > 100 || !waypoints.every(validLngLat)) {
    return Response.json({ ok: false, message: "INVALID_WAYPOINTS" }, { status: 400 });
  }
  if (!["walk", "bike", "moto", "car"].includes(String(mode))) {
    return Response.json({ ok: false, message: "INVALID_MODE" }, { status: 400 });
  }
  if (!["FOLLOW_ROAD", "FOLLOW_ROAD_TRAIL", "FOLLOW_TRAIL"].includes(String(segmentMode))) {
    return Response.json({ ok: false, message: "INVALID_SEGMENT_MODE" }, { status: 400 });
  }
  const pref = ["short", "fast", "balanced", "adventure"].includes(String(preference))
    ? (preference as Preference)
    : "balanced";

  const result = await routeWithValhalla(
    waypoints as LngLat[],
    mode as TransportMode,
    segmentMode as SegmentMode,
    pref,
  );
  return Response.json(result, {
    status: result.ok ? 200 : 502,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    waypoints?: LngLat[];
    mode?: string;
    segmentMode?: string;
    preference?: string;
  } | null;
  return execute(body?.waypoints, body?.mode, body?.segmentMode, body?.preference);
}

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const parse = (raw: string | null): LngLat | null => {
    if (!raw) return null;
    const [latRaw, lonRaw] = raw.split(",");
    const lat = Number(latRaw);
    const lon = Number(lonRaw);
    return Number.isFinite(lat) && Number.isFinite(lon) ? [lon, lat] : null;
  };
  const a = parse(p.get("a"));
  const b = parse(p.get("b"));
  return execute(
    a && b ? [a, b] : null,
    p.get("mode") ?? "moto",
    p.get("segmentMode") ?? "FOLLOW_TRAIL",
    p.get("preference") ?? "adventure",
  );
}
