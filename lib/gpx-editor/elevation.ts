import type { GpxPoint } from "./types.ts";
import { isStaleGeneration } from "./engine.ts";

const OPENTOPO = "https://api.opentopodata.org/v1/aster30m";

export type ElevationResult = {
  ok: boolean;
  points: GpxPoint[];
  generation: number;
  reason?: "timeout" | "network" | "stale";
};

/**
 * Fill missing elevations. Never invents values on failure.
 * Coordinates only — does not send the GPX file.
 */
export async function fillElevations(
  points: GpxPoint[],
  generation: number,
  latest: () => number,
): Promise<ElevationResult> {
  if (points.length === 0) return { ok: true, points, generation };
  const missing = points.filter((p) => p.ele == null || !Number.isFinite(p.ele));
  if (missing.length === 0) return { ok: true, points, generation };

  const locs = missing
    .slice(0, 90)
    .map((p) => `${p.lat.toFixed(6)},${p.lon.toFixed(6)}`)
    .join("|");
  try {
    const res = await fetch(`${OPENTOPO}?locations=${locs}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (isStaleGeneration(generation, latest())) {
      return { ok: false, points, generation, reason: "stale" };
    }
    if (!res.ok) return { ok: false, points, generation, reason: "network" };
    const json = (await res.json()) as {
      results?: { elevation?: number | null }[];
    };
    const results = json.results ?? [];
    let i = 0;
    const out = points.map((p) => {
      if (p.ele != null && Number.isFinite(p.ele)) return p;
      const e = results[i++]?.elevation;
      if (e == null || !Number.isFinite(e)) return p;
      return { ...p, ele: e };
    });
    return { ok: true, points: out, generation };
  } catch {
    if (isStaleGeneration(generation, latest())) {
      return { ok: false, points, generation, reason: "stale" };
    }
    return { ok: false, points, generation, reason: "timeout" };
  }
}
