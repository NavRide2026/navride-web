import Link from "next/link";
import PageLayout from "@/components/layout/page-layout";
import { SectionHeading } from "@/components/site/section-heading";
import { BRAND } from "@/lib/site/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Soporte",
  description: "Soporte para usuarios de NavRide en Google Play y beta cerrada.",
};

const FAQ = [
  {
    q: "¿Cómo restauro mi suscripción Pilot?",
    a: "Tras reinstalar, abre NavRide → Premium → «Restaurar suscripción» con la misma cuenta de Google Play que realizó la compra.",
  },
  {
    q: "¿Cómo elimino mis datos?",
    a: "Ajustes → Privacidad → Eliminar mis datos. También puedes desinstalar la app. Consulta la política de eliminación de datos en el centro legal.",
  },
  {
    q: "¿Cómo cancelo la suscripción?",
    a: "Google Play → Pagos y suscripciones → Suscripciones → NavRide Adventure. Mantienes acceso Pilot hasta fin del periodo pagado.",
  },
  {
    q: "¿Necesito conexión a internet?",
    a: "Approach (ir al inicio del GPX) requiere red. Navegación GPX online requiere plan activo tras el trial. Con Pilot puedes preparar corredor offline o usar .mbtiles para navegar sin red en rutas preparadas.",
  },
  {
    q: "¿Qué es el plan Rider?",
    a: "Rider (4,99 €/mes) es un plan de referencia en la UI con límites de tracks y rally. No está vendido en Google Play actualmente. La suscripción real es NavRide Adventure (Pilot).",
  },
  {
    q: "¿Cómo funcionan los mapas offline?",
    a: "Con Pilot: importa archivos .mbtiles o prepara el corredor de una ruta favorita (Rutas guardadas → Favoritos → Preparar offline). Los tiles se reutilizan al navegar sin red en esa ruta.",
  },
  {
    q: "¿Por qué el GPS varía?",
    a: "La precisión depende de cobertura, túneles y hardware. NavRide es una ayuda — no sustituye señales de tráfico ni tu criterio.",
  },
  {
    q: "Estoy en beta cerrada — ¿cómo reporto un bug?",
    a: `Anota la ruta, el momento y captura de pantalla. Escribe a ${BRAND.supportEmail} con versión ${BRAND.version} y modelo de dispositivo.`,
  },
];

export default function SoportePage() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <SectionHeading
          eyebrow="Soporte"
          title="Ayuda para usuarios de Google Play"
          description="Preparado para closed testing y producción. Sin chatbot — contacto directo."
        />

        <div className="mb-10 rounded-2xl border border-[#FF5A1F]/30 bg-[#FF5A1F]/5 p-6">
          <p className="text-white font-medium mb-2">Contacto de soporte</p>
          <a
            href={`mailto:${BRAND.supportEmail}`}
            className="text-[#FF5A1F] text-lg font-semibold hover:underline"
          >
            {BRAND.supportEmail}
          </a>
          <p className="mt-3 text-white/60 text-sm">
            Incluye versión de la app, modelo Android y descripción del
            problema.
          </p>
        </div>

        <div className="space-y-4 mb-12">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-white/10 bg-[#101114] open:border-[#35C759]/20"
            >
              <summary className="cursor-pointer p-5 text-white font-medium list-none flex justify-between items-center">
                {item.q}
                <span className="text-white/30 group-open:rotate-45 transition-transform text-xl">
                  +
                </span>
              </summary>
              <p className="px-5 pb-5 text-white/60 text-sm leading-relaxed">
                {item.a}
              </p>
            </details>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <Link
            href="/legal/eliminacion-datos"
            className="rounded-xl border border-white/10 p-4 hover:border-white/20 transition text-white/70"
          >
            Eliminación de datos →
          </Link>
          <Link
            href="/legal/refund.html"
            className="rounded-xl border border-white/10 p-4 hover:border-white/20 transition text-white/70"
          >
            Política de pagos →
          </Link>
          <Link
            href="/legal/politica-privacidad"
            className="rounded-xl border border-white/10 p-4 hover:border-white/20 transition text-white/70"
          >
            Política de privacidad →
          </Link>
          <Link
            href="/contacto"
            className="rounded-xl border border-white/10 p-4 hover:border-white/20 transition text-white/70"
          >
            Contacto legal →
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
