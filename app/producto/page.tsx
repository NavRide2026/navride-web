import PageLayout from "@/components/layout/page-layout";
import { SectionHeading } from "@/components/site/section-heading";
import MediaGallery from "@/components/site/media-gallery";
import { BRAND, FEATURES } from "@/lib/site/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Producto",
  description:
    "Qué es NavRide, para quién está diseñado y su filosofía de navegación offroad GPX.",
  alternates: { canonical: "/producto" },
};

export default function ProductoPage() {
  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <SectionHeading
          eyebrow="Producto"
          title="Navegación offroad orientada a GPX"
          description={BRAND.taglineEs}
        />

        <div className="grid lg:grid-cols-2 gap-10 mb-16">
          <div className="space-y-6 text-white/70 leading-relaxed">
            <p>
              <strong className="text-white">NavRide</strong> es navegación
              offroad orientada a moto y trail: importas un track GPX, lo sigues
              en el mapa con HUD y puedes alternar al modo Rally para leer el
              tramo siguiente por dificultad.
            </p>
            <p>
              Un GPX es un archivo con el trazado de una ruta (puntos GPS).
              Puedes importarlo desde el menú lateral o compartir un .gpx desde
              otra app con «Abrir con NavRide».
            </p>
            <p>
              Menú → Importar GPX → el track se dibuja en el mapa. Pulsa
              «Iniciar navegación» para elegir approach (hasta el inicio del
              track, requiere red) o navegación GPX directa.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101114] p-6 md:p-8">
            <h3 className="text-white font-semibold mb-4">Para quién</h3>
            <ul className="space-y-3 text-white/60 text-sm">
              <li>Moteros trail y adventure</li>
              <li>Touring y viajes por carretera secundaria</li>
              <li>Conductores que siguen tracks GPX existentes</li>
              <li>Usuarios que necesitan mapas offline en ruta (Pilot)</li>
            </ul>
            <h3 className="text-white font-semibold mt-8 mb-4">
              Filosofía de navegación
            </h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Approach (ir hacia el track): calcula una ruta online hasta el
              inicio del GPX. Navegación GPX: sigue el track importado punto a
              punto. Datos y rutas en el dispositivo — sin cuentas en servidor
              NavRide.
            </p>
          </div>
        </div>

        <SectionHeading title="Funcionalidades actuales" />
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="rounded-xl border border-white/10 bg-[#1C1C1E] p-5"
            >
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-white/60 text-sm">{f.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-[#101114] p-6 text-sm text-white/50">
          <p>
            Grabación de rutas por voz estará disponible en una fase futura. En
            la beta actual importa un GPX existente para navegar. Estás en beta
            cerrada v{BRAND.version}.
          </p>
        </div>

        <MediaGallery />
      </div>
    </PageLayout>
  );
}
