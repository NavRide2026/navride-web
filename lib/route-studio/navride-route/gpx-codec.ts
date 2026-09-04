import {
  type NavRideLatLon,
  type NavRideRoute,
  parseNavRideRoute,
  routeToJson,
} from "./types.ts";

export const NAVRIDE_GPX_NS = "https://navride.app/ns/gpx/v1";

export type TrackPointInput = {
  lat: number;
  lon: number;
  /** Only written if present — never invent elevations. */
  ele?: number | null;
};

export type ParseGpxResult = {
  geometry: NavRideLatLon[];
  extensions: NavRideRoute | null;
  issues: string[];
  recoverable: boolean;
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTrkpt(p: TrackPointInput): string {
  const lat = Number(p.lat).toFixed(7);
  const lon = Number(p.lon).toFixed(7);
  const hasEle =
    p.ele != null && typeof p.ele === "number" && Number.isFinite(p.ele);
  if (hasEle) {
    return `      <trkpt lat="${lat}" lon="${lon}"><ele>${p.ele}</ele></trkpt>`;
  }
  return `      <trkpt lat="${lat}" lon="${lon}"></trkpt>`;
}

/**
 * Export GPX 1.1 with xmlns:navride and CDATA JSON of NavRideRoute.
 */
export function exportGpxWithExtensions(
  routeJson: NavRideRoute | Record<string, unknown>,
  title: string,
  trackPoints: TrackPointInput[],
): string {
  const route =
    "schemaVersion" in routeJson && "routeId" in routeJson
      ? (routeJson as NavRideRoute)
      : (parseNavRideRoute(routeJson) ??
        ({
          schemaVersion: 1,
          routeId: "export",
          name: title,
          geometry: { points: [] },
          segments: [],
        } as NavRideRoute));

  const payload = JSON.stringify(routeToJson(route));
  const safeTitle = escapeXml(title || route.name || "Ruta");
  const trkpts = trackPoints.map(formatTrkpt).join("\n");
  const wpts = (route.cues ?? [])
    .filter(
      (c) =>
        typeof c.lat === "number" &&
        typeof c.lon === "number" &&
        Number.isFinite(c.lat) &&
        Number.isFinite(c.lon),
    )
    .map((c) => {
      const name = escapeXml(c.title || c.message || c.severity);
      const desc = escapeXml(c.message || "");
      return `  <wpt lat="${Number(c.lat).toFixed(7)}" lon="${Number(c.lon).toFixed(7)}">
    <name>${name}</name>
    <desc>${desc}</desc>
    <type>navride:cue:${escapeXml(c.severity)}</type>
  </wpt>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="NavRide Web Editor" xmlns="http://www.topografix.com/GPX/1/1" xmlns:navride="${NAVRIDE_GPX_NS}">
  <metadata><name>${safeTitle}</name></metadata>
${wpts ? wpts + "\n" : ""}  <trk>
    <name>${safeTitle}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
  <extensions>
    <navride:route><![CDATA[${payload}]]></navride:route>
  </extensions>
</gpx>`;
}

function attr(tag: string, name: string): number | null {
  const re = new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i");
  const m = tag.match(re);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function extractTrackPoints(text: string): NavRideLatLon[] {
  const pts: NavRideLatLon[] = [];
  const re = /<(?:trkpt|rtept|wpt)\b([^>]*)>([\s\S]*?)<\/(?:trkpt|rtept|wpt)>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const open = m[1] ?? "";
    const body = m[2] ?? "";
    const lat = attr(`x ${open}`, "lat");
    const lon = attr(`x ${open}`, "lon");
    if (lat == null || lon == null) continue;
    const pt: NavRideLatLon = { lat, lon };
    const eleM = body.match(/<ele>\s*([^<]+)\s*<\/ele>/i);
    if (eleM) {
      const ele = Number(eleM[1].trim());
      if (Number.isFinite(ele)) pt.ele = ele;
    }
    const nameM = body.match(/<name>\s*([^<]+)\s*<\/name>/i);
    if (nameM) pt.name = nameM[1].trim();
    pts.push(pt);
  }
  // Self-closing / empty body fallback
  if (pts.length === 0) {
    const re2 = /<(?:trkpt|rtept|wpt)\b([^/>]*)\/?>/gi;
    let m2: RegExpExecArray | null;
    while ((m2 = re2.exec(text)) !== null) {
      const open = m2[1] ?? "";
      const lat = attr(`x ${open}`, "lat");
      const lon = attr(`x ${open}`, "lon");
      if (lat == null || lon == null) continue;
      pts.push({ lat, lon });
    }
  }
  return pts;
}

export function parseExtensionsXml(xml: string): NavRideRoute | null {
  const re = /<(?:navride:)?route\b[^>]*>([\s\S]*?)<\/(?:navride:)?route>/i;
  const m = xml.match(re);
  if (!m) return null;
  const body = m[1].trim();
  // Strip CDATA wrapper if present
  const cdata = body.match(/<!\[CDATA\[([\s\S]*?)\]\]>/i);
  const jsonText = (cdata ? cdata[1] : body).trim();
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const map = JSON.parse(jsonMatch[0]) as unknown;
    return parseNavRideRoute(map);
  } catch {
    return null;
  }
}

function extractWaypointsAsCues(text: string): import("./types.ts").NavRideCue[] {
  const cues: import("./types.ts").NavRideCue[] = [];
  const re = /<wpt\b([^>]*)>([\s\S]*?)<\/wpt>/gi;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    const open = m[1] ?? "";
    const body = m[2] ?? "";
    const lat = attr(`x ${open}`, "lat");
    const lon = attr(`x ${open}`, "lon");
    if (lat == null || lon == null) continue;
    const nameM = body.match(/<name[^>]*>([\s\S]*?)<\/name>/i);
    const descM = body.match(/<desc[^>]*>([\s\S]*?)<\/desc>/i);
    const typeM = body.match(/<type[^>]*>([\s\S]*?)<\/type>/i);
    const typeRaw = (typeM?.[1] ?? "").trim().toLowerCase();
    let severity: import("./types.ts").NavRideCueSeverity = "attention";
    if (typeRaw.includes("danger") || typeRaw.includes("peligro")) severity = "danger";
    else if (typeRaw.includes("caution") || typeRaw.includes("precauci")) severity = "caution";
    else if (typeRaw.includes("info")) severity = "info";
    const title = (nameM?.[1] ?? "").trim() || "Waypoint";
    const message = (descM?.[1] ?? "").trim() || title;
    cues.push({
      cueId: `wpt-${i++}`,
      title,
      message,
      severity,
      progressM: null,
      lat,
      lon,
      noteStatus: "on_track",
      category: "note",
      creator: "gpx-wpt",
    });
  }
  return cues;
}

/**
 * Parse GPX text into geometry + optional NavRideRoute extensions.
 * Partial / broken files are recoverable when any track/route points exist.
 */
export function parseGpxFile(text: string): ParseGpxResult {
  const issues: string[] = [];
  if (!text || typeof text !== "string") {
    return {
      geometry: [],
      extensions: null,
      issues: ["Archivo vacío o ilegible."],
      recoverable: false,
    };
  }

  const trimmed = text.trim();
  if (!trimmed.includes("<") || !/gpx/i.test(trimmed)) {
    issues.push("No parece un documento GPX válido.");
  }

  let extensions: NavRideRoute | null = null;
  try {
    extensions = parseExtensionsXml(trimmed);
  } catch {
    issues.push("Extensiones NavRide dañadas o ilegibles.");
    extensions = null;
  }

  if (trimmed.includes("navride:") && !extensions) {
    issues.push("Se detectó xmlns navride pero no se pudo parsear la ruta embebida.");
  }

  // Plain GPX waypoints → user map notes (never turn-by-turn maneuvers).
  const wptCues = extractWaypointsAsCues(trimmed);
  if (wptCues.length > 0) {
    if (!extensions) {
      extensions = {
        schemaVersion: 1,
        routeId: "import-wpt",
        name: "Importado",
        geometry: { points: [] },
        segments: [],
        cues: wptCues,
      };
    } else if (!extensions.cues?.length) {
      extensions = { ...extensions, cues: wptCues };
    }
  }

  const geometry = extractTrackPoints(trimmed);

  if (geometry.length === 0) {
    if (extensions?.geometry?.points?.length) {
      issues.push("Sin trkpt/rtept; usando geometría de extensiones NavRide.");
      return {
        geometry: extensions.geometry.points,
        extensions,
        issues,
        recoverable: true,
      };
    }
    issues.push("No se encontraron puntos de track/ruta.");
    return {
      geometry: [],
      extensions,
      issues,
      recoverable: false,
    };
  }

  if (geometry.length < 2) {
    issues.push("Geometría parcial: menos de 2 puntos.");
  }

  if (!trimmed.includes("</gpx>") && !trimmed.includes("</GPX>")) {
    issues.push("GPX truncado (falta cierre </gpx>).");
  }

  const recoverable = geometry.length >= 1;
  return { geometry, extensions, issues, recoverable };
}
