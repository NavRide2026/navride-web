import type { LngLat } from "./routing.ts";
import { haversineKm } from "./geo.ts";
import type { OsmWay } from "./route-compatibility-snap.ts";
import type { WayTags } from "./route-compatibility.ts";

/** Overpass query is highway=* with no access/motor_vehicle filter. Master editor graph. */
const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const cache = new Map<string, { at: number; ways: OsmWay[] }>();
const CACHE_MS = 45_000;

function cacheKey(lat: number, lng: number, radiusM: number): string {
  return `${lat.toFixed(4)}:${lng.toFixed(4)}:${radiusM}`;
}

function parseWays(json: unknown): OsmWay[] {
  const root = json as { elements?: unknown[] };
  const out: OsmWay[] = [];
  for (const el of root.elements ?? []) {
    if (!el || typeof el !== "object") continue;
    const row = el as {
      type?: string;
      id?: number;
      tags?: WayTags;
      geometry?: { lat: number; lon: number }[];
    };
    if (row.type !== "way" || row.id == null) continue;
    const geom = (row.geometry ?? [])
      .filter((g) => Number.isFinite(g.lat) && Number.isFinite(g.lon))
      .map((g) => [g.lon, g.lat] as LngLat);
    if (geom.length < 2) continue;
    out.push({ id: row.id, tags: row.tags ?? {}, geometry: geom });
  }
  return out;
}

export type WayFetchResult = {
  ok: boolean;
  ways: OsmWay[];
  reason?: string;
};

export async function fetchWaysAround(
  click: LngLat,
  radiusM = 40,
  signal?: AbortSignal,
): Promise<WayFetchResult> {
  const [lng, lat] = click;
  const key = cacheKey(lat, lng, radiusM);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return { ok: true, ways: hit.ways };

  const q = `[out:json][timeout:12];way(around:${Math.round(radiusM)},${lat.toFixed(6)},${lng.toFixed(6)})["highway"];out tags geom;`;
  for (const url of OVERPASS_URLS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: `data=${encodeURIComponent(q)}`,
        signal: signal ?? AbortSignal.timeout(14000),
      });
      if (!res.ok) continue;
      const ways = parseWays(await res.json());
      cache.set(key, { at: Date.now(), ways });
      return { ok: true, ways };
    } catch {
      /* try next */
    }
  }
  return { ok: false, ways: [], reason: "overpass_unavailable" };
}

export async function fetchWaysInBbox(
  south: number,
  west: number,
  north: number,
  east: number,
  signal?: AbortSignal,
): Promise<WayFetchResult> {
  const key = `b:${south.toFixed(3)}:${west.toFixed(3)}:${north.toFixed(3)}:${east.toFixed(3)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return { ok: true, ways: hit.ways };
  const q = `[out:json][timeout:20];way(${south.toFixed(5)},${west.toFixed(5)},${north.toFixed(5)},${east.toFixed(5)})["highway"];out tags geom;`;
  for (const url of OVERPASS_URLS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: `data=${encodeURIComponent(q)}`,
        signal: signal ?? AbortSignal.timeout(22000),
      });
      if (!res.ok) continue;
      const ways = parseWays(await res.json());
      cache.set(key, { at: Date.now(), ways });
      return { ok: true, ways };
    } catch {
      /* try next */
    }
  }
  return { ok: false, ways: [], reason: "overpass_unavailable" };
}

/** Corridor Overpass fetch for full-route review. Does not filter access. */
export async function fetchWaysAlongRoute(pts: LngLat[]): Promise<WayFetchResult> {
  if (pts.length === 0) return { ok: true, ways: [] };
  const chunks: LngLat[][] = [];
  let cur: LngLat[] = [pts[0]];
  let accKm = 0;
  for (let i = 1; i < pts.length; i++) {
    accKm += haversineKm(pts[i - 1], pts[i]);
    cur.push(pts[i]);
    if (accKm >= 12) {
      chunks.push(cur);
      cur = [pts[i]];
      accKm = 0;
    }
  }
  if (cur.length >= 2 || chunks.length === 0) chunks.push(cur);

  const byId = new Map<number, OsmWay>();
  const workers = 2;
  let anyOk = false;
  let anyFail = false;
  for (let i = 0; i < chunks.length; i += workers) {
    const slice = chunks.slice(i, i + workers);
    const results = await Promise.all(slice.map((ch) => fetchChunkBbox(ch)));
    for (const r of results) {
      if (r.ok) anyOk = true;
      else anyFail = true;
      for (const w of r.ways) byId.set(w.id, w);
    }
  }
  const ways = [...byId.values()];
  if (!anyOk && anyFail) {
    return { ok: false, ways, reason: "overpass_unavailable" };
  }
  return { ok: true, ways };
}

async function fetchChunkBbox(ch: LngLat[]): Promise<WayFetchResult> {
  let south = 90;
  let west = 180;
  let north = -90;
  let east = -180;
  for (const p of ch) {
    north = Math.max(north, p[1]);
    south = Math.min(south, p[1]);
    east = Math.max(east, p[0]);
    west = Math.min(west, p[0]);
  }
  const pad = 0.0015;
  return fetchWaysInBbox(south - pad, west - pad, north + pad, east + pad);
}
