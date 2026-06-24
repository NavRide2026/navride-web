export type GpxRouteRow = {
  id: string;
  title: string;
  storage_url: string;
  distance_m: number | null;
  waypoints_count: number | null;
  created_at: string;
  is_public: boolean;
};

export function formatDistanceM(m: number | null | undefined): string {
  if (m == null || !Number.isFinite(m)) return "—";
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}

export function formatRouteDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
