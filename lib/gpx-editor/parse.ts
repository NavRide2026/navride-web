import {
  parseCapsuleXml,
  parseExtensionsXml,
} from "../route-studio/navride-route/gpx-codec.ts";
import {
  emptyDocument,
  uid,
  type GpxDocument,
  type GpxPoint,
  type GpxSegment,
  type GpxTrack,
  type GpxWaypoint,
} from "./types.ts";

export type ParseResult = {
  doc: GpxDocument;
  issues: string[];
  recoverable: boolean;
};

function unescapeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return m ? m[1] : null;
}

function inner(body: string, tag: string): string | null {
  const m = body.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  if (!m) return null;
  return unescapeXml(m[1].trim());
}

function parsePoint(open: string, body: string): GpxPoint | null {
  const lat = Number(attr(open, "lat"));
  const lon = Number(attr(open, "lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const eleRaw = inner(body, "ele");
  const ele = eleRaw != null ? Number(eleRaw) : null;
  const ext = body.match(/<extensions\b[^>]*>([\s\S]*?)<\/extensions>/i);
  return {
    lat,
    lon,
    ele: ele != null && Number.isFinite(ele) ? ele : null,
    time: inner(body, "time"),
    name: inner(body, "name"),
    cmt: inner(body, "cmt"),
    desc: inner(body, "desc"),
    extensionsXml: ext ? ext[1] : null,
  };
}

function parseTrkpts(segBody: string): GpxPoint[] {
  const pts: GpxPoint[] = [];
  const re = /<trkpt\b([^>]*)>([\s\S]*?)<\/trkpt>|<trkpt\b([^>]*)\/>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(segBody)) !== null) {
    const open = m[1] ?? m[3] ?? "";
    const body = m[2] ?? "";
    const p = parsePoint(open, body);
    if (p) pts.push(p);
  }
  return pts;
}

function parseRtepts(body: string): GpxPoint[] {
  const pts: GpxPoint[] = [];
  const re = /<rtept\b([^>]*)>([\s\S]*?)<\/rtept>|<rtept\b([^>]*)\/>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const open = m[1] ?? m[3] ?? "";
    const innerBody = m[2] ?? "";
    const p = parsePoint(open, innerBody);
    if (p) pts.push(p);
  }
  return pts;
}

function parseWaypoints(xml: string): GpxWaypoint[] {
  const out: GpxWaypoint[] = [];
  const re = /<wpt\b([^>]*)>([\s\S]*?)<\/wpt>|<wpt\b([^>]*)\/>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const open = m[1] ?? m[3] ?? "";
    const body = m[2] ?? "";
    const lat = Number(attr(open, "lat"));
    const lon = Number(attr(open, "lon"));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const eleRaw = inner(body, "ele");
    const ele = eleRaw != null ? Number(eleRaw) : null;
    const ext = body.match(/<extensions\b[^>]*>([\s\S]*?)<\/extensions>/i);
    out.push({
      id: uid("wpt"),
      lat,
      lon,
      ele: ele != null && Number.isFinite(ele) ? ele : null,
      name: inner(body, "name") || "Waypoint",
      desc: inner(body, "desc") || "",
      cmt: inner(body, "cmt"),
      sym: inner(body, "sym"),
      type: inner(body, "type"),
      time: inner(body, "time"),
      extensionsXml: ext ? ext[1] : null,
    });
  }
  return out;
}

export function parseGpxDocument(xml: string): ParseResult {
  const issues: string[] = [];
  if (!xml || typeof xml !== "string" || !xml.includes("<")) {
    return {
      doc: emptyDocument(),
      issues: ["Archivo vacío o ilegible."],
      recoverable: false,
    };
  }
  const trimmed = xml.trim();
  const metaName = inner(trimmed, "name");
  const metaDesc = inner(
    (trimmed.match(/<metadata\b[^>]*>([\s\S]*?)<\/metadata>/i)?.[1] ?? ""),
    "desc",
  );
  const creator = attr(trimmed.match(/<gpx\b[^>]*>/i)?.[0] ?? "", "creator");

  const tracks: GpxTrack[] = [];
  const trkRe = /<trk\b[^>]*>([\s\S]*?)<\/trk>/gi;
  let tm: RegExpExecArray | null;
  while ((tm = trkRe.exec(trimmed)) !== null) {
    const body = tm[1];
    const segs: GpxSegment[] = [];
    const segRe = /<trkseg\b[^>]*>([\s\S]*?)<\/trkseg>/gi;
    let sm: RegExpExecArray | null;
    while ((sm = segRe.exec(body)) !== null) {
      const pts = parseTrkpts(sm[1]);
      segs.push({ id: uid("seg"), points: pts });
    }
    if (segs.length === 0) {
      const pts = parseTrkpts(body);
      if (pts.length) segs.push({ id: uid("seg"), points: pts });
    }
    tracks.push({
      id: uid("trk"),
      name: inner(body, "name") || metaName || "Track",
      type: inner(body, "type"),
      hidden: false,
      segments: segs.length ? segs : [{ id: uid("seg"), points: [] }],
    });
  }

  if (tracks.length === 0 || tracks.every((t) => t.segments.every((s) => s.points.length === 0))) {
    const rteRe = /<rte\b[^>]*>([\s\S]*?)<\/rte>/gi;
    let rm: RegExpExecArray | null;
    while ((rm = rteRe.exec(trimmed)) !== null) {
      const pts = parseRtepts(rm[1]);
      if (pts.length) {
        tracks.push({
          id: uid("trk"),
          name: inner(rm[1], "name") || metaName || "Ruta",
          hidden: false,
          segments: [{ id: uid("seg"), points: pts }],
        });
      }
    }
  }

  const waypoints = parseWaypoints(trimmed);
  let capsule = null;
  let navrideRoute = null;
  try {
    capsule = parseCapsuleXml(trimmed);
  } catch {
    issues.push("Route Capsule ilegible.");
  }
  try {
    navrideRoute = parseExtensionsXml(trimmed);
  } catch {
    issues.push("Extensiones NavRide ilegibles.");
  }

  const extraExt = trimmed.match(
    /<extensions\b[^>]*>([\s\S]*?)<\/extensions>/i,
  );
  let extraExtensionsXml: string | null = extraExt ? extraExt[1] : null;
  if (extraExtensionsXml) {
    extraExtensionsXml = extraExtensionsXml
      .replace(/<(?:navride:)?route\b[\s\S]*?<\/(?:navride:)?route>/gi, "")
      .replace(/<(?:navride:)?capsule\b[\s\S]*?<\/(?:navride:)?capsule>/gi, "")
      .trim();
    if (!extraExtensionsXml) extraExtensionsXml = null;
  }

  const usable = tracks.some((t) => t.segments.some((s) => s.points.length > 0));
  if (!usable && waypoints.length === 0) {
    issues.push("No se encontraron puntos de track/ruta.");
    return {
      doc: emptyDocument(),
      issues,
      recoverable: false,
    };
  }

  const name =
    (navrideRoute?.name && navrideRoute.name.trim()) ||
    metaName ||
    tracks[0]?.name ||
    "Ruta";

  const doc: GpxDocument = {
    name,
    description: metaDesc || "",
    creator: creator || "NavRide GPX Editor",
    waypoints,
    tracks: tracks.length
      ? tracks
      : [
          {
            id: uid("trk"),
            name,
            hidden: false,
            segments: [{ id: uid("seg"), points: [] }],
          },
        ],
    originalXml: trimmed,
    dirty: false,
    capsule,
    navrideRoute,
    extraExtensionsXml,
  };

  if (doc.tracks.reduce((n, t) => n + t.segments.reduce((m, s) => m + s.points.length, 0), 0) < 2) {
    issues.push("Geometría parcial: menos de 2 puntos.");
  }

  return { doc, issues, recoverable: true };
}
