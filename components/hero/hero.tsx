import Link from "next/link";
import { HeroWordmark } from "@/components/site/hero-wordmark";
import { RouteMotionBackground } from "@/components/site/route-motion-background";
import { BRAND, USE_CASES } from "@/lib/site/constants";

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-white/5 px-4 pb-14 md:px-8 md:pb-20">
      <RouteMotionBackground />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 py-12 lg:min-h-[calc(100dvh-5rem)] lg:grid-cols-[1.08fr_.92fr] lg:gap-16 lg:py-16">
        <div className="min-w-0">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#8BEA00]">Navegación off-road</p>
          <h1 className="max-w-2xl text-4xl font-black leading-[1.04] tracking-[-0.045em] text-white sm:text-5xl lg:text-7xl">
            Tu ruta GPX.
            <span className="mt-1 block font-black italic text-[#FF8500]">Sin perder el rumbo.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">Importa una ruta, síguela con el mapa y el HUD y consulta el siguiente tramo sin apartar la atención del recorrido.</p>
          <div className="mt-7 flex flex-wrap gap-2">{USE_CASES.map((tag) => <span key={tag} className="rounded-full border border-white/12 bg-[#171A1F]/72 px-3 py-1.5 text-xs text-white/75 backdrop-blur-sm">{tag}</span>)}</div>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/producto" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#FF8500] px-6 font-semibold text-[#080808] shadow-[0_10px_32px_rgba(255,133,0,.20)] hover:bg-[#ff9d2e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8BEA00]">Conocer NavRide</Link>
            <Link href="/editor-gpx" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 bg-[#111318]/65 px-6 font-medium text-white/90 backdrop-blur-md hover:border-[#FF8500]/60 hover:bg-[#171A1F]">Probar el editor GPX</Link>
          </div>
          <p className="mt-5 text-xs text-white/45">Beta {BRAND.version}</p>
        </div>

        <div className="hero-brand-integrated">
          <div className="hero-brand-halo" />
          <HeroWordmark />
          <p className="hero-brand-tagline">NAVEGACIÓN · GPX · AVENTURA</p>
        </div>
      </div>
    </section>
  );
}
