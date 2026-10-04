export const runtime = "nodejs";
export const maxDuration = 20;

const UPSTREAM =
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium";
const MAX_ZOOM = 15;

function isTileCoord(value: string): boolean {
  return /^\d+$/.test(value);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ z: string; x: string; y: string }> },
) {
  const { z, x, y } = await context.params;
  const yClean = y.replace(/\.png$/i, "");

  if (![z, x, yClean].every(isTileCoord)) {
    return Response.json({ error: "Invalid DEM tile" }, { status: 400 });
  }

  const zoom = Number(z);
  if (!Number.isInteger(zoom) || zoom < 0 || zoom > MAX_ZOOM) {
    return Response.json({ error: "DEM zoom out of range" }, { status: 400 });
  }

  const upstreamUrl = `${UPSTREAM}/${zoom}/${Number(x)}/${Number(yClean)}.png`;

  try {
    const upstream = await fetch(upstreamUrl, {
      cache: "force-cache",
      signal: AbortSignal.timeout(12000),
      headers: { accept: "image/png,*/*" },
    });

    if (!upstream.ok) {
      return new Response(null, {
        status: upstream.status,
        headers: {
          "Cache-Control": "no-store",
          "X-NavRide-DEM": "aws-terrarium-miss",
        },
      });
    }

    const body = await upstream.arrayBuffer();
    const headers = new Headers({
      "Content-Type": "image/png",
      "Cache-Control":
        "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      "X-NavRide-DEM": "aws-terrarium",
    });
    const etag = upstream.headers.get("etag");
    if (etag) headers.set("ETag", etag);

    return new Response(body, { status: 200, headers });
  } catch {
    return Response.json(
      { error: "DEM upstream unavailable" },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
          "X-NavRide-DEM": "aws-terrarium-error",
        },
      },
    );
  }
}
