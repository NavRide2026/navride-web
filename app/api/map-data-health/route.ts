export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Probe = {
  configured: boolean;
  reachable: boolean;
  datasetId: string | null;
  datasetMatch: boolean;
  status: number | null;
  error: string | null;
};

async function probe(url: string, expectedDatasetId: string): Promise<Probe> {
  if (!url) {
    return {
      configured: false,
      reachable: false,
      datasetId: null,
      datasetMatch: false,
      status: null,
      error: "NOT_CONFIGURED",
    };
  }

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
      headers: { accept: "application/json" },
    });
    const datasetId = response.headers.get("x-navride-dataset-id");
    return {
      configured: true,
      reachable: response.ok,
      datasetId,
      datasetMatch:
        response.ok &&
        expectedDatasetId.length > 0 &&
        datasetId === expectedDatasetId,
      status: response.status,
      error: response.ok ? null : `HTTP_${response.status}`,
    };
  } catch (error) {
    return {
      configured: true,
      reachable: false,
      datasetId: null,
      datasetMatch: false,
      status: null,
      error: error instanceof Error ? error.message : "PROBE_FAILED",
    };
  }
}

export async function GET() {
  const vectorUrl = process.env.NAVRIDE_VECTOR_SOURCE_URL?.trim() ?? "";
  const routingRoot =
    process.env.NAVRIDE_VALHALLA_URL?.trim().replace(/\/$/, "") ?? "";
  const expectedDatasetId =
    process.env.NAVRIDE_OSM_DATASET_ID?.trim() ?? "";

  const [vector, routing] = await Promise.all([
    probe(vectorUrl, expectedDatasetId),
    probe(routingRoot ? `${routingRoot}/status` : "", expectedDatasetId),
  ]);

  const configured =
    expectedDatasetId.length > 0 &&
    vector.configured &&
    routing.configured;
  const ready =
    configured &&
    vector.reachable &&
    routing.reachable &&
    vector.datasetMatch &&
    routing.datasetMatch;

  return Response.json(
    {
      ok: ready,
      authority: "navride-spain-e2e-v1",
      expectedDatasetId: expectedDatasetId || null,
      vector,
      routing,
    },
    {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
