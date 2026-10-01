import PageLayout from "@/components/layout/page-layout";
import { SectionHeading } from "@/components/site/section-heading";
import { PlanCard } from "@/components/site/plan-card";
import { PLANS } from "@/lib/site/constants";
import { Check, X } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planes",
  description:
    "Planes Free, Rider y Pilot de NavRide — precios mensuales y anuales.",
};

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
  { label: "Rutas Web/Nube", free: "3", rider: "∞", pilot: "∞" },
  { label: "Favoritos", free: "2", rider: "8", pilot: "∞" },
  { label: "Km máx por track", free: "50", rider: "150", pilot: "∞" },
  { label: "Km Mensuales Max", free: "200", rider: "500", pilot: "∞" },
  { label: "Mapas offline", free: "no", rider: "no", pilot: "yes" },
  { label: "Navi Voz", free: "no", rider: "no", pilot: "yes" },
  { label: "Novedades", free: "no", rider: "no", pilot: "yes" },
  { label: "Trial 7 días", free: "yes", rider: "yes", pilot: "yes" },
];

export default function PlanesPage() {
  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <SectionHeading
          eyebrow="Planes"
          title="Free, Rider y Pilot"
          description="Elige el plan que mejor se adapte a tus rutas."
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
            priceSecondary={PLANS.rider.priceSecondary}
            summary={PLANS.rider.summary}
            badge={PLANS.rider.badge}
            purchasable={PLANS.rider.purchasable}
          />
          <PlanCard
            name={PLANS.pilot.name}
            price={PLANS.pilot.price}
            priceSecondary={PLANS.pilot.priceSecondary}
            summary={PLANS.pilot.summary}
            badge={PLANS.pilot.badge}
            highlighted
            purchasable={PLANS.pilot.purchasable}
          />
        </div>

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
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101114] p-6 md:p-8 text-sm text-white/60">
          <p>
            Las compras digitales realizadas desde Android se procesan mediante
            Google Play. NavRide no almacena datos de tarjeta.
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
