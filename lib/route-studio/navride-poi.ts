export type PoiCategory =
  | "fuel"
  | "charging"
  | "parking"
  | "workshop"
  | "restaurant"
  | "cafe"
  | "supermarket"
  | "toilets"
  | "drinkingWater";

export const POI_CATEGORIES: { id: PoiCategory; label: string; filter: string }[] = [
  { id: "parking", label: "Parking", filter: `node["amenity"="parking"]` },
  { id: "fuel", label: "Gasolinera", filter: `node["amenity"="fuel"]` },
  { id: "charging", label: "Carga eléctrica", filter: `node["amenity"="charging_station"]` },
  { id: "cafe", label: "Bar / cafetería", filter: `node["amenity"~"^(cafe|bar)$"]` },
  { id: "restaurant", label: "Restaurante", filter: `node["amenity"~"^(restaurant|fast_food)$"]` },
  { id: "workshop", label: "Taller / reparación", filter: `node["shop"~"^(car_repair|tyres|motorcycle|bicycle)$"]` },
  { id: "drinkingWater", label: "Agua potable", filter: `node["amenity"="drinking_water"]` },
  { id: "toilets", label: "Baños", filter: `node["amenity"="toilets"]` },
  { id: "supermarket", label: "Tienda / súper", filter: `node["shop"~"^(supermarket|convenience)$"]` },
];

export const POI_MODE_DEFAULTS: Record<string, PoiCategory[]> = {
  car: ["parking", "fuel", "charging", "restaurant", "cafe", "workshop"],
  moto: ["parking", "fuel", "restaurant", "cafe", "workshop"],
  bike: ["restaurant", "cafe", "drinkingWater", "toilets", "workshop", "supermarket"],
  walk: ["restaurant", "cafe", "drinkingWater", "toilets"],
};

export type NavRidePoi = {
  id: string;
  lat: number;
  lon: number;
  category: PoiCategory;
  name?: string;
  osmId?: number;
};

export function poiTileKey(lat: number, lon: number, z = 12): string {
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (Math.min(85.05112878, Math.max(-85.05112878, lat)) * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  );
  return `${z}/${x}/${y}`;
}

export function overpassPoiQuery(
  cats: PoiCategory[],
  south: number,
  west: number,
  north: number,
  east: number,
): string {
  if (cats.length === 0) return "";
  const filters = cats
    .map((id) => POI_CATEGORIES.find((c) => c.id === id)?.filter)
    .filter(Boolean)
    .map((f) => `${f}(${south},${west},${north},${east});`)
    .join("");
  return `[out:json][timeout:12];(${filters});out tags center;`;
}

export function dedupPois(input: NavRidePoi[]): NavRidePoi[] {
  const seen = new Set<string>();
  const out: NavRidePoi[] = [];
  for (const p of input) {
    const k = p.osmId != null ? `o${p.osmId}` : `${p.lat.toFixed(5)},${p.lon.toFixed(5)},${p.category}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
  }
  return out;
}

export class PoiTileStore {
  private ttlMs: number;
  constructor(ttlMs = 15 * 60_000) {
    this.ttlMs = ttlMs;
  }
  private tiles = new Map<string, { at: number; generation: number; pois: NavRidePoi[] }>();
  generation = 0;

  bump(): number {
    this.generation += 1;
    return this.generation;
  }

  isFresh(key: string, now = Date.now()): boolean {
    const e = this.tiles.get(key);
    return !!e && now - e.at < this.ttlMs;
  }

  put(key: string, pois: NavRidePoi[], generation: number): void {
    this.tiles.set(key, { at: Date.now(), generation, pois });
  }

  getIfCurrent(key: string, generation: number): NavRidePoi[] | null {
    const e = this.tiles.get(key);
    if (!e || e.generation !== generation) return null;
    return e.pois;
  }

  getIfFresh(key: string, now = Date.now()): NavRidePoi[] | null {
    const e = this.tiles.get(key);
    if (!e || now - e.at >= this.ttlMs) return null;
    return e.pois;
  }

  isStale(responseGen: number): boolean {
    return responseGen !== this.generation;
  }
}

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

export async function fetchPoisBbox(
  cats: PoiCategory[],
  south: number,
  west: number,
  north: number,
  east: number,
  generation: number,
  store: PoiTileStore,
): Promise<{ ok: boolean; pois: NavRidePoi[]; generation: number }> {
  const q = overpassPoiQuery(cats, south, west, north, east);
  if (!q) return { ok: true, pois: [], generation };
  const key = poiTileKey((south + north) / 2, (west + east) / 2);
  const cached = store.getIfFresh(key);
  if (cached) return { ok: true, pois: cached, generation };
  if (store.isStale(generation)) return { ok: true, pois: [], generation };
  for (const url of OVERPASS_URLS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: `data=${encodeURIComponent(q)}`,
        signal: AbortSignal.timeout(14000),
      });
      if (!res.ok) continue;
      if (store.isStale(generation)) return { ok: true, pois: [], generation };
      const json = (await res.json()) as {
        elements?: { id?: number; lat?: number; lon?: number; tags?: Record<string, string>; center?: { lat: number; lon: number } }[];
      };
      const pois: NavRidePoi[] = [];
      for (const el of json.elements ?? []) {
        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        if (lat == null || lon == null) continue;
        const cat = classifyPoiTags(el.tags ?? {});
        if (!cat) continue;
        pois.push({
          id: `n${el.id ?? `${lat},${lon}`}`,
          lat,
          lon,
          category: cat,
          name: el.tags?.name,
          osmId: el.id,
        });
      }
      const deduped = dedupPois(pois);
      store.put(key, deduped, generation);
      return { ok: true, pois: deduped, generation };
    } catch {
      /* next */
    }
  }
  return { ok: false, pois: [], generation };
}

export function classifyPoiTags(tags: Record<string, string>): PoiCategory | null {
  const a = (tags.amenity ?? "").toLowerCase();
  const shop = (tags.shop ?? "").toLowerCase();
  if (a === "fuel") return "fuel";
  if (a === "charging_station") return "charging";
  if (a === "parking") return "parking";
  if (shop === "car_repair" || shop === "tyres" || shop === "motorcycle" || shop === "bicycle") {
    return "workshop";
  }
  if (a === "restaurant" || a === "fast_food") return "restaurant";
  if (a === "cafe" || a === "bar") return "cafe";
  if (shop === "supermarket" || shop === "convenience") return "supermarket";
  if (a === "toilets") return "toilets";
  if (a === "drinking_water") return "drinkingWater";
  return null;
}
