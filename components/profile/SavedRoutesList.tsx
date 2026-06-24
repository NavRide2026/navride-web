"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Download, Loader2, MapPin, RefreshCw, Route, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  formatDistanceM,
  formatRouteDate,
  type GpxRouteRow,
} from "@/lib/gpx/gpxRouteTypes";
import { buildRouteDeepLinks, tryOpenNavRideApp } from "@/lib/gpx/saveRouteToCloud";

type Props = {
  showHeader?: boolean;
  compact?: boolean;
};

export default function SavedRoutesList({ showHeader = true, compact = false }: Props) {
  const [routes, setRoutes] = useState<GpxRouteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadRoutes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setRoutes([]);
        setError("Inicia sesión para ver tus rutas guardadas.");
        return;
      }

      const { data, error: qErr } = await supabase
        .from("gpx_routes")
        .select("id, title, storage_url, distance_m, waypoints_count, created_at, is_public")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });

      if (qErr) throw qErr;
      setRoutes((data as GpxRouteRow[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar las rutas.");
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoutes();

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase
        .channel(`profile-gpx-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "gpx_routes",
            filter: `author_id=eq.${user.id}`,
          },
          () => {
            void loadRoutes();
          },
        )
        .subscribe();
    });

    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, [loadRoutes]);

  const handleDelete = async (route: GpxRouteRow) => {
    if (!confirm(`¿Eliminar "${route.title}"?`)) return;
    setDeletingId(route.id);
    try {
      const supabase = createClient();
      const { error: delErr } = await supabase
        .from("gpx_routes")
        .delete()
        .eq("id", route.id);
      if (delErr) throw delErr;
      setRoutes((prev) => prev.filter((r) => r.id !== route.id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo eliminar la ruta.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-white/50 text-sm">
        <Loader2 size={16} className="animate-spin" />
        Cargando rutas…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {showHeader && (
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Route size={16} className="text-[#f97316]" />
            Mis rutas GPX
          </h3>
          <button
            type="button"
            onClick={() => void loadRoutes()}
            className="text-white/40 hover:text-white transition p-1"
            title="Actualizar"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      )}

      {routes.length === 0 ? (
        <div className={`rounded-xl border border-white/10 bg-white/3 text-center ${compact ? "py-8 px-4" : "py-12 px-6"}`}>
          <MapPin size={28} className="mx-auto text-white/20 mb-3" />
          <p className="text-sm text-white/60">Aún no has guardado ninguna ruta.</p>
          <Link
            href="/editor-gpx"
            className="inline-block mt-3 text-sm text-[#f97316] hover:underline"
          >
            Crear ruta en el editor GPX →
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {routes.map((route) => {
            const links = buildRouteDeepLinks(route.id);
            return (
              <li
                key={route.id}
                className="rounded-xl border border-white/10 bg-white/3 px-4 py-3 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{route.title}</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {formatRouteDate(route.created_at)} · {formatDistanceM(route.distance_m)}
                      {route.waypoints_count != null ? ` · ${route.waypoints_count} pts` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDelete(route)}
                    disabled={deletingId === route.id}
                    className="text-white/25 hover:text-red-400 transition shrink-0 p-1"
                    title="Eliminar"
                  >
                    {deletingId === route.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={route.storage_url}
                    download
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-xs text-white/70 hover:text-white hover:border-white/30 transition"
                  >
                    <Download size={12} />
                    GPX
                  </a>
                  <button
                    type="button"
                    onClick={() => tryOpenNavRideApp(route.id)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#f97316]/15 border border-[#f97316]/30 px-3 py-1 text-xs text-[#f97316] hover:bg-[#f97316]/25 transition"
                  >
                    Abrir en app
                  </button>
                  <a
                    href={links.https}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-xs text-white/40 hover:text-white/70 transition"
                  >
                    Enlace
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
