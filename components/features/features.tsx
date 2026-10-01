import Link from "next/link";
import { FEATURES } from "@/lib/site/constants";
import { SectionHeading } from "@/components/site/section-heading";
import { Map, Route, Wifi, Mic } from "lucide-react";

const ICONS = [Route, Map, Wifi, Mic];

export default function Features() {
  return (
    <section className="border-t border-white/5 px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Funciones" title="Lo esencial para tus rutas" description="Planifica, importa y sigue recorridos GPX desde la app y la web." />
        <div className="grid gap-4 sm:grid-cols-2 md:gap-6">
          {FEATURES.map((feature, index) => {
            const Icon = ICONS[index] ?? Route;
            return <article key={feature.title} className="min-w-0 rounded-2xl border border-white/10 bg-[#101114] p-5 transition-colors hover:border-[#FF8500]/30 sm:p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#1C1C1E]"><Icon className="text-[#FF8500]" size={21} /></div>
              <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-white/60">{feature.description}</p>
            </article>;
          })}
        </div>
        <div className="mt-12 rounded-2xl border border-[#8BEA00]/20 bg-[#8BEA00]/5 p-6 md:p-8">
          <p className="text-sm leading-relaxed text-white/80 md:text-base"><strong className="text-[#8BEA00]">Mapas sin conexión:</strong> descarga previamente la zona o ruta compatible para poder consultar el mapa cuando no tengas cobertura.</p>
          <Link href="/producto" className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-[#FF8500] hover:underline">Más información sobre el producto →</Link>
        </div>
      </div>
    </section>
  );
}
