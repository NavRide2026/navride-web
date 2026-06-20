"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Trash2, Undo2, Download, Upload, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type LngLat = [number, number]; // [lng, lat]

const STYLE_URL = "https://demotiles.maplibre.org/style.json";
const LINE_COLOR = "#f97316";
const SOURCE_ID = "route-source";
const LINE_LAYER_ID = "route-line";
const POINTS_LAYER_ID = "route-points";

function haversineKm(a: LngLat, b: LngLat): number {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(x));
}

function totalKm(points: LngLat[]): number {
  let d = 0;
  for (let i = 1; i < points.length; i++) d += haversineKm(points[i - 1], points[i]);
  return d;
}

function generateGpx(points: LngLat[], title: string): string {
  const wpts = points
    .map(([lng, lat]) => `  <wpt lat="${lat}" lon="${lng}"><ele>0</ele></wpt>`)
    .join("\n");
  const trkpts = points
    .map(([lng, lat]) => `      <trkpt lat="${lat}" lon="${lng}"><ele>0</ele></trkpt>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="NavRide Web Editor">
  <metadata><name>${title}</name></metadata>
${wpts}
  <trk><name>${title}</name><trkseg>
${trkpts}
  </trkseg></trk>
</gpx>`;
}

function buildGeojson(points: LngLat[]) {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "LineString", coordinates: points },
        properties: {},
      },
      ...points.map((p) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: p },
        properties: {},
      })),
    ],
  };
}

export default function GpxEditor() {
  const mapContainer = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const [points, setPoints] = useState<LngLat[]>([]);
  const [routeTitle, setRouteTitle] = useState("Mi ruta NavRide");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  // Init map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Inject maplibre CSS
    if (!document.getElementById("maplibre-css")) {
      const link = document.createElement("link");
      link.id = "maplibre-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css";
      document.head.appendChild(link);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any;

    import("maplibre-gl").then((maplibre) => {
      map = new maplibre.Map({
        container: mapContainer.current!,
        style: STYLE_URL,
        center: [-3.7, 40.4],
        zoom: 5,
      });

      map.on("load", () => {
        map.addSource(SOURCE_ID, {
          type: "geojson",
          data: buildGeojson([]),
        });

        map.addLayer({
          id: LINE_LAYER_ID,
          type: "line",
          source: SOURCE_ID,
          filter: ["==", ["geometry-type"], "LineString"],
          paint: {
            "line-color": LINE_COLOR,
            "line-width": 3,
            "line-opacity": 0.9,
          },
        });

        map.addLayer({
          id: POINTS_LAYER_ID,
          type: "circle",
          source: SOURCE_ID,
          filter: ["==", ["geometry-type"], "Point"],
          paint: {
            "circle-radius": 5,
            "circle-color": LINE_COLOR,
            "circle-stroke-color": "#fff",
            "circle-stroke-width": 1.5,
          },
        });

        mapRef.current = map;
      });

      map.on("click", (e: { lngLat: { lng: number; lat: number } }) => {
        const { lng, lat } = e.lngLat;
        setPoints((prev) => {
          const next: LngLat[] = [...prev, [lng, lat]];
          if (mapRef.current) {
            mapRef.current.getSource(SOURCE_ID)?.setData(buildGeojson(next));
          }
          return next;
        });
      });
    });

    return () => {
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  const handleUndo = useCallback(() => {
    setPoints((prev) => {
      const next = prev.slice(0, -1);
      if (mapRef.current) {
        mapRef.current.getSource(SOURCE_ID)?.setData(buildGeojson(next));
      }
      return next;
    });
  }, []);

  const handleClear = useCallback(() => {
    setPoints([]);
    if (mapRef.current) {
      mapRef.current.getSource(SOURCE_ID)?.setData(buildGeojson([]));
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (points.length < 2) return;
    const gpx = generateGpx(points, routeTitle);
    const blob = new Blob([gpx], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${routeTitle.replace(/\s+/g, "_")}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  }, [points, routeTitle]);

  const handleUploadToNavRide = useCallback(async () => {
    if (points.length < 2) return;
    setUploading(true);
    setUploadMsg(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUploadMsg("Necesitas iniciar sesión para enviar rutas a NavRide.");
        setUploading(false);
        return;
      }

      const gpx = generateGpx(points, routeTitle);
      const blob = new Blob([gpx], { type: "application/gpx+xml" });
      const fileName = `${user.id}/${Date.now()}_${routeTitle.replace(/\s+/g, "_")}.gpx`;

      const { error: uploadError } = await supabase.storage
        .from("gpx")
        .upload(fileName, blob, { contentType: "application/gpx+xml" });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("gpx")
        .getPublicUrl(fileName);

      await supabase.from("gpx_routes").insert({
        user_id: user.id,
        name: routeTitle,
        file_url: urlData.publicUrl,
        waypoints_count: points.length,
        distance_km: Math.round(totalKm(points) * 100) / 100,
      });

      setUploadMsg("✓ Ruta enviada a NavRide App con éxito.");
    } catch (err) {
      console.error(err);
      setUploadMsg("Error al subir la ruta. Inténtalo de nuevo.");
    }

    setUploading(false);
  }, [points, routeTitle]);

  const km = totalKm(points);

  return (
    <div className="flex flex-col md:flex-row flex-1 h-full overflow-hidden">
      {/* Map */}
      <div ref={mapContainer} className="flex-1 h-64 md:h-full" />

      {/* Panel */}
      <aside className="w-full md:w-80 flex flex-col bg-[#0a0a0a] border-t md:border-t-0 md:border-l border-white/8 overflow-y-auto shrink-0">
        <div className="p-5 flex flex-col gap-5">
          <div>
            <h2 className="text-base font-bold text-white mb-1">Editor GPX</h2>
            <p className="text-xs text-white/40">
              Haz clic en el mapa para añadir puntos
            </p>
          </div>

          {/* Route title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/40 uppercase tracking-widest">
              Nombre de la ruta
            </label>
            <input
              value={routeTitle}
              onChange={(e) => setRouteTitle(e.target.value)}
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#f97316]/50 transition-colors"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/3 border border-white/8 p-3 text-center">
              <p className="text-xl font-bold text-white">{km.toFixed(2)}</p>
              <p className="text-xs text-white/40 mt-0.5">km</p>
            </div>
            <div className="rounded-xl bg-white/3 border border-white/8 p-3 text-center">
              <p className="text-xl font-bold text-white">{points.length}</p>
              <p className="text-xs text-white/40 mt-0.5">waypoints</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleUndo}
              disabled={points.length === 0}
              title="Deshacer último punto"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-white/10 py-2.5 text-sm text-white/60 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Undo2 size={14} />
              Deshacer
            </button>
            <button
              onClick={handleClear}
              disabled={points.length === 0}
              title="Limpiar todo"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-white/10 py-2.5 text-sm text-white/60 hover:text-red-400 hover:border-red-400/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 size={14} />
              Limpiar
            </button>
          </div>

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={points.length < 2}
            className="flex items-center justify-center gap-2 rounded-full border border-white/15 py-3 text-sm text-white/70 hover:text-white hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Download size={15} />
            Descargar GPX
          </button>

          {/* Upload to NavRide */}
          <button
            onClick={handleUploadToNavRide}
            disabled={points.length < 2 || uploading}
            className="flex items-center justify-center gap-2 rounded-full bg-[#f97316] py-3 text-sm font-semibold text-white hover:bg-[#f97316]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? (
              "Subiendo…"
            ) : (
              <>
                <Upload size={15} />
                Lanzar a NavRide App
              </>
            )}
          </button>

          {uploadMsg && (
            <p
              className={`text-xs text-center rounded-lg px-3 py-2 ${
                uploadMsg.startsWith("✓")
                  ? "bg-green-500/10 border border-green-500/20 text-green-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}
            >
              {uploadMsg}
            </p>
          )}

          <div className="text-xs text-white/20 flex items-start gap-1.5 mt-auto">
            <MapPin size={12} className="shrink-0 mt-0.5" />
            La ruta se guarda en tu cuenta NavRide y aparecerá en la app móvil.
          </div>
        </div>
      </aside>
    </div>
  );
}
