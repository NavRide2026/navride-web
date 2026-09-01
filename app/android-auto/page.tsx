import PageLayout from "@/components/layout/page-layout";
import { SectionHeading } from "@/components/site/section-heading";
import {
  milestoneProgress,
  PRODUCT_FEATURES,
} from "@/lib/product/registry";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Android Auto",
  description:
    "NavRide en la pantalla del coche — misma navegación que el móvil, sin segundo motor.",
  alternates: { canonical: "/android-auto" },
};

export default function AndroidAutoPage() {
  const aa = PRODUCT_FEATURES.find((f) => f.id === "androidAuto");
  const progress = aa ? milestoneProgress(aa) : 0;

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <SectionHeading
          eyebrow="NavRide · Vehículo"
          title="Android Auto"
          description="Conecta NavRide a un vehículo compatible y utiliza navegación desde la pantalla del coche."
        />

        <div className="rounded-2xl border border-[#FF9500]/30 bg-[#FF9500]/5 p-5 mb-8">
          <p className="text-sm text-white/80">
            <strong className="text-[#FF9500]">Estado: Beta.</strong> La integración
            está implementada en la app: mapa, maniobras, free nav y rutas GPX
            comparten el mismo NavSession que el teléfono. Validación en vehículo
            real pendiente.
          </p>
          <p className="text-xs text-white/45 mt-2">
            Progreso verificable: {progress}% ({aa?.milestones.filter((m) => m.state === "PASS").length}/
            {aa?.milestones.length} milestones)
          </p>
        </div>

        <section className="space-y-4 text-sm text-white/65">
          <h2 className="text-base font-semibold text-white">Qué hace</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Muestra tu posición, ruta y maniobras en Android Auto.</li>
            <li>Free nav y navegación con GPX/ruta activa.</li>
            <li>Detener navegación desde el coche termina la misma sesión que en el móvil.</li>
            <li>Sin segundo GPS, matcher ni cálculo de ruta en el módulo Auto.</li>
          </ul>

          <h2 className="text-base font-semibold text-white pt-4">Qué no prometemos aún</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Disponibilidad en Google Play producción (app en beta).</li>
            <li>Apple CarPlay — fuera de alcance.</li>
            <li>Guía por voz dedicada en Auto (voice guidance no implementada en core).</li>
          </ul>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/roadmap"
            className="text-sm text-white/60 underline hover:text-white"
          >
            Ver roadmap
          </Link>
          <Link
            href="/funciones"
            className="text-sm text-white/60 underline hover:text-white"
          >
            Todas las funciones
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
