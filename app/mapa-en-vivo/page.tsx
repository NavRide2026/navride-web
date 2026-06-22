"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, AlertTriangle, List, Map as MapIcon, ChevronRight, LocateFixed } from "lucide-react";

// ─── Catálogo (paridad con Flutter RouteAlertCatalog) ──────────────────────────
const CATALOG = {
  Bloqueo:   { color: "#ef4444", icon: "🚧", label: "Bloqueos",  types: [
    { id: "obras",      label: "Obras",              icon: "🚧" },
    { id: "accidente",  label: "Accidente",           icon: "💥" },
    { id: "corte_via",  label: "Corte de vía",        icon: "⛔" },
    { id: "desvio",     label: "Desvío obligatorio",  icon: "↪" },
  ]},
  Terreno:   { color: "#eab308", icon: "⚠️",  label: "Terreno",   types: [
    { id: "barro",      label: "Barro",               icon: "🟤" },
    { id: "hielo",      label: "Hielo",               icon: "🧊" },
    { id: "piedras",    label: "Piedras sueltas",      icon: "🪨" },
    { id: "bache",      label: "Bache profundo",       icon: "🕳" },
  ]},
  Seguridad: { color: "#3b82f6", icon: "🛡",  label: "Seguridad", types: [
    { id: "animal",     label: "Animal en vía",        icon: "🦌" },
    { id: "desnivel",   label: "Desnivel",             icon: "⛰" },
    { id: "rocas",      label: "Caída de rocas",       icon: "🪨" },
    { id: "visibilidad",label: "Visibilidad reducida", icon: "🌫" },
  ]},
  Tráfico:   { color: "#f97316", icon: "🚗",  label: "Tráfico",   types: [
    { id: "lento",      label: "Tráfico lento",        icon: "🐢" },
    { id: "cola",       label: "Cola",                 icon: "🚗" },
    { id: "retencion",  label: "Retención",            icon: "⏱" },
    { id: "interseccion",label:"Peligro en cruce",     icon: "⚠" },
  ]},
} as const;

type CategoryKey = keyof typeof CATALOG;
const CATEGORIES = Object.keys(CATALOG) as CategoryKey[];
const DEFAULT_CAT_KEY: CategoryKey = "Bloqueo";

// ─── Types ────────────────────────────────────────────────────────────────────
interface RouteAlert {
  id: string;
  latitude: number;
  longitude: number;
  alert_category: string;
  alert_type: string;
  description: string | null;
  location_name: string | null;
  created_at: string;
  is_active: boolean;
}

interface PendingDrop { lat: number; lng: number }

// ─── Map style ────────────────────────────────────────────────────────────────
const OSM_STYLE = {
  version: 8 as const,
  sources: { osm: { type: "raster" as const,
    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
    tileSize: 256, attribution: "© OpenStreetMap contributors", maxzoom: 19,
  }},
  layers: [{ id: "osm-tiles", type: "raster" as const, source: "osm" }],
};

// ─── Nominatim reverse geocoding (gratis, sin API key) ────────────────────────
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1&accept-language=es`,
      { headers: { "User-Agent": "NavRide/1.0 (navride@outlook.com)" } },
    );
    if (!res.ok) return fallbackCoords(lat, lng);
    const data = await res.json();
    const a = data.address ?? {};
    const road = a.road ?? a.path ?? a.track ?? a.footway ?? a.hamlet;
    const city = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county;
    if (road && city) return `${road}, ${city}`;
    if (road) return road;
    if (city) return city;
    const display: string = data.display_name ?? "";
    return display ? display.split(",").slice(0, 2).map((s: string) => s.trim()).join(", ") : fallbackCoords(lat, lng);
  } catch {
    return fallbackCoords(lat, lng);
  }
}
const fallbackCoords = (lat: number, lng: number) => `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

// ─── Helpers de formato ───────────────────────────────────────────────────────
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}
function getTypeLabel(category: string, typeId: string): string {
  const cat = CATALOG[category as CategoryKey];
  if (!cat) return typeId;
  const t = cat.types.find(t => t.id === typeId);
  return t?.label ?? typeId;
}
function getTypeIcon(category: string, typeId: string): string {
  const cat = CATALOG[category as CategoryKey];
  if (!cat) return "📍";
  const t = cat.types.find(t => t.id === typeId);
  return t?.icon ?? cat.icon;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function MapaEnVivoPage() {
  const containerRef  = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef        = useRef<any>(null);
  const markersRef    = useRef<Map<string, unknown>>(new Map());
  const mlRef         = useRef<unknown>(null);

  // Estado global de alertas (SSOT)
  const [alerts, setAlerts]             = useState<RouteAlert[]>([]);
  const [connected, setConnected]       = useState(false);
  const [error, setError]               = useState<string | null>(null);

  // Vista: "map" | "list"
  const [view, setView]                 = useState<"map" | "list">("map");

  // Categoría seleccionada en la vista lista
  const [selCategory, setSelCategory]   = useState<CategoryKey>(DEFAULT_CAT_KEY);

  // Filtro activo en el mapa (null = todos)
  const [mapFilter, setMapFilter]       = useState<CategoryKey | null>(null);

  // Panel de reporte
  const [reportMode, setReportMode]     = useState(false);
  const reportModeRef                   = useRef(false);
  const [pending, setPending]           = useState<PendingDrop | null>(null);
  const [newCategory, setNewCategory]   = useState<CategoryKey>(DEFAULT_CAT_KEY);
  const [newType, setNewType]           = useState<string>(CATALOG[DEFAULT_CAT_KEY].types[0].id);
  const [newDesc, setNewDesc]           = useState("");
  const [showDesc, setShowDesc]         = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [submitMsg, setSubmitMsg]       = useState<{ok:boolean;text:string}|null>(null);

  // Sync newType cuando cambia newCategory
  useEffect(() => {
    setNewType(CATALOG[newCategory].types[0].id);
  }, [newCategory]);

  // ── Funciones de marcadores (refs para evitar stale closures) ────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addMarkerFn    = useRef<(a: RouteAlert) => void>(() => {});
  const removeMarkerFn = useRef<(id: string) => void>(() => {});

  // ── Boot del mapa ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    let channelCleanup: (() => void) | null = null;

    async function boot() {
      if (!containerRef.current) return;
      const ml = await import("maplibre-gl");
      if (cancelled || !containerRef.current) return;
      mlRef.current = ml;

      const map = new ml.Map({
        container: containerRef.current,
        style: OSM_STYLE,
        center: [-3.7038, 40.4168],
        zoom: 6,
      });
      mapRef.current = map;

      // ── Helpers marcadores ──
      function addMarker(alert: RouteAlert) {
        if (!map || markersRef.current.has(alert.id)) return;
        const cfg = CATALOG[alert.alert_category as CategoryKey] ?? { color: "#a855f7", icon: "📍", label: "Aviso" };
        const typeIcon = getTypeIcon(alert.alert_category, alert.alert_type);

        const el = document.createElement("div");
        Object.assign(el.style, {
          width: "38px", height: "38px",
          background: cfg.color,
          border: "3px solid white",
          borderRadius: "50%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.55)",
          transition: "transform .15s",
        });
        el.textContent = typeIcon;
        el.onmouseenter = () => { el.style.transform = "scale(1.2)"; };
        el.onmouseleave = () => { el.style.transform = "scale(1)"; };

        const locationText = alert.location_name || fallbackCoords(alert.latitude, alert.longitude);
        const typeLabel = getTypeLabel(alert.alert_category, alert.alert_type);
        const timeStr = alert.created_at ? formatTime(alert.created_at) : "";
        const dateStr = alert.created_at ? formatDate(alert.created_at) : "";

        const popup = new ml.Popup({ offset: 20, maxWidth: "280px" })
          .setHTML(`
            <div style="font-family:system-ui,sans-serif;padding:6px 2px 2px">
              <span style="display:inline-flex;align-items:center;gap:6px;background:${cfg.color};
                color:#fff;border-radius:20px;padding:3px 12px;font-size:11px;
                font-weight:700;letter-spacing:.4px;margin-bottom:8px">
                ${typeIcon} ${typeLabel.toUpperCase()}
              </span>
              <div style="display:flex;align-items:center;gap:4px;margin-bottom:6px">
                <span style="font-size:11px;color:#999">📍</span>
                <span style="font-size:12px;color:#333;font-weight:500">${locationText}</span>
              </div>
              <p style="margin:0 0 4px;font-size:12px;color:#666;line-height:1.45">
                A las ${timeStr} se ha reportado ${typeLabel} en ${locationText}
              </p>
              ${alert.description ? `<p style="margin:4px 0 0;font-size:11px;color:#888;font-style:italic">${alert.description}</p>` : ""}
              <p style="margin:6px 0 0;font-size:10px;color:#bbb">${dateStr}</p>
            </div>
          `);

        const marker = new ml.Marker({ element: el })
          .setLngLat([alert.longitude, alert.latitude])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.set(alert.id, marker);
      }

      function removeMarker(id: string) {
        const m = markersRef.current.get(id) as { remove?: () => void } | undefined;
        m?.remove?.();
        markersRef.current.delete(id);
      }

      addMarkerFn.current    = addMarker;
      removeMarkerFn.current = removeMarker;

      // ── Click: solo en modo reporte ──
      map.on("click", (e: { lngLat: { lat: number; lng: number } }) => {
        if (!reportModeRef.current) return;
        setPending({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      });

      // ── Carga inicial ──
      map.on("load", async () => {
        if (cancelled) return;
        try {
          const supabase = createClient();
          const { data, error: dbErr } = await supabase
            .from("route_alerts")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(500);
          if (dbErr) throw dbErr;
          const loaded = (data ?? []) as RouteAlert[];
          setAlerts(loaded);
          loaded.forEach(addMarker);
        } catch (e) {
          if (!cancelled) setError("No se pudieron cargar los avisos.");
          console.error(e);
        }
      });

      // ── Realtime: suscripción robusta ──
      try {
        const supabase = createClient();
        const ch = supabase
          .channel("route-alerts-live-v2")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "route_alerts" },
            (payload) => {
              const a = payload.new as RouteAlert;
              if (!a.is_active) return;
              addMarkerFn.current(a);
              setAlerts(prev => {
                if (prev.some(x => x.id === a.id)) return prev;
                return [a, ...prev];
              });
            },
          )
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "route_alerts" },
            (payload) => {
              const a = payload.new as RouteAlert;
              removeMarkerFn.current(a.id);
              if (a.is_active) addMarkerFn.current(a);
              setAlerts(prev => prev.map(x => x.id === a.id ? a : x).filter(x => x.is_active));
            },
          )
          .on(
            "postgres_changes",
            { event: "DELETE", schema: "public", table: "route_alerts" },
            (payload) => {
              const id = (payload.old as RouteAlert).id;
              removeMarkerFn.current(id);
              setAlerts(prev => prev.filter(x => x.id !== id));
            },
          )
          .subscribe((status, err) => {
            if (!cancelled) setConnected(status === "SUBSCRIBED");
            if (err) console.error("[RT] error:", err);
          });
        channelCleanup = () => { void ch.unsubscribe(); };
      } catch (e) {
        console.error("[RT] setup failed:", e);
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

  // ── Filtro de marcadores ─────────────────────────────────────────────────────
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const m = marker as { getElement?: () => HTMLElement };
      const el = m?.getElement?.();
      if (!el) return;
      const alert = alerts.find(a => a.id === id);
      if (!alert) return;
      const visible = mapFilter === null || alert.alert_category === mapFilter;
      el.style.opacity = visible ? "1" : "0.15";
      el.style.pointerEvents = visible ? "auto" : "none";
    });
  }, [mapFilter, alerts]);

  // ── Enviar aviso ─────────────────────────────────────────────────────────────
  const handleSubmitAlert = useCallback(async () => {
    if (!pending) return;
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      // 1. Reverse geocoding antes del INSERT
      const locationName = await reverseGeocode(pending.lat, pending.lng);

      // 2. INSERT con location_name ya resuelta
      const supabase = createClient();
      const payload: Record<string, unknown> = {
        latitude:       pending.lat,
        longitude:      pending.lng,
        alert_category: newCategory,
        alert_type:     newType,
        is_active:      true,
        location_name:  locationName,
      };
      if (newDesc.trim()) payload.description = newDesc.trim();

      const { error: insertErr } = await supabase
        .from("route_alerts")
        .insert(payload);

      if (insertErr) {
        const detail = insertErr.details ? ` (${insertErr.details})` : "";
        setSubmitMsg({ ok: false, text: `Error: ${insertErr.message}${detail}` });
        setSubmitting(false);
        return;
      }
      setSubmitMsg({ ok: true, text: `✅ Aviso publicado en ${locationName}` });
      setNewDesc("");
      setShowDesc(false);
      setTimeout(() => {
        setPending(null);
        setSubmitMsg(null);
        setReportMode(false);
        reportModeRef.current = false;
      }, 2000);
    } catch (e: unknown) {
      setSubmitMsg({ ok: false, text: `Error de red: ${(e as {message?:string})?.message ?? String(e)}` });
    }
    setSubmitting(false);
  }, [pending, newCategory, newType, newDesc]);

  // ── Conteos por categoría ────────────────────────────────────────────────────
  const countByCat = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = alerts.filter(a => a.is_active && a.alert_category === cat).length;
    return acc;
  }, {} as Record<CategoryKey, number>);
  const totalCount = alerts.filter(a => a.is_active).length;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 80px)", marginTop: "80px" }}>

      {/* ── Mapa ── */}
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

      {/* ── Header flotante ── */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center gap-2 flex-wrap">
        {/* Badge total */}
        <div className="bg-[#050608]/90 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-xl">
          <span className="text-white font-semibold text-sm">Avisos</span>
          <span className="rounded-full bg-[#f97316] text-white text-xs font-bold px-2.5 py-0.5 min-w-[22px] text-center">
            {totalCount}
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

        {/* Botón lista */}
        <button
          onClick={() => setView(v => v === "map" ? "list" : "map")}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border shadow-xl text-sm font-semibold transition-colors ${
            view === "list"
              ? "bg-white/15 border-white/30 text-white"
              : "bg-[#050608]/90 border-white/10 text-white/70 hover:text-white backdrop-blur-md"
          }`}
        >
          {view === "list" ? <MapIcon size={15} /> : <List size={15} />}
          {view === "list" ? "Mapa" : "Lista"}
        </button>

        {/* Botón reportar */}
        <button
          onClick={() => {
            setReportMode(r => { reportModeRef.current = !r; return !r; });
            setPending(null); setSubmitMsg(null);
          }}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border shadow-xl text-sm font-semibold transition-colors ${
            reportMode
              ? "bg-[#f97316] border-[#f97316] text-white"
              : "bg-[#050608]/90 border-white/10 text-white/80 hover:text-white backdrop-blur-md"
          }`}
        >
          <AlertTriangle size={15} />
          {reportMode ? "Cancelar" : "Reportar"}
        </button>
      </div>

      {/* ── Filtro de categorías en el mapa ── */}
      {view === "map" && (
        <div className="absolute top-20 left-3 z-10 flex flex-col gap-1.5">
          <button
            onClick={() => setMapFilter(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border shadow transition-colors ${
              mapFilter === null
                ? "bg-white text-[#050608] border-white"
                : "bg-[#050608]/90 border-white/15 text-white/60 hover:text-white backdrop-blur-md"
            }`}
          >
            Todos
          </button>
          {CATEGORIES.map(cat => {
            const cfg = CATALOG[cat];
            const active = mapFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setMapFilter(f => f === cat ? null : cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shadow transition-colors ${
                  active
                    ? "text-white border-white/60"
                    : "bg-[#050608]/90 border-white/15 text-white/60 hover:text-white backdrop-blur-md"
                }`}
                style={active ? { background: cfg.color } : {}}
              >
                <span>{cfg.icon}</span>
                <span>{cfg.label}</span>
                {countByCat[cat] > 0 && (
                  <span className="bg-white/20 rounded-full px-1.5 text-white text-[10px]">
                    {countByCat[cat]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Instrucción modo reporte ── */}
      {reportMode && !pending && view === "map" && (
        <div className="absolute top-[4.5rem] left-1/2 -translate-x-1/2 z-10 bg-[#050608]/90 backdrop-blur-md border border-[#f97316]/40 rounded-2xl px-5 py-3 shadow-xl">
          <p className="text-white text-sm text-center flex items-center gap-2">
            <LocateFixed size={14} className="text-[#f97316] shrink-0" />
            Haz clic en el mapa para marcar la ubicación
          </p>
        </div>
      )}

      {/* ── Panel de reporte ── */}
      {pending && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 w-[360px] bg-[#050608]/97 backdrop-blur-xl border border-white/15 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">Nuevo aviso</h3>
            <button onClick={() => { setPending(null); setSubmitMsg(null); setShowDesc(false); setNewDesc(""); }} className="text-white/40 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <p className="text-white/40 text-xs mb-4 flex items-center gap-1">
            <LocateFixed size={11} />
            {pending.lat.toFixed(5)}, {pending.lng.toFixed(5)}
            <span className="text-[#22c55e] ml-1 text-[10px]">(geocoding al publicar)</span>
          </p>

          {/* Categoría */}
          <p className="text-white/50 text-xs mb-2 font-medium">Categoría</p>
          <div className="grid grid-cols-2 gap-1.5 mb-4">
            {CATEGORIES.map(cat => {
              const cfg = CATALOG[cat];
              return (
                <button key={cat} onClick={() => setNewCategory(cat)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-colors ${
                    newCategory === cat
                      ? "border-white/40 bg-white/10 text-white font-semibold"
                      : "border-white/10 text-white/60 hover:border-white/20"
                  }`}>
                  <span>{cfg.icon}</span><span>{cfg.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tipo dentro de la categoría */}
          <p className="text-white/50 text-xs mb-2 font-medium">Tipo específico</p>
          <div className="grid grid-cols-2 gap-1.5 mb-4">
            {CATALOG[newCategory].types.map(t => (
              <button key={t.id} onClick={() => setNewType(t.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-colors ${
                  newType === t.id
                    ? "border-white/40 bg-white/10 text-white font-semibold"
                    : "border-white/10 text-white/60 hover:border-white/20"
                }`}>
                <span>{t.icon}</span><span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Descripción opcional */}
          <button onClick={() => setShowDesc(v => !v)}
            className="text-white/40 hover:text-white/70 text-xs mb-2 flex items-center gap-1 transition-colors">
            <span>{showDesc ? "▼" : "▶"}</span>
            <span>Añadir detalle (opcional)</span>
          </button>
          {showDesc && (
            <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)}
              placeholder="Ej: barro en curva, carretera cortada…"
              rows={2}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-white/30 resize-none mb-3"
            />
          )}

          {submitMsg && (
            <p className={`text-xs mb-3 break-words leading-5 ${submitMsg.ok ? "text-green-400" : "text-red-400"}`}>
              {submitMsg.text}
            </p>
          )}

          <button onClick={handleSubmitAlert} disabled={submitting}
            className="w-full rounded-full bg-[#f97316] py-2.5 text-white font-semibold text-sm hover:bg-[#f97316]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {submitting ? "Publicando…" : "Publicar aviso"}
          </button>
        </div>
      )}

      {/* ── Panel lista (vista "list") ── */}
      {view === "list" && (
        <div className="absolute inset-0 z-15 bg-[#050608]/98 backdrop-blur-xl flex flex-col pt-[60px]">
          {/* Tabs de categoría */}
          <div className="flex gap-1.5 overflow-x-auto px-4 py-3 border-b border-white/8 scrollbar-hide shrink-0">
            {CATEGORIES.map(cat => {
              const cfg = CATALOG[cat];
              const isActive = selCategory === cat;
              return (
                <button key={cat} onClick={() => setSelCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all shrink-0 ${
                    isActive ? "text-white border-white/50" : "border-white/15 text-white/50 hover:text-white"
                  }`}
                  style={isActive ? { background: cfg.color } : {}}>
                  <span>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                  {countByCat[cat] > 0 && (
                    <span className={`rounded-full px-1.5 text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-white/10 text-white/50"}`}>
                      {countByCat[cat]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Lista de avisos */}
          <div className="flex-1 overflow-y-auto">
            {(() => {
              const filtered = alerts.filter(a => a.is_active && a.alert_category === selCategory);
              if (filtered.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
                    <span className="text-5xl">{CATALOG[selCategory].icon}</span>
                    <p className="text-white text-sm font-medium">Sin avisos de {CATALOG[selCategory].label}</p>
                    <p className="text-white/50 text-xs text-center px-8">Esta zona está despejada.</p>
                  </div>
                );
              }
              return (
                <div className="p-4 space-y-3">
                  {filtered.map(alert => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Leyenda (solo mapa) ── */}
      {view === "map" && (
        <div className="absolute bottom-6 right-3 z-10">
          <div className="bg-[#050608]/90 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shadow-xl space-y-2">
            {CATEGORIES.map(cat => (
              <div key={cat} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border-2 border-white/40 shrink-0"
                  style={{ background: CATALOG[cat].color }} />
                <span className="text-white/70 text-xs">{CATALOG[cat].label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-red-500/90 text-white text-sm px-4 py-2 rounded-xl shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}

// ─── AlertCard (vista lista web) ──────────────────────────────────────────────
function AlertCard({ alert }: { alert: RouteAlert }) {
  const cfg = CATALOG[alert.alert_category as CategoryKey]
    ?? { color: "#a855f7", icon: "📍", label: "Aviso" };
  const typeLabel = getTypeLabel(alert.alert_category, alert.alert_type);
  const typeIcon  = getTypeIcon(alert.alert_category, alert.alert_type);
  const location  = alert.location_name || fallbackCoords(alert.latitude, alert.longitude);
  const timeStr   = alert.created_at ? formatTime(alert.created_at) : "";

  return (
    <div className="bg-[#0f0f11] border border-white/10 rounded-2xl p-4 flex gap-3 items-start">
      {/* Icono */}
      <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 border"
        style={{ background: `${cfg.color}25`, borderColor: `${cfg.color}60` }}>
        {typeIcon}
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-white text-sm font-semibold">{typeLabel}</span>
          <span className="text-white/40 text-xs shrink-0">{timeStr}</span>
        </div>
        <div className="flex items-center gap-1 mb-1.5">
          <span className="text-white/30 text-[11px]">📍</span>
          <span className="text-white/70 text-xs truncate">{location}</span>
        </div>
        <p className="text-white/40 text-[11.5px] leading-relaxed line-clamp-2">
          A las {timeStr} se ha reportado {typeLabel} en {location}
        </p>
      </div>

      <ChevronRight size={14} className="text-white/20 shrink-0 mt-1" />
    </div>
  );
}
