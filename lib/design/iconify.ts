/** Cliente de la API pública oficial de Iconify (sin API key, sin scraping). */

const HOSTS = [
  "https://api.iconify.design",
  "https://api.simplesvg.com",
  "https://api.unisvg.com",
] as const;
const BROWSE_BASE = "https://icon-sets.iconify.design";

const ES_EN: Record<string, string> = {
  flecha: "arrow",
  moto: "motorcycle",
  coche: "car",
  auto: "car",
  bici: "bicycle",
  bicicleta: "bicycle",
  caminar: "walking",
  velocimetro: "speedometer",
  "velocímetro": "speedometer",
  brujula: "compass",
  "brújula": "compass",
  ubicacion: "location",
  "ubicación": "location",
  mapa: "map",
  navegacion: "navigation",
  "navegación": "navigation",
  boton: "button",
  "botón": "button",
  peligro: "danger",
  aviso: "warning",
  capa: "layers",
  capas: "layers",
  montaña: "mountain",
  montana: "mountain",
  ruta: "route",
};

export type IconifyCollection = {
  name?: string;
  total?: number;
  author?: { name?: string; url?: string };
  license?: { title?: string; spdx?: string; url?: string };
  category?: string;
  palette?: boolean;
};

export type IconifySearchResponse = {
  icons?: string[];
  total?: number;
  limit?: number;
  collections?: Record<string, IconifyCollection>;
};

export type IconifyResult = {
  /** Identificador completo, p. ej. "mdi:arrow-left". */
  id: string;
  prefix: string;
  name: string;
  collectionName: string;
  authorName: string | null;
  authorUrl: string | null;
  licenseTitle: string | null;
  licenseUrl: string | null;
  thumbnailUrl: string;
  sourceUrl: string;
};

function clampLimit(limit: number): number {
  if (limit < 32) return 64;
  if (limit > 999) return 999;
  return limit;
}

/** Split only on first colon — prefixes may contain hyphens. */
export function splitIconId(id: string): { prefix: string; name: string } {
  const i = id.indexOf(":");
  if (i <= 0) return { prefix: "icon", name: id };
  return { prefix: id.slice(0, i), name: id.slice(i + 1) };
}

/** Up to 3 EN-first candidates (Iconify indexes English). */
export function expandQuery(raw: string): string[] {
  const original = raw.trim();
  if (!original) return [];
  const parts = original.toLowerCase().split(/\s+/).filter(Boolean);
  const enTokens: string[] = [];
  for (const p of parts) {
    const mapped = ES_EN[p];
    if (!mapped) enTokens.push(p);
    else enTokens.push(...mapped.split(/\s+/).filter(Boolean));
  }
  const skip = new Set(["blue", "red", "green", "black", "white", "minimal", "digital"]);
  const meaningful = enTokens.filter((t) => t.length >= 3 && !skip.has(t));
  const out: string[] = [];
  const add = (s: string) => {
    const t = s.trim();
    if (!t) return;
    if (!out.some((e) => e.toLowerCase() === t.toLowerCase())) out.push(t);
  };
  if (meaningful.length >= 2) add(meaningful.slice().reverse().join(" "));
  else if (enTokens.length) add(enTokens.join(" "));
  for (const t of meaningful) {
    add(t);
    if (out.length >= 3) break;
  }
  if (out.length < 3) add(original);
  return out.slice(0, 3);
}

/** SVG renderizado por la API oficial. El color se fija para el tema oscuro. */
export function iconThumbnailUrl(
  id: string,
  {
    height = 64,
    color = "#e4e4e7",
    host = HOSTS[0],
  }: { height?: number; color?: string; host?: string } = {},
): string {
  const { prefix, name } = splitIconId(id);
  if (!prefix || !name) return "";
  return `${host}/${encodeURIComponent(prefix)}/${encodeURIComponent(name)}.svg?height=${height}&color=${encodeURIComponent(color)}`;
}

export function iconSourceUrl(id: string): string {
  const { prefix, name } = splitIconId(id);
  return `${BROWSE_BASE}/${prefix}/${name}/`;
}

async function fetchWithFailover(
  pathAndQuery: string,
  signal?: AbortSignal,
): Promise<Response> {
  let lastErr: unknown;
  for (const host of HOSTS) {
    try {
      const res = await fetch(`${host}${pathAndQuery}`, {
        signal,
        headers: { Accept: "application/json", "User-Agent": "NavRide/0.10.77 Web" },
      });
      if (res.ok) return res;
      if (res.status >= 500 || res.status === 429) {
        lastErr = new Error(`ICONIFY_${res.status}`);
        continue;
      }
      throw new Error(`ICONIFY_${res.status}`);
    } catch (e) {
      lastErr = e;
      if (signal?.aborted) throw e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("ICONIFY_UNREACHABLE");
}

export async function searchIcons(
  query: string,
  { limit = 64, signal }: { limit?: number; signal?: AbortSignal } = {},
): Promise<IconifyResult[]> {
  const candidates = expandQuery(query);
  if (!candidates.length) return [];
  const capped = clampLimit(limit);
  const merged = new Map<string, IconifyResult>();

  for (const term of candidates) {
    const res = await fetchWithFailover(
      `/search?query=${encodeURIComponent(term)}&limit=${capped}`,
      signal,
    );
    const payload = (await res.json()) as IconifySearchResponse;
    const collections = payload.collections ?? {};
    for (const id of payload.icons ?? []) {
      if (merged.has(id)) continue;
      const { prefix, name } = splitIconId(id);
      if (!prefix || !name) continue;
      const collection = collections[prefix];
      merged.set(id, {
        id,
        prefix,
        name,
        collectionName: collection?.name ?? prefix,
        authorName: collection?.author?.name ?? null,
        authorUrl: collection?.author?.url ?? null,
        licenseTitle:
          collection?.license?.title ?? collection?.license?.spdx ?? null,
        licenseUrl: collection?.license?.url ?? null,
        thumbnailUrl: iconThumbnailUrl(id),
        sourceUrl: iconSourceUrl(id),
      });
    }
    if (merged.size >= 12) break;
  }

  return [...merged.values()];
}
