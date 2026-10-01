import PageLayout from "@/components/layout/page-layout";
import { SectionHeading } from "@/components/site/section-heading";
import MediaGallery from "@/components/site/media-gallery";
import { FEATURES } from "@/lib/site/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Producto",
  description: "Qué es NavRide, para quién está diseñada y cómo utiliza rutas GPX y mapas sin conexión.",
  alternates: { canonical: "/producto" },
};

export default function ProductoPage() {
  return <PageLayout><div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
    <SectionHeading eyebrow="Producto" title="Navegación orientada a rutas GPX" description="Planifica, importa y sigue recorridos desde una interfaz centrada en la ruta y la información necesaria durante el trayecto." />
    <div className="mb-16 grid gap-8 lg:grid-cols-2 lg:gap-10">
      <div className="space-y-5 leading-relaxed text-white/70">
        <p><strong className="text-white">NavRide</strong> permite importar una ruta GPX, visualizarla en el mapa y seguirla durante el recorrido.</p>
        <p>Un archivo GPX contiene puntos geográficos que describen un recorrido. Puedes seleccionarlo desde la aplicación o compartirlo desde otra aplicación utilizando «Abrir con NavRide».</p>
        <p>Antes de empezar, comprueba que la ruta se visualiza correctamente y descarga el mapa necesario si vas a navegar sin cobertura.</p>
      </div>
      <aside className="rounded-2xl border border-white/10 bg-[#101114] p-6 md:p-8">
        <h2 className="mb-4 font-semibold text-white">Pensada para</h2>
        <ul className="space-y-3 text-sm text-white/65"><li>Motocicletas trail y de aventura</li><li>Viajes y carreteras secundarias</li><li>Personas que siguen recorridos GPX existentes</li><li>Rutas con cobertura limitada, si el paquete sin conexión está preparado</li></ul>
        <h2 className="mb-4 mt-8 font-semibold text-white">Mapas sin conexión</h2>
        <p className="text-sm leading-relaxed text-white/65">Descarga previamente una zona o ruta compatible para disponer del mapa cuando no tengas conexión.</p>
      </aside>
    </div>
    <SectionHeading title="Funciones principales" />
    <div className="grid gap-4 sm:grid-cols-2">{FEATURES.map((feature) => <article key={feature.title} className="min-w-0 rounded-xl border border-white/10 bg-[#1C1C1E] p-5"><h3 className="mb-2 font-semibold text-white">{feature.title}</h3><p className="text-sm leading-relaxed text-white/60">{feature.description}</p></article>)}</div>
    <MediaGallery />
  </div></PageLayout>;
}
