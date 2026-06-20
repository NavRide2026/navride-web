import Image from "next/image";
import Link from "next/link";
import { BRAND, USE_CASES } from "@/lib/site/constants";

export default function Hero() {
  return (
    <section className="relative px-4 md:px-8 pb-16 md:pb-24">
      <div className="max-w-6xl mx-auto pt-8 md:pt-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[#35C759] text-sm font-semibold tracking-widest uppercase mb-4">
              OEM Offroad Navigation
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
              Navegación GPX para moto, trail y aventura
            </h1>
            <p className="mt-6 text-lg text-white/60 max-w-xl leading-relaxed">
              NavRide es navegación offroad orientada a GPX: importas un track,
              lo sigues en el mapa con HUD y alternas al modo Rally para leer el
              tramo siguiente por dificultad. Diseñada para uso en campo.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {USE_CASES.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-[#1C1C1E] px-3 py-1 text-xs text-white/70"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/producto"
                className="inline-flex items-center justify-center rounded-full bg-[#FF5A1F] px-6 py-3 text-white font-semibold hover:bg-[#FF5A1F]/90 transition"
              >
                Conocer el producto
              </Link>
              <Link
                href="/planes"
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-white/80 font-medium hover:border-white/30 hover:text-white transition"
              >
                Ver planes
              </Link>
            </div>

            <p className="mt-6 text-xs text-white/40">
              Beta {BRAND.version} · Trial {7} días · Suscripción vía Google Play
            </p>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm aspect-[9/19] rounded-[2rem] border border-white/10 bg-[#101114] shadow-2xl overflow-hidden">
              <Image
                src="/navride_splash.png"
                alt="NavRide en dispositivo"
                fill
                className="object-cover object-top"
                priority
              />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#050608] to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
