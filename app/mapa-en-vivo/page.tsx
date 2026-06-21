"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ─── Categorías ────────────────────────────────────────────────────────────────
const CATEGORY: Record<string, { color: string; icon: string; label: string }> = {
  Bloqueo:   { color: "#ef4444", icon: "🚧", label: "Bloqueo"   },
  Terreno:   { color: "#eab308", icon: "⚠️",  label: "Terreno"   },
  Seguridad: { color: "#3b82f6", icon: "🛡",  label: "Seguridad" },
  Tráfico:   { color: "#f97316", icon: "🚗",  label: "Tráfico"   },
};
const DEFAULT_CAT = { color: "#a855f7", icon: "📍", label: "Aviso" };

// ─── Estilo OSM raster inline — no depende de URLs externas de estilos ─────────
const OSM_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [{ id: "osm-tiles", type: "raster" as const, source: "osm" }],
};

interface RouteAlert {
  id: string;
  latitude: number;
  longitude: number;
  alert_category: string;
  description: string;
  created_at: string;
  is_active: boolean;
}

// ─── Componente ────────────────────────────────────────────────────────────────
export default function MapaEnVivoPage() {
  const containerRef  = useRef<HTMLDivElement>(null);
  const markersRef    = useRef<Map<string, unknown>>(new Map());
  const [count, setCount]         = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let mapInstance: { remove: () => void } | null = null;
    let channelCleanup: (() => void) | null = null;

    async function boot() {
      if (!containerRef.current) return;

      const ml = await import("maplibre-gl");
      if (cancelled || !containerRef.current) return;

      // ── Mapa con estilo OSM raster garantizado ──
      const map = new ml.Map({
        container: containerRef.current,
        style:     OSM_STYLE,
        center:    [-3.7038, 40.4168],
        zoom:      6,
      });
      mapInstance = map;

      // ── Helpers marcadores ──
      function addMarker(alert: RouteAlert) {
        if (!map || markersRef.current.has(alert.id)) return;
        const cfg = CATEGORY[alert.alert_category] ?? DEFAULT_CAT;

        const el = document.createElement("div");
        Object.assign(el.style, {
          width: "36px", height: "36px",
          background: cfg.color,
          border: "3px solid white",
          borderRadius: "50%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "15px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.55)",
          transition: "transform .15s",
        });
        el.textContent = cfg.icon;
        el.onmouseenter = () => { el.style.transform = "scale(1.18)"; };
        el.onmouseleave = () => { el.style.transform = "scale(1)"; };

        const fecha = new Date(alert.created_at).toLocaleDateString("es-ES", {
          day: "2-digit", month: "short", year: "numeric",
        });

        const popup = new ml.Popup({ offset: 20, maxWidth: "300px" })
          .setHTML(`
            <div style="font-family:system-ui,sans-serif;padding:6px 4px 2px">
              <span style="display:inline-block;background:${cfg.color};color:#fff;
                border-radius:20px;padding:2px 12px;font-size:11px;
                font-weight:700;letter-spacing:.4px;margin-bottom:8px">
                ${cfg.label.toUpperCase()}
              </span>
              <p style="margin:0 0 6px;font-size:14px;color:#111;line-height:1.45">
                ${alert.description}
              </p>
              <p style="margin:0;font-size:11px;color:#999">${fecha}</p>
            </div>
          `);

        const marker = new ml.Marker({ element: el })
          .setLngLat([alert.longitude, alert.latitude])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.set(alert.id, marker);
        setCount(markersRef.current.size);
      }

      function removeMarker(id: string) {
        const m = markersRef.current.get(id) as { remove?: () => void } | undefined;
        m?.remove?.();
        markersRef.current.delete(id);
        setCount(markersRef.current.size);
      }

      // ── Datos iniciales ──
      map.on("load", async () => {
        if (cancelled) return;
        try {
          const supabase = createClient();
          const { data, error: dbErr } = await supabase
            .from("route_alerts")
            .select("*")
            .eq("is_active", true);
          if (dbErr) throw dbErr;
          (data ?? []).forEach(addMarker);
        } catch (e) {
          if (!cancelled) setError("No se pudieron cargar los avisos.");
          console.error(e);
        }
      });

      // ── Tiempo real ──
      try {
        const supabase = createClient();
        const ch = supabase
          .channel("route-alerts-live")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "route_alerts" },
            (payload) => {
              if (payload.eventType === "INSERT") {
                const a = payload.new as RouteAlert;
                if (a.is_active) addMarker(a);
              } else if (payload.eventType === "UPDATE") {
                const a = payload.new as RouteAlert;
                removeMarker(a.id);
                if (a.is_active) addMarker(a);
              } else if (payload.eventType === "DELETE") {
                removeMarker((payload.old as RouteAlert).id);
              }
            },
          )
          .subscribe((status) => {
            if (!cancelled) setConnected(status === "SUBSCRIBED");
          });

        channelCleanup = () => { void ch.unsubscribe(); };
      } catch {
        // Sin Realtime si faltan vars — mapa sigue funcionando
      }
    }

    boot().catch(console.error);

    return () => {
      cancelled = true;
      channelCleanup?.();
      mapInstance?.remove();
      markersRef.current.clear();
    };
  }, []);

  return (
    // h-[calc(100vh-80px)] descuenta el navbar fijo (h-20 = 80px en md+)
    <div className="relative w-full" style={{ height: "calc(100vh - 80px)", marginTop: "80px" }}>

      {/* Canvas del mapa — rellena el contenedor completamente */}
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

      {/* Header flotante */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-[#050608]/90 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-xl">
          <span className="text-white font-semibold text-sm">Avisos en ruta</span>
          <span className="rounded-full bg-[#f97316] text-white text-xs font-bold px-2.5 py-0.5 min-w-[22px] text-center">
            {count}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${connected ? "bg-green-400" : "bg-white/30"}`}
              style={connected ? { boxShadow: "0 0 6px #4ade80" } : {}}
            />
            <span className="text-white/50 text-xs whitespace-nowrap">
              {connected ? "En vivo" : "Conectando…"}
            </span>
          </span>
        </div>
      </div>

      {/* Leyenda */}
      <div className="absolute bottom-6 left-3 z-10">
        <div className="bg-[#050608]/90 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shadow-xl space-y-2">
          {Object.entries(CATEGORY).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full border-2 border-white/40 shrink-0"
                style={{ background: cfg.color }}
              />
              <span className="text-white/70 text-xs">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-red-500/90 text-white text-sm px-4 py-2 rounded-xl shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
