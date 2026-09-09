/**
 * Red maestra del editor GPX: todas las highway OSM, sin filtrar acceso.
 * El perfil decide compatibilidad; no se elimina una vía del grafo.
 */
import { haversineKm } from "./geo.ts";
import type { LngLat } from "./routing.ts";
import {
  classifyWay,
  isPreferredSnapTarget,
  type CompatibilityResult,
} from "./route-compatibility.ts";
import {
  decideEditorSnap,
  distancePointToWayM,
  rankWaysNearClick,
  type OsmWay,
  type SnapDecision,
} from "./route-compatibility-snap.ts";
import type { TransportMode } from "./routing.ts";

export const EDITOR_OSM_SNAP_RADIUS_M = 40;

export type OsmRouteResult = {
  points: LngLat[];
  ok: boolean;
  source: "osm-network" | "osm-waypoints";
  /** True when an OSM way was detected at the click, even if incompatible. */
  wayDetected: boolean;
};

function nodeKey(p: LngLat): string {
  return `${p[0].toFixed(5)},${p[1].toFixed(5)}`;
}

function nearestVertex(pt: LngLat, ways: OsmWay[]): LngLat {
  let best = pt;
  let bestD = Infinity;
  for (const w of ways) {
    for (const g of w.geometry) {
      const d = haversineKm(pt, g) * 1000;
      if (d < bestD) {
        bestD = d;
        best = g;
      }
    }
  }
  return best;
}

function shortestPath(ways: OsmWay[], from: LngLat, to: LngLat): {
  points: LngLat[];
  connected: boolean;
} {
  if (ways.length === 0) return { points: [from, to], connected: false };

  const adj = new Map<string, { to: string; cost: number }[]>();
  const coords = new Map<string, LngLat>();

  const addEdge = (a: LngLat, b: LngLat) => {
    const ka = nodeKey(a);
    const kb = nodeKey(b);
    coords.set(ka, a);
    coords.set(kb, b);
    const cost = haversineKm(a, b) * 1000;
    if (!adj.has(ka)) adj.set(ka, []);
    if (!adj.has(kb)) adj.set(kb, []);
    adj.get(ka)!.push({ to: kb, cost });
    adj.get(kb)!.push({ to: ka, cost });
  };

  for (const w of ways) {
    for (let i = 1; i < w.geometry.length; i++) {
      addEdge(w.geometry[i - 1], w.geometry[i]);
    }
  }

  const start = nodeKey(nearestVertex(from, ways));
  const goal = nodeKey(nearestVertex(to, ways));
  if (!adj.has(start) || !adj.has(goal)) {
    return { points: [from, to], connected: false };
  }

  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  const heap: { k: string; d: number }[] = [{ k: start, d: 0 }];
  dist.set(start, 0);
  const seen = new Set<string>();
  let steps = 0;
  while (heap.length > 0 && steps < 12000) {
    steps += 1;
    heap.sort((a, b) => a.d - b.d);
    const cur = heap.shift()!;
    if (seen.has(cur.k)) continue;
    seen.add(cur.k);
    if (cur.k === goal) break;
    for (const e of adj.get(cur.k) ?? []) {
      const nd = cur.d + e.cost;
      if (nd < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, nd);
        prev.set(e.to, cur.k);
        heap.push({ k: e.to, d: nd });
      }
    }
  }
  if (!prev.has(goal) && start !== goal) {
    return { points: [from, to], connected: false };
  }
  const chain: LngLat[] = [];
  let k = goal;
  chain.push(coords.get(k) ?? to);
  while (prev.has(k)) {
    k = prev.get(k)!;
    chain.push(coords.get(k) ?? from);
  }
  chain.reverse();
  if (chain.length < 2) return { points: [from, to], connected: false };
  return { points: chain, connected: true };
}

function geometryIfSameWay(ways: OsmWay[], from: LngLat, to: LngLat): LngLat[] | null {
  let best: OsmWay | null = null;
  let bestScore = Infinity;
  for (const w of ways) {
    const a = distancePointToWayM(from, w);
    const b = distancePointToWayM(to, w);
    const score = a.distanceM + b.distanceM;
    if (a.distanceM <= 35 && b.distanceM <= 35 && score < bestScore) {
      bestScore = score;
      best = w;
    }
  }
  if (!best) return null;
  return sliceWay(best, from, to);
}

function sliceWay(way: OsmWay, from: LngLat, to: LngLat): LngLat[] {
  const { snapped: a } = distancePointToWayM(from, way);
  const { snapped: b } = distancePointToWayM(to, way);
  let ia = 0;
  let ib = 0;
  let da = Infinity;
  let db = Infinity;
  for (let i = 0; i < way.geometry.length; i++) {
    const d1 = haversineKm(a, way.geometry[i]);
    const d2 = haversineKm(b, way.geometry[i]);
    if (d1 < da) {
      da = d1;
      ia = i;
    }
    if (d2 < db) {
      db = d2;
      ib = i;
    }
  }
  const lo = Math.min(ia, ib);
  const hi = Math.max(ia, ib);
  const mid = way.geometry.slice(lo, hi + 1);
  const out = ia <= ib ? [a, ...mid, b] : [a, ...mid.reverse(), b];
  return out.length >= 2 ? out : [a, b];
}

/**
 * Enruta sobre la red maestra OSM.
 * Misma vía → se sigue esa geometría (aunque sea incompatible).
 * Si hay modo, se intenta primero un camino compatible; si no hay, toda la red.
 * Nunca "camino no disponible".
 */
export function routeOnOsmNetwork(
  ways: OsmWay[],
  from: LngLat,
  to: LngLat,
  mode?: TransportMode,
): LngLat[] {
  if (ways.length === 0) return [from, to];

  const same = geometryIfSameWay(ways, from, to);
  if (same && same.length >= 2) return same;

  if (mode) {
    const preferred = compatibleWaysOnly(ways, mode);
    if (preferred.length > 0) {
      const viaPref = shortestPath(preferred, from, to);
      if (viaPref.connected) return viaPref.points;
    }
  }

  return shortestPath(ways, from, to).points;
}

export function compatibleWaysOnly(ways: OsmWay[], mode: TransportMode): OsmWay[] {
  return ways.filter((w) => isPreferredSnapTarget(classifyWay(w.tags, mode).cls));
}

export function snapClickToOsmNetwork(
  click: LngLat,
  ways: OsmWay[],
  mode: TransportMode,
): SnapDecision {
  const hits = rankWaysNearClick(click, ways, mode, EDITOR_OSM_SNAP_RADIUS_M);
  return decideEditorSnap(click, hits);
}

export function wayDetectedButIncompatible(decision: SnapDecision): boolean {
  return decision.kind === "prompt";
}

export function classifyClickOnNetwork(
  click: LngLat,
  ways: OsmWay[],
  mode: TransportMode,
): CompatibilityResult | null {
  const hits = rankWaysNearClick(click, ways, mode, EDITOR_OSM_SNAP_RADIUS_M);
  if (hits.length === 0) return null;
  return hits[0].classification;
}

export function preferCompatibleHit(
  click: LngLat,
  ways: OsmWay[],
  mode: TransportMode,
) {
  const hits = rankWaysNearClick(click, ways, mode, EDITOR_OSM_SNAP_RADIUS_M);
  return hits.find((h) => isPreferredSnapTarget(h.classification.cls)) ?? hits[0] ?? null;
}

export { decideEditorSnap, rankWaysNearClick };
