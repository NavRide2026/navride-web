import Link from "next/link";
import { FEATURES } from "@/lib/site/constants";
import { SectionHeading } from "@/components/site/section-heading";
import { Map, Route, Wifi, Mic } from "lucide-react";

const ICONS = [Route, Map, Wifi, Mic];

export default function Features() {
  return (
    <section className="px-4 md:px-8 py-16 md:py-24 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          eyebrow="Funcionalidades verificadas"
          title="Lo que NavRide hace hoy"
          description="Solo funciones existentes en la app beta. Sin promesas de marketing."
        />

        <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
          {FEATURES.map((feature, i) => {
            const Icon = ICONS[i] ?? Route;
            return (
              <article
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-[#101114] p-6 hover:border-[#FF5A1F]/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1C1C1E] flex items-center justify-center mb-4">
                  <Icon className="text-[#FF5A1F]" size={20} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl border border-[#35C759]/20 bg-[#35C759]/5 p-6 md:p-8">
          <p className="text-white/80 text-sm md:text-base leading-relaxed">
            <strong className="text-[#35C759]">Filosofía:</strong> datos en el
            dispositivo, sin cuentas en servidor NavRide. Approach online hasta
            el inicio del GPX cuando hay conexión. Mapas offline con Pilot
            (.mbtiles o preparación de corredor).
          </p>
          <Link
            href="/producto"
            className="inline-block mt-4 text-[#FF5A1F] text-sm font-medium hover:underline"
          >
            Más sobre el producto →
          </Link>
        </div>
      </div>
    </section>
  );
}
