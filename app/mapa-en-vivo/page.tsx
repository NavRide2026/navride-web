"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Metadata } from "next";

// ─── Categorías ────────────────────────────────────────────────────────────────
const CATEGORY: Record<string, { color: string; icon: string; label: string }> = {
  Bloqueo:   { color: "#ef4444", icon: "🚧", label: "Bloqueo"   },
  Terreno:   { color: "#eab308", icon: "⚠️",  label: "Terreno"   },
  Seguridad: { color: "#3b82f6", icon: "🛡",  label: "Seguridad" },
  Tráfico:   { color: "#f97316", icon: "🚗",  label: "Tráfico"   },
};
const DEFAULT_CAT = { color: "#a855f7", icon: "📍", label: "Aviso" };

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
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef   = useRef<Map<string, unknown>>(new Map());
  const [count, setCount]       = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let mapInstance: { remove: () => void } | null = null;
    let channelCleanup: (() => void) | null = null;

    async function boot() {
      if (!containerRef.current) return;

      // ── CSS MapLibre ──
      if (!document.querySelector("#maplibre-css")) {
        const link = document.createElement("link");
        link.id   = "maplibre-css";
        link.rel  = "stylesheet";
        link.href = "https://unpkg.com/maplibre-gl@5.6.0/dist/maplibre-gl.css";
        document.head.appendChild(link);
      }

      const ml = await import("maplibre-gl");
      if (cancelled || !containerRef.current) return;

      // ── Mapa ──
      const map = new ml.Map({
        container: containerRef.current,
        style:     "https://tiles.openfreemap.org/styles/liberty",
        center:    [-3.7038, 40.4168],
        zoom:      6,
      });
      mapInstance = map;

      // ── Helpers marcadores ──
      function addMarker(alert: RouteAlert) {
        if (!map || markersRef.current.has(alert.id)) return;
        const cfg = CATEGORY[alert.alert_category] ?? DEFAULT_CAT;

        const el = document.createElement("div");
        el.style.cssText = [
          "width:36px;height:36px;",
          `background:${cfg.color};`,
          "border:3px solid white;",
          "border-radius:50%;",
          "cursor:pointer;",
          "display:flex;align-items:center;justify-content:center;",
          "font-size:15px;",
          "box-shadow:0 2px 12px rgba(0,0,0,0.55);",
          "transition:transform .15s;",
        ].join("");
        el.onmouseenter = () => { el.style.transform = "scale(1.18)"; };
        el.onmouseleave = () => { el.style.transform = "scale(1)"; };
        el.textContent = cfg.icon;

        const fecha = new Date(alert.created_at).toLocaleDateString("es-ES", {
          day: "2-digit", month: "short", year: "numeric",
        });

        const popup = new ml.Popup({ offset: 20, maxWidth: "300px", closeButton: true })
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
        // Supabase env vars missing — mapa sigue funcionando sin RT
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
    <div className="relative w-full h-screen">
      {/* Mapa */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Header flotante */}
      <div className="absolute top-20 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto bg-[#050608]/90 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-xl">
          <span className="text-white font-semibold text-sm">Avisos en ruta</span>
          <span className="rounded-full bg-[#f97316] text-white text-xs font-bold px-2.5 py-0.5 min-w-[22px] text-center">
            {count}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-white/30"}`}
              style={connected ? { boxShadow: "0 0 6px #4ade80" } : {}}
            />
            <span className="text-white/50 text-xs">{connected ? "En vivo" : "Conectando…"}</span>
          </span>
        </div>
      </div>

      {/* Leyenda */}
      <div className="absolute bottom-8 left-4 z-10">
        <div className="bg-[#050608]/90 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shadow-xl space-y-2 min-w-[160px]">
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
        <div className="absolute top-36 left-1/2 -translate-x-1/2 z-20 bg-red-500/90 text-white text-sm px-4 py-2 rounded-xl shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
