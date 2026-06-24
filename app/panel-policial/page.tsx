"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface RouteAlert {
  id: string;
  latitude: number;
  longitude: number;
  alert_type: string;
  alert_category: string;
  location_name: string | null;
  created_at: string;
  is_active: boolean;
  votes_down: number;
}

interface Toast {
  id: number;
  text: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const GRAVE_TYPES = ["accidente", "arbol_caido", "animal_muerto", "corte_via", "desvio"];

const TYPE_LABELS: Record<string, string> = {
  accidente:    "Accidente",
  arbol_caido:  "Árbol caído",
  animal_muerto:"Animal en vía",
  corte_via:    "Corte de vía",
  desvio:       "Desvío obligatorio",
};

const TYPE_ICONS: Record<string, string> = {
  accidente:    "💥",
  arbol_caido:  "🌲",
  animal_muerto:"🦌",
  corte_via:    "⛔",
  desvio:       "↪",
};

// ─── Map style OSM ────────────────────────────────────────────────────────────
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

// ─── Sonido de alerta (3 pips Web Audio API) ──────────────────────────────────
function playAlertSound() {
  try {
    const ctx = new AudioContext();
    [0, 250, 500].forEach((offset) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + offset / 1000);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + offset / 1000 + 0.08
      );
      osc.start(ctx.currentTime + offset / 1000);
      osc.stop(ctx.currentTime + offset / 1000 + 0.1);
    });
  } catch {
    // AudioContext no disponible (SSR o política del navegador)
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function coordStr(lat: number, lng: number) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PanelPolicialPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef      = useRef<any>(null);
  const markersRef  = useRef<Map<string, unknown>>(new Map());
  const mlRef       = useRef<unknown>(null);

  const [alerts, setAlerts]       = useState<RouteAlert[]>([]);
  const [newIds, setNewIds]       = useState<Set<string>>(new Set());
  const [toasts, setToasts]       = useState<Toast[]>([]);
  const [connected, setConnected] = useState(false);
  const toastCounter              = useRef(0);

  // ── Helpers de marcadores ─────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addMarkerFn    = useRef<(a: RouteAlert) => void>(() => {});
  const removeMarkerFn = useRef<(id: string) => void>(() => {});

  function pushToast(text: string) {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }

  function markNew(id: string) {
    setNewIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setNewIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 3000);
  }

  // ── Boot del mapa ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    let channelCleanup: (() => void) | null = null;

    async function boot() {
      if (!mapContainerRef.current) return;
      const ml = await import("maplibre-gl");
      if (cancelled || !mapContainerRef.current) return;
      mlRef.current = ml;

      const map = new ml.Map({
        container: mapContainerRef.current,
        style: OSM_STYLE,
        center: [2.154007, 41.390205], // Barcelona
        zoom: 7,
      });
      mapRef.current = map;

      function addMarker(alert: RouteAlert) {
        if (!map || markersRef.current.has(alert.id)) return;
        const el = document.createElement("div");
        Object.assign(el.style, {
          width: "36px",
          height: "36px",
          background: "#dc2626",
          border: "3px solid white",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "15px",
          cursor: "pointer",
          boxShadow: "0 2px 12px rgba(220,38,38,0.6)",
        });
        el.textContent = TYPE_ICONS[alert.alert_type] ?? "⚠";

        const popup = new ml.Popup({ offset: 20, maxWidth: "240px" }).setHTML(`
          <div style="font-family:system-ui,sans-serif;padding:4px 2px">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px">
              ${TYPE_ICONS[alert.alert_type] ?? "⚠"} ${TYPE_LABELS[alert.alert_type] ?? alert.alert_type}
            </div>
            <div style="font-size:11px;color:#555;margin-bottom:2px">
              📍 ${alert.location_name ?? coordStr(alert.latitude, alert.longitude)}
            </div>
            <div style="font-size:10px;color:#999">
              ${formatDate(alert.created_at)} ${formatTime(alert.created_at)}
            </div>
            <div style="font-size:10px;color:#888;margin-top:4px">
              GPS: ${coordStr(alert.latitude, alert.longitude)}
            </div>
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

      // ── Carga inicial ──
      map.on("load", async () => {
        if (cancelled) return;
        const supabase = createClient();
        const { data } = await supabase
          .from("route_alerts")
          .select("*")
          .eq("is_active", true)
          .in("alert_type", GRAVE_TYPES)
          .order("created_at", { ascending: false })
          .limit(200);

        const loaded = (data ?? []) as RouteAlert[];
        setAlerts(loaded);
        loaded.forEach(addMarker);
      });

      // ── Realtime ──
      try {
        const supabase = createClient();
        const ch = supabase
          .channel("panel-policial-realtime")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "route_alerts" },
            (payload) => {
              const a = payload.new as RouteAlert;
              if (!a.is_active) return;
              if (!GRAVE_TYPES.includes(a.alert_type)) return;

              addMarkerFn.current(a);
              setAlerts((prev) => {
                if (prev.some((x) => x.id === a.id)) return prev;
                return [a, ...prev];
              });
              markNew(a.id);
              playAlertSound();
              const label = TYPE_LABELS[a.alert_type] ?? a.alert_type;
              const loc   = a.location_name ?? coordStr(a.latitude, a.longitude);
              pushToast(`⚠ NUEVO: ${label} en ${loc}`);

              // Volar al nuevo marcador
              mapRef.current?.flyTo({
                center: [a.longitude, a.latitude],
                zoom: 12,
                duration: 1200,
              });
            }
          )
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "route_alerts" },
            (payload) => {
              const a = payload.new as RouteAlert;
              removeMarkerFn.current(a.id);
              if (a.is_active && GRAVE_TYPES.includes(a.alert_type)) {
                addMarkerFn.current(a);
              }
              setAlerts((prev) =>
                prev
                  .map((x) => (x.id === a.id ? a : x))
                  .filter((x) => x.is_active && GRAVE_TYPES.includes(x.alert_type))
              );
            }
          )
          .on(
            "postgres_changes",
            { event: "DELETE", schema: "public", table: "route_alerts" },
            (payload) => {
              const id = (payload.old as RouteAlert).id;
              removeMarkerFn.current(id);
              setAlerts((prev) => prev.filter((x) => x.id !== id));
            }
          )
          .subscribe((status, err) => {
            if (!cancelled) setConnected(status === "SUBSCRIBED");
            if (err) console.error("[RT policial]", err);
          });
        channelCleanup = () => { void ch.unsubscribe(); };
      } catch (e) {
        console.error("[RT policial] setup failed:", e);
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

  // ── Gestionar alerta (marcarla como resuelta) ─────────────────────────────
  async function handleResolve(alert: RouteAlert) {
    const supabase = createClient();
    await supabase
      .from("route_alerts")
      .update({ is_active: false })
      .eq("id", alert.id);
    removeMarkerFn.current(alert.id);
    setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#050608", fontFamily: "system-ui,sans-serif" }}>

      {/* ── Toasts ── */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: "#7f1d1d",
              border: "1px solid #dc2626",
              color: "#fca5a5",
              borderRadius: "12px",
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: 600,
              boxShadow: "0 4px 24px rgba(220,38,38,0.4)",
              animation: "fadeInSlide .25s ease",
            }}
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* ── Header ── */}
      <header
        style={{
          background: "#06091a",
          borderBottom: "1px solid #1e3a6e",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: "#1a2a4a",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              border: "2px solid #2a4a8a",
            }}
          >
            🛡
          </div>
          <span
            style={{
              color: "white",
              fontWeight: 700,
              fontSize: 17,
              letterSpacing: "-0.3px",
            }}
          >
            NavRide
          </span>
        </div>
        <span
          style={{
            background: "#1a2a4a",
            border: "1px solid #2a4a8a",
            color: "#93c5fd",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "1px",
            padding: "4px 12px",
            borderRadius: 20,
          }}
        >
          PANEL MOSSOS D&apos;ESQUADRA
        </span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: connected ? "#4ade80" : "#6b7280",
              display: "inline-block",
              boxShadow: connected ? "0 0 6px #4ade80" : "none",
            }}
          />
          <span style={{ color: connected ? "#4ade80" : "#6b7280", fontSize: 11 }}>
            {connected ? "En vivo" : "Conectando…"}
          </span>
          <span
            style={{
              marginLeft: 12,
              background: "#1a1a2e",
              border: "1px solid rgba(220,38,38,0.3)",
              color: "#f87171",
              borderRadius: 8,
              padding: "3px 10px",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {alerts.length} alertas graves
          </span>
        </div>
      </header>

      {/* ── Cuerpo: tabla izquierda + mapa derecha ── */}
      <div style={{ display: "flex", height: "calc(100vh - 65px)" }}>

        {/* ── Tabla ── */}
        <div
          style={{
            width: "480px",
            minWidth: "420px",
            overflowY: "auto",
            borderRight: "1px solid #1e3a6e",
            background: "#070a14",
          }}
        >
          {/* Cabecera de la tabla */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr 1fr 80px",
              gap: 8,
              padding: "10px 16px",
              borderBottom: "1px solid #1e3a6e",
              color: "#475569",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.8px",
              textTransform: "uppercase",
              position: "sticky",
              top: 0,
              background: "#070a14",
              zIndex: 2,
            }}
          >
            <span>Hora</span>
            <span>Tipo</span>
            <span>Ubicación</span>
            <span>Estado</span>
          </div>

          {alerts.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "60%",
                gap: 12,
                opacity: 0.4,
              }}
            >
              <span style={{ fontSize: 40 }}>🛡</span>
              <p style={{ color: "white", fontSize: 13 }}>Sin alertas graves activas</p>
              <p style={{ color: "#94a3b8", fontSize: 11 }}>La vía está despejada.</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const isNew = newIds.has(alert.id);
              return (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  isNew={isNew}
                  onResolve={handleResolve}
                  onFocus={() => {
                    mapRef.current?.flyTo({
                      center: [alert.longitude, alert.latitude],
                      zoom: 14,
                      duration: 900,
                    });
                  }}
                />
              );
            })
          )}
        </div>

        {/* ── Mapa ── */}
        <div ref={mapContainerRef} style={{ flex: 1, position: "relative" }} />
      </div>

      <style>{`
        @keyframes fadeInSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseBorder {
          0%, 100% { border-color: #dc2626; box-shadow: 0 0 0 0 rgba(220,38,38,0.4); }
          50%       { border-color: #f87171; box-shadow: 0 0 0 6px rgba(220,38,38,0); }
        }
        @keyframes activePulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

// ─── Fila de alerta ───────────────────────────────────────────────────────────
function AlertRow({
  alert,
  isNew,
  onResolve,
  onFocus,
}: {
  alert: RouteAlert;
  isNew: boolean;
  onResolve: (a: RouteAlert) => void;
  onFocus: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  const label = TYPE_LABELS[alert.alert_type]  ?? alert.alert_type;
  const icon  = TYPE_ICONS[alert.alert_type]   ?? "⚠";
  const loc   = alert.location_name ?? `${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}`;
  const gps   = `${alert.latitude.toFixed(5)}, ${alert.longitude.toFixed(5)}`;

  return (
    <div
      style={{
        padding: "12px 16px",
        cursor: "pointer",
        background: isNew ? "#1a0a0a" : "transparent",
        animation: isNew ? "pulseBorder 0.5s ease 3" : "none",
        border: isNew ? "1px solid #dc2626" : "1px solid transparent",
        borderBottom: "1px solid #0f172a",
        transition: "background 0.3s",
      }}
      onClick={onFocus}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "80px 1fr 1fr 80px",
          gap: 8,
          alignItems: "center",
        }}
      >
        {/* Hora */}
        <div>
          <div style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 600 }}>
            {formatTime(alert.created_at).slice(0, 5)}
          </div>
          <div style={{ color: "#475569", fontSize: 10 }}>
            {formatDate(alert.created_at)}
          </div>
        </div>

        {/* Tipo */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <div>
            <div style={{ color: "#f1f5f9", fontSize: 12, fontWeight: 600 }}>{label}</div>
            <div style={{ color: "#64748b", fontSize: 10 }}>{alert.alert_category}</div>
          </div>
        </div>

        {/* Ubicación */}
        <div>
          <div
            style={{
              color: "#cbd5e1",
              fontSize: 11,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "130px",
            }}
            title={loc}
          >
            {loc}
          </div>
          <div style={{ color: "#334155", fontSize: 9.5, marginTop: 1 }} title={gps}>
            {gps}
          </div>
        </div>

        {/* Estado + botón gestionar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          {/* Badge ACTIVA pulsante */}
          <span
            style={{
              background: "#7f1d1d",
              color: "#fca5a5",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.6px",
              padding: "2px 7px",
              borderRadius: 20,
              animation: "activePulse 1.4s ease infinite",
            }}
          >
            ACTIVA
          </span>

          {/* Botón gestionar */}
          {!confirming ? (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
              style={{
                background: "#1e3a6e",
                border: "1px solid rgba(59,130,246,0.4)",
                color: "#93c5fd",
                fontSize: 10,
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Gestionar
            </button>
          ) : (
            <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => { onResolve(alert); setConfirming(false); }}
                style={{
                  background: "#1a4a2a",
                  border: "1px solid rgba(34,197,94,0.25)",
                  color: "#4ade80",
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "3px 6px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Resolver
              </button>
              <button
                onClick={() => setConfirming(false)}
                style={{
                  background: "#1a1a2e",
                  border: "1px solid #334155",
                  color: "#94a3b8",
                  fontSize: 9,
                  padding: "3px 5px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
