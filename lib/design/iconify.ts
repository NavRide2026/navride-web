/** Cliente de la API pública oficial de Iconify (sin API key, sin scraping). */

const API_BASE = "https://api.iconify.design";
const BROWSE_BASE = "https://icon-sets.iconify.design";

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

/** SVG renderizado por la API oficial. El color se fija para el tema oscuro. */
export function iconThumbnailUrl(
  id: string,
  { height = 64, color = "#e4e4e7" }: { height?: number; color?: string } = {},
): string {
  const [prefix, name] = id.split(":");
  if (!prefix || !name) return "";
  return `${API_BASE}/${prefix}/${name}.svg?height=${height}&color=${encodeURIComponent(color)}`;
}

export function iconSourceUrl(id: string): string {
  const [prefix, name] = id.split(":");
  return `${BROWSE_BASE}/${prefix}/${name}/`;
}

export async function searchIcons(
  query: string,
  { limit = 32, signal }: { limit?: number; signal?: AbortSignal } = {},
): Promise<IconifyResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `${API_BASE}/search?query=${encodeURIComponent(trimmed)}&limit=${limit}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`ICONIFY_${res.status}`);

  const payload = (await res.json()) as IconifySearchResponse;
  const collections = payload.collections ?? {};

  return (payload.icons ?? []).flatMap((id) => {
    const [prefix, name] = id.split(":");
    if (!prefix || !name) return [];
    const collection = collections[prefix];
    return [
      {
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
      },
    ];
  });
}
