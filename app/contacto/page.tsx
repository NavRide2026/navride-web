import PageLayout from "@/components/layout/page-layout";
import { SectionHeading } from "@/components/site/section-heading";
import { BRAND } from "@/lib/site/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto",
  description: `Contacto oficial de NavRide — ${BRAND.supportEmail}`,
};

export default function ContactoPage() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <SectionHeading
          eyebrow="Contacto"
          title="Habla con el equipo NavRide"
          description="Datos reales del titular legal y soporte de la aplicación."
        />

        <div className="rounded-2xl border border-white/10 bg-[#101114] p-6 md:p-8 space-y-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/40 mb-1">
              Titular
            </p>
            <p className="text-white font-medium">{BRAND.holderName}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-white/40 mb-1">
              Dirección
            </p>
            <p className="text-white/70 text-sm">{BRAND.holderAddress}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-white/40 mb-1">
              Email
            </p>
            <a
              href={`mailto:${BRAND.supportEmail}`}
              className="text-[#FF5A1F] font-medium hover:underline"
            >
              {BRAND.supportEmail}
            </a>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-white/40 mb-1">
              Aplicación
            </p>
            <p className="text-white/70 text-sm">
              {BRAND.name} {BRAND.version} · Android · Google Play (beta
              cerrada)
            </p>
          </div>
        </div>

        <p className="mt-8 text-white/50 text-sm">
          Para soporte técnico, consultas de privacidad o eliminación de datos,
          escribe a {BRAND.supportEmail} indicando versión de la app y modelo de
          dispositivo. También puedes visitar la página de{" "}
          <a href="/soporte" className="text-[#FF5A1F] hover:underline">
            Soporte
          </a>
          .
        </p>
      </div>
    </PageLayout>
  );
}
