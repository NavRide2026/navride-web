import type { LngLat } from "./routing.ts";

export function reverseLngLats(pts: LngLat[]): LngLat[] {
  if (pts.length < 2) return [...pts];
  return [...pts].reverse();
}

export function roundTripLngLats(pts: LngLat[]): LngLat[] {
  if (pts.length < 2) return [...pts];
  return [...pts, ...[...pts].reverse().slice(1)];
}

export function isClosedLngLats(pts: LngLat[], epsilonM = 25): boolean {
  if (pts.length < 3) return false;
  const [a0, a1] = pts[0];
  const [b0, b1] = pts[pts.length - 1];
  const dx = (a0 - b0) * 111320 * Math.cos((a1 * Math.PI) / 180);
  const dy = (a1 - b1) * 111320;
  return Math.hypot(dx, dy) <= epsilonM;
}

export function rotateLoopStart(pts: LngLat[], startIndex: number): LngLat[] {
  if (pts.length < 3) return [...pts];
  let ring = [...pts];
  if (isClosedLngLats(ring)) ring = ring.slice(0, -1);
  if (ring.length === 0) return [...pts];
  const i = Math.max(0, Math.min(startIndex, ring.length - 1));
  return [...ring.slice(i), ...ring.slice(0, i), ring[i]];
}

export function replaceSpan(
  pts: LngLat[],
  fromIdx: number,
  toIdx: number,
  replacement: LngLat[],
): LngLat[] {
  if (pts.length === 0) return [...replacement];
  const a = Math.max(0, Math.min(fromIdx, pts.length - 1));
  const b = Math.max(0, Math.min(toIdx, pts.length - 1));
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return [...pts.slice(0, lo), ...replacement, ...pts.slice(hi + 1)];
}

export function isStaleGeneration(generation: number, latest: number): boolean {
  return generation !== latest;
}
