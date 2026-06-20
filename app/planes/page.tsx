import PageLayout from "@/components/layout/page-layout";
import { SectionHeading } from "@/components/site/section-heading";
import { PlanCard } from "@/components/site/plan-card";
import { PLANS } from "@/lib/site/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planes",
  description:
    "Planes Free, Rider y Pilot de NavRide. Suscripción NavRide Adventure vía Google Play.",
};

export default function PlanesPage() {
  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <SectionHeading
          eyebrow="Planes"
          title="Free, Rider y Pilot"
          description="Diferencias extraídas del catálogo legal y la app. Sin ventajas inventadas."
        />

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <PlanCard
            name={PLANS.free.name}
            price={PLANS.free.price}
            summary={PLANS.free.summary}
            badge={PLANS.free.badge}
          />
          <PlanCard
            name={PLANS.rider.name}
            price={PLANS.rider.price}
            summary={PLANS.rider.summary}
            badge={PLANS.rider.badge}
            purchasable={PLANS.rider.purchasable}
          />
          <PlanCard
            name={PLANS.pilot.name}
            price={PLANS.pilot.price}
            summary={PLANS.pilot.summary}
            badge={PLANS.pilot.badge}
            highlighted
            purchasable={PLANS.pilot.purchasable}
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101114] p-6 md:p-8 space-y-4 text-sm text-white/60">
          <p>
            <strong className="text-white">Suscripción real en Google Play:</strong>{" "}
            {PLANS.pilot.productName} ({PLANS.pilot.sku}). {PLANS.pilot.price}.
          </p>
          <p>
            <strong className="text-white">Rider:</strong> plan de referencia en
            la UI — no vendido en Play actualmente. No prometer compra Rider
            hasta activación comercial.
          </p>
          <p>
            La suscripción se renueva automáticamente cada mes hasta
            cancelación en Google Play → Pagos y suscripciones. NavRide no
            almacena datos de tarjeta.
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
