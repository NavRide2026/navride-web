import PageLayout from "@/components/layout/page-layout";
import { SectionHeading } from "@/components/site/section-heading";
import { PlanCard } from "@/components/site/plan-card";
import { PLANS } from "@/lib/site/constants";
import { Check, Clock, X } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planes",
  description:
    "Planes Free, Rider y Pilot de NavRide. Suscripción NavRide Adventure vía Google Play.",
};

function ComingSoonBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-xs font-medium text-amber-400">
      <Clock className="h-3 w-3" />
      Próximamente
    </span>
  );
}

function Yes() {
  return <Check className="h-4 w-4 text-[#35C759] mx-auto" />;
}

function No() {
  return <X className="h-4 w-4 text-white/30 mx-auto" />;
}

function CellValue({ value }: { value: string }) {
  if (value === "yes") return <Yes />;
  if (value === "no") return <No />;
  return <span className="text-white/80">{value}</span>;
}

const MATRIX_ROWS: { label: string; free: string; rider: string; pilot: string }[] = [
  { label: "Rutas editadas", free: "3", rider: "10", pilot: "∞" },
  { label: "Rutas importadas", free: "5", rider: "∞", pilot: "∞" },
  { label: "Favoritos", free: "2", rider: "4", pilot: "∞" },
  { label: "Km máx por track", free: "—", rider: "50 km", pilot: "∞" },
  { label: "Mapas offline", free: "no", rider: "no", pilot: "yes" },
  { label: "Trial 7 días", free: "yes", rider: "yes", pilot: "—" },
];

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

        {/* Feature matrix */}
        <div className="mb-12 rounded-2xl border border-white/10 bg-[#101114] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-white font-semibold text-base">
              Comparativa de características
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide">
                  <th className="text-left px-6 py-3 text-white/40 font-medium w-1/2">
                    Característica
                  </th>
                  <th className="text-center px-4 py-3 text-white/40 font-medium">
                    Free
                  </th>
                  <th className="text-center px-4 py-3 text-white/40 font-medium">
                    Rider
                  </th>
                  <th className="text-center px-4 py-3 text-[#FF5A1F] font-medium">
                    Pilot
                  </th>
                </tr>
              </thead>
              <tbody>
                {MATRIX_ROWS.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-b border-white/5 ${
                      i % 2 !== 0 ? "bg-white/[0.02]" : ""
                    }`}
                  >
                    <td className="px-6 py-3 text-white/70">{row.label}</td>
                    <td className="px-4 py-3 text-center">
                      <CellValue value={row.free} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <CellValue value={row.rider} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <CellValue value={row.pilot} />
                    </td>
                  </tr>
                ))}
                {/* Rally row — exclusive Pilot feature, coming soon */}
                <tr className="border-b border-white/5 bg-amber-500/[0.03]">
                  <td className="px-6 py-3 text-white/70 flex items-center gap-2">
                    Modo Rally (Roadbook)
                  </td>
                  <td className="px-4 py-3 text-center">
                    <No />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <No />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ComingSoonBadge />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-white/5">
            <p className="text-xs text-white/40">
              Modo Rally en desarrollo. Próximamente disponible de forma
              exclusiva para pilotos del Plan Pilot.
            </p>
          </div>
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
            La suscripción se renueva automáticamente cada mes hasta cancelación
            en Google Play → Pagos y suscripciones. NavRide no almacena datos de
            tarjeta.
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
