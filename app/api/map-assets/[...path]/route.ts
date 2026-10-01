import {
  OPENFREEMAP_UPSTREAM_ORIGIN,
  proxyOpenFreeMapUrls,
} from "@/lib/route-studio/editor-map-style";

export const runtime = "nodejs";

function cacheControlFor(pathname: string): string {
  if (/\.(?:pbf|png|webp|jpg|jpeg)$/i.test(pathname)) {
    return "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000";
  }
  return "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;

  if (
    !Array.isArray(path) ||
    path.length === 0 ||
    path.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    return Response.json({ error: "Invalid map asset path" }, { status: 400 });
  }

  const encodedPath = path.map((segment) => encodeURIComponent(segment)).join("/");
  // OpenFreeMap assets used by the editor do not require query parameters.
  // Never forward Vercel/share/auth query strings to the upstream provider.
  const upstreamUrl = `${OPENFREEMAP_UPSTREAM_ORIGIN}/${encodedPath}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
      headers: {
        accept:
          request.headers.get("accept") ??
          "application/json,application/x-protobuf,image/avif,image/webp,image/png,*/*",
      },
    });

    if (!upstream.ok) {
      return new Response(null, {
        status: upstream.status,
        headers: {
          "Cache-Control": "no-store",
          "X-NavRide-Map-Upstream-Status": String(upstream.status),
        },
      });
    }

    const contentType = upstream.headers.get("content-type") ?? "";

    if (
      contentType.includes("application/json") ||
      contentType.includes("application/vnd.mapbox-vector-tile+json")
    ) {
      const payload = proxyOpenFreeMapUrls(await upstream.json());
      return Response.json(payload, {
        headers: {
          "Cache-Control": cacheControlFor(encodedPath),
          "X-NavRide-Map-Asset": "openfreemap-proxy",
        },
      });
    }

    const body = await upstream.arrayBuffer();
    const headers = new Headers({
      "Cache-Control": cacheControlFor(encodedPath),
      "X-NavRide-Map-Asset": "openfreemap-proxy",
    });

    if (contentType) headers.set("Content-Type", contentType);
    const etag = upstream.headers.get("etag");
    if (etag) headers.set("ETag", etag);

    return new Response(body, {
      status: 200,
      headers,
    });
  } catch {
    return Response.json(
      { error: "Map asset upstream unavailable" },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
          "X-NavRide-Map-Asset": "openfreemap-proxy-error",
        },
      },
    );
  }
}
