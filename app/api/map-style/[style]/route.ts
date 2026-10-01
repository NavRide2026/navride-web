import {
  buildEditorFallbackStyle,
  normalizeOpenFreeMapStyle,
  type EditorBaseStyleId,
} from "@/lib/route-studio/editor-map-style";

export const runtime = "nodejs";


type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function applyNavRideVectorAuthority(payload: object): object {
  const vectorUrl = process.env.NAVRIDE_VECTOR_SOURCE_URL?.trim();
  if (!vectorUrl) return payload;

  const root = structuredClone(payload) as JsonObject;
  if (!isObject(root.sources)) return payload;
  const sources = root.sources as JsonObject;
  const existing = isObject(sources.openmaptiles)
    ? (sources.openmaptiles as JsonObject)
    : {};

  sources.openmaptiles = {
    ...existing,
    type: "vector",
    url: vectorUrl,
    minzoom: 0,
    maxzoom: 16,
    attribution: "© OpenStreetMap contributors",
  };
  delete (sources.openmaptiles as JsonObject).tiles;

  const datasetId = process.env.NAVRIDE_OSM_DATASET_ID?.trim();
  root.metadata = {
    ...(isObject(root.metadata) ? root.metadata : {}),
    "navride:data-authority": "spain-vector-v1",
    ...(datasetId ? { "navride:dataset-id": datasetId } : {}),
  };
  return root;
}


const SUPPORTED = new Set<EditorBaseStyleId>([
  "liberty",
  "bright",
  "positron",
]);

export async function GET(
  _request: Request,
  context: { params: Promise<{ style: string }> },
) {
  const { style: rawStyle } = await context.params;
  if (!SUPPORTED.has(rawStyle as EditorBaseStyleId)) {
    return Response.json(
      { error: "Unsupported map style" },
      { status: 404 },
    );
  }

  const style = rawStyle as EditorBaseStyleId;
  let payload: object;
  let source = "navride-fallback";

  try {
    const response = await fetch(
      `https://tiles.openfreemap.org/styles/${style}`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
        headers: { accept: "application/json" },
      },
    );
    if (!response.ok) {
      throw new Error(`OpenFreeMap style HTTP ${response.status}`);
    }
    payload = normalizeOpenFreeMapStyle(await response.json(), style);
    source = "openfreemap-complete";
  } catch {
    payload = buildEditorFallbackStyle(style);
  }

  payload = applyNavRideVectorAuthority(payload);

  return Response.json(payload, {
    headers: {
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "X-NavRide-Map-Style": source,
      "X-NavRide-Vector-Authority": process.env.NAVRIDE_VECTOR_SOURCE_URL ? "spain-vector-v1" : "external-fallback",
    },
  });
}
