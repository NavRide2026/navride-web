"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "navride-route-studio-tutorial-v1";

const STEPS = [
  {
    number: "01",
    title: "Elige cómo quieres moverte",
    text: "Selecciona caminar, bici, moto o coche. Ese modo ayuda a calcular el recorrido por la red adecuada.",
    icon: "🚲",
  },
  {
    number: "02",
    title: "Crea la ruta sobre el mapa",
    text: "Haz clic en el mapa para añadir puntos. El editor intenta seguir la carretera o el camino entre cada punto.",
    icon: "📍",
  },
  {
    number: "03",
    title: "Ajusta cada tramo",
    text: "Usa Seguir carretera, Seguir caminos o Línea directa. Si un punto está lejos de una vía, el editor te avisará.",
    icon: "🛣️",
  },
  {
    number: "04",
    title: "Revisa y guarda tu GPX",
    text: "Ajusta la vista, comprueba la distancia y descarga el GPX o guárdalo para usarlo después en NavRide.",
    icon: "✅",
  },
] as const;

export default function RouteStudioIntro({ enabled = true }: { enabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const visible = window.localStorage.getItem(STORAGE_KEY) !== "hidden";
    const frame = window.requestAnimationFrame(() => setOpen(visible));
    return () => window.cancelAnimationFrame(frame);
  }, [enabled]);

  if (!enabled || !open) return null;

  const current = STEPS[step];
  const finish = (remember: boolean) => {
    if (remember) window.localStorage.setItem(STORAGE_KEY, "hidden");
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-end justify-center bg-black/65 p-3 backdrop-blur-[2px] sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="route-studio-intro-title">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/15 bg-[#111318] text-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-white/10 px-5 py-4 sm:px-7 sm:py-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#FF9500]">Primeros pasos</p>
            <h2 id="route-studio-intro-title" className="mt-1 text-xl font-bold sm:text-2xl">Editor de rutas</h2>
            <p className="mt-1 text-sm text-white/55">Crea y edita tus rutas GPX desde la web.</p>
          </div>
          <button type="button" onClick={() => finish(false)} className="inline-flex shrink-0 items-center justify-center border-0 bg-[#FF5A1F] p-0 text-xl leading-none text-white hover:bg-[#ff6d3b]" style={{ width: "1.25rem", height: "1.25rem", minWidth: "1.25rem", minHeight: "1.25rem" }} aria-label="Cerrar tutorial">×</button>
        </div>

        <div className="px-5 py-6 sm:px-7 sm:py-8">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#FF5A1F]/15 text-2xl" aria-hidden="true">{current.icon}</div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Paso {current.number} de 04</p>
              <h3 className="mt-1 text-lg font-semibold sm:text-xl">{current.title}</h3>
            </div>
          </div>
          <p className="mt-5 max-w-lg text-sm leading-6 text-white/65 sm:text-base">{current.text}</p>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <button type="button" onClick={() => finish(true)} className="order-2 min-h-11 rounded-full bg-[#FF5A1F] px-5 text-sm font-semibold text-white hover:bg-[#ff6d3b] sm:order-1">No volver a mostrar</button>
          <div className="order-1 flex gap-2 sm:order-2">
            {step > 0 && <button type="button" onClick={() => setStep((value) => value - 1)} className="min-h-11 rounded-full border border-white/15 px-4 text-sm text-white/70 hover:border-white/30 hover:text-white">Anterior</button>}
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={() => setStep((value) => value + 1)} className="min-h-11 rounded-full bg-[#FF5A1F] px-5 text-sm font-semibold text-white hover:bg-[#ff6d3b]">Siguiente</button>
            ) : (
              <button type="button" onClick={() => finish(false)} className="min-h-11 rounded-full bg-[#FF5A1F] px-5 text-sm font-semibold text-white hover:bg-[#ff6d3b]">Empezar a crear</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
