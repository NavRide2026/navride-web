"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, AlertTriangle } from "lucide-react";

// ─── Categorías ────────────────────────────────────────────────────────────────
const CATEGORY: Record<string, { color: string; icon: string; label: string }> = {
  Bloqueo:   { color: "#ef4444", icon: "🚧", label: "Bloqueo"   },
  Terreno:   { color: "#eab308", icon: "⚠️",  label: "Terreno"   },
  Seguridad: { color: "#3b82f6", icon: "🛡",  label: "Seguridad" },
  Tráfico:   { color: "#f97316", icon: "🚗",  label: "Tráfico"   },
};
const DEFAULT_CAT = { color: "#a855f7", icon: "📍", label: "Aviso" };
const CATEGORIES   = Object.keys(CATEGORY);

// ─── Estilo OSM raster inline ──────────────────────────────────────────────────
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

interface PendingAlert {
  lat: number;
  lng: number;
}

// ─── Componente ────────────────────────────────────────────────────────────────
export default function MapaEnVivoPage() {
  const containerRef  = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef        = useRef<any>(null);
  const markersRef    = useRef<Map<string, unknown>>(new Map());

  const [count, setCount]               = useState(0);
  const [connected, setConnected]       = useState(false);
  const [error, setError]               = useState<string | null>(null);

  // Panel de nuevo aviso
  const [pending, setPending]           = useState<PendingAlert | null>(null);
  const [newCategory, setNewCategory]   = useState(CATEGORIES[0]);
  const [newDesc, setNewDesc]           = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [submitMsg, setSubmitMsg]       = useState<{ ok: boolean; text: string } | null>(null);
  const [reportMode, setReportMode]     = useState(false);

  // ── addMarker / removeMarker (refs para evitar stale closures en RT) ─────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addMarkerFn = useRef<(alert: RouteAlert) => void>(() => {});
  const removeMarkerFn = useRef<(id: string) => void>(() => {});

  useEffect(() => {
    let cancelled = false;
    let channelCleanup: (() => void) | null = null;

    async function boot() {
      if (!containerRef.current) return;

      const ml = await import("maplibre-gl");
      if (cancelled || !containerRef.current) return;

      const map = new ml.Map({
        container: containerRef.current,
        style:     OSM_STYLE,
        center:    [-3.7038, 40.4168],
        zoom:      6,
      });
      mapRef.current = map;

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

      // Exponer vía refs para que el submit handler pueda usarlos
      addMarkerFn.current    = addMarker;
      removeMarkerFn.current = removeMarker;

      // ── Click en mapa en modo "reportar" ──
      map.on("click", (e: { lngLat: { lat: number; lng: number } }) => {
        // El estado reportMode se lee desde el ref para evitar stale closure
        setPending({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      });

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
                if (a.is_active) addMarkerFn.current(a);
              } else if (payload.eventType === "UPDATE") {
                const a = payload.new as RouteAlert;
                removeMarkerFn.current(a.id);
                if (a.is_active) addMarkerFn.current(a);
              } else if (payload.eventType === "DELETE") {
                removeMarkerFn.current((payload.old as RouteAlert).id);
              }
            },
          )
          .subscribe((status) => {
            if (!cancelled) setConnected(status === "SUBSCRIBED");
          });

        channelCleanup = () => { void ch.unsubscribe(); };
      } catch {
        // Sin Realtime si faltan vars
      }
    }

    boot().catch(console.error);

    return () => {
      cancelled = true;
      channelCleanup?.();
      mapRef.current?.remove();
      markersRef.current.clear();
    };
  }, []);

  // ── Enviar nuevo aviso ────────────────────────────────────────────────────────
  const handleSubmitAlert = useCallback(async () => {
    if (!pending || !newDesc.trim()) return;
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const supabase = createClient();
      const { error: insertErr } = await supabase.from("route_alerts").insert({
        latitude:       pending.lat,
        longitude:      pending.lng,
        alert_category: newCategory,
        description:    newDesc.trim(),
        is_active:      true,
      });
      if (insertErr) throw insertErr;
      setSubmitMsg({ ok: true, text: "Aviso publicado. Aparecerá en el mapa ahora." });
      setNewDesc("");
      setTimeout(() => {
        setPending(null);
        setSubmitMsg(null);
        setReportMode(false);
      }, 1800);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setSubmitMsg({ ok: false, text: `No se pudo publicar: ${msg}` });
    }
    setSubmitting(false);
  }, [pending, newCategory, newDesc]);

  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 80px)", marginTop: "80px" }}>

      {/* Canvas del mapa */}
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

      {/* Cursor crosshair en modo reporte */}
      {reportMode && (
        <div
          style={{ position: "absolute", inset: 0, cursor: "crosshair", zIndex: 5 }}
          className="pointer-events-none"
        />
      )}

      {/* Header flotante */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <div className="bg-[#050608]/90 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-xl">
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

        {/* Botón reportar aviso */}
        <button
          onClick={() => { setReportMode(r => !r); setPending(null); setSubmitMsg(null); }}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border shadow-xl text-sm font-semibold transition-colors ${
            reportMode
              ? "bg-[#f97316] border-[#f97316] text-white"
              : "bg-[#050608]/90 border-white/10 text-white/80 hover:text-white backdrop-blur-md"
          }`}
        >
          <AlertTriangle size={15} />
          {reportMode ? "Cancelar" : "Reportar aviso"}
        </button>
      </div>

      {/* Instrucción modo reporte */}
      {reportMode && !pending && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 bg-[#050608]/90 backdrop-blur-md border border-[#f97316]/40 rounded-2xl px-5 py-3 shadow-xl">
          <p className="text-white text-sm text-center">Haz clic en el mapa para marcar la ubicación del aviso</p>
        </div>
      )}

      {/* Panel formulario nuevo aviso */}
      {pending && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 w-[340px] bg-[#050608]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">Nuevo aviso</h3>
            <button onClick={() => { setPending(null); setSubmitMsg(null); }} className="text-white/40 hover:text-white">
              <X size={16} />
            </button>
          </div>

          <p className="text-white/40 text-xs mb-4">
            📍 {pending.lat.toFixed(5)}, {pending.lng.toFixed(5)}
          </p>

          {/* Selector categoría */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {CATEGORIES.map(cat => {
              const cfg = CATEGORY[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setNewCategory(cat)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors ${
                    newCategory === cat
                      ? "border-white/40 bg-white/10 text-white font-semibold"
                      : "border-white/10 text-white/60 hover:border-white/20"
                  }`}
                >
                  <span>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>

          {/* Descripción */}
          <textarea
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Describe el peligro (ej: barro en curva, carretera cortada…)"
            rows={3}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-white/30 resize-none mb-3"
          />

          {submitMsg && (
            <p className={`text-xs mb-3 ${submitMsg.ok ? "text-green-400" : "text-red-400"}`}>
              {submitMsg.text}
            </p>
          )}

          <button
            onClick={handleSubmitAlert}
            disabled={submitting || !newDesc.trim()}
            className="w-full rounded-full bg-[#f97316] py-2.5 text-white font-semibold text-sm hover:bg-[#f97316]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Publicando…" : "Publicar aviso"}
          </button>
        </div>
      )}

      {/* Leyenda */}
      <div className="absolute bottom-6 left-3 z-10">
        <div className="bg-[#050608]/90 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shadow-xl space-y-2">
          {Object.entries(CATEGORY).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-white/40 shrink-0" style={{ background: cfg.color }} />
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
