"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const GpxEditor = dynamic(() => import("./GpxEditor"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-[#050608] text-sm text-white/65" role="status">
      Preparando el editor y el mapa…
    </div>
  ),
});

/**
 * Compatibilidad con MapLibre 5:
 * `line-cap` y `line-join` pertenecen a `layout`, no a `paint`.
 * Normaliza las capas antiguas antes de que MapLibre las valide.
 */
export default function GpxEditorSafe({ embedNavRideApp = false }: { embedNavRideApp?: boolean }) {
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    import("maplibre-gl")
      .then((maplibre) => {
        const prototype = maplibre.Map.prototype;
        const currentAddLayer = prototype.addLayer;
        const marker = "__navrideLineLayerPatched";

        if (!(currentAddLayer as unknown as Record<string, boolean>)[marker]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const patchedAddLayer = function (this: any, layer: any, beforeId?: string) {
            if (layer?.type !== "line" || !layer.paint) {
              return currentAddLayer.call(this, layer, beforeId);
            }

            const paint = { ...layer.paint };
            const layout = { ...(layer.layout ?? {}) };

            if (paint["line-cap"] !== undefined) {
              layout["line-cap"] = paint["line-cap"];
              delete paint["line-cap"];
            }
            if (paint["line-join"] !== undefined) {
              layout["line-join"] = paint["line-join"];
              delete paint["line-join"];
            }

            return currentAddLayer.call(this, { ...layer, paint, layout }, beforeId);
          };

          (patchedAddLayer as unknown as Record<string, boolean>)[marker] = true;
          prototype.addLayer = patchedAddLayer;
        }

        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setBootError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (bootError) {
    return (
      <div className="grid h-full w-full place-items-center bg-[#050608] p-6 text-center text-white">
        <div>
          <h2 className="text-lg font-semibold">No se pudo preparar el mapa</h2>
          <p className="mt-2 text-sm text-white/60">Comprueba la conexión y vuelve a cargar la página.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-5 min-h-11 rounded-full bg-[#FF8500] px-5 font-semibold text-[#080808]">
            Volver a intentar
          </button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return <div className="grid h-full w-full place-items-center bg-[#050608] text-sm text-white/65">Preparando el mapa…</div>;
  }

  return <GpxEditor embedNavRideApp={embedNavRideApp} />;
}
