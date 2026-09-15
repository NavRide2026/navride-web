import PageLayout from "@/components/layout/page-layout";
import { SectionHeading } from "@/components/site/section-heading";
import { PlanCard } from "@/components/site/plan-card";
import { Check, X } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planes",
  description:
    "Planes NavRide Pilot, Rider y Premium con prueba Premium de 7 días y facturación mediante Google Play.",
};

const PLANS = {
  pilot: {
    name: "Pilot",
    price: "3,99 €/mes · 39,99 €/año",
    summary: "Navegación completa, GPX, mapas carretera/topográfico, offline, grabación e historial local. GPX Studio puede añadirse por 1,49 €/mes o 14,99 €/año.",
    badge: "Entrada",
  },
  rider: {
    name: "Rider",
    price: "5,99 €/mes · 59,99 €/año",
    summary: "Incluye Pilot y añade GPX Studio, mapa Adventure, herramientas avanzadas de ruta, sincronización cloud y personalización visual.",
    badge: "Recomendado",
  },
  premium: {
    name: "Premium",
    price: "7,99 €/mes · 79,99 €/año",
    summary: "La experiencia completa: Rider más personalización Premium, HUD avanzado, estadísticas avanzadas, live sharing y acceso anticipado.",
    badge: "Completo",
  },
} as const;

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

const MATRIX_ROWS: { label: string; pilot: string; rider: string; premium: string }[] = [
  { label: "Navegación y GPX", pilot: "yes", rider: "yes", premium: "yes" },
  { label: "Mapas offline", pilot: "yes", rider: "yes", premium: "yes" },
  { label: "Carretera + Topográfico", pilot: "yes", rider: "yes", premium: "yes" },
  { label: "Mapa Adventure", pilot: "no", rider: "yes", premium: "yes" },
  { label: "Sincronización cloud", pilot: "yes", rider: "yes", premium: "yes" },
  { label: "GPX Studio", pilot: "+1,49 €/mes", rider: "yes", premium: "yes" },
  { label: "Herramientas avanzadas de ruta", pilot: "no", rider: "yes", premium: "yes" },
  { label: "HUD y estadísticas avanzadas", pilot: "no", rider: "no", premium: "yes" },
  { label: "Live sharing / early access", pilot: "no", rider: "no", premium: "yes" },
];

export default function PlanesPage() {
  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <SectionHeading
          eyebrow="Planes"
          title="Pilot, Rider y Premium"
          description="7 días de prueba Premium. Después eliges el plan que necesites. En Android, las compras y renovaciones se procesan mediante Google Play."
        />

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <PlanCard {...PLANS.pilot} />
          <PlanCard {...PLANS.rider} highlighted />
          <PlanCard {...PLANS.premium} />
        </div>

        <div className="mb-12 rounded-2xl border border-white/10 bg-[#101114] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-white font-semibold text-base">Comparativa de características</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide">
                  <th className="text-left px-6 py-3 text-white/40 font-medium w-1/2">Característica</th>
                  <th className="text-center px-4 py-3 text-white/40 font-medium">Pilot</th>
                  <th className="text-center px-4 py-3 text-[#FF5A1F] font-medium">Rider</th>
                  <th className="text-center px-4 py-3 text-white/40 font-medium">Premium</th>
                </tr>
              </thead>
              <tbody>
                {MATRIX_ROWS.map((row, i) => (
                  <tr key={row.label} className={`border-b border-white/5 ${i % 2 !== 0 ? "bg-white/[0.02]" : ""}`}>
                    <td className="px-6 py-3 text-white/70">{row.label}</td>
                    <td className="px-4 py-3 text-center"><CellValue value={row.pilot} /></td>
                    <td className="px-4 py-3 text-center"><CellValue value={row.rider} /></td>
                    <td className="px-4 py-3 text-center"><CellValue value={row.premium} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#101114] p-6 md:p-8 space-y-4 text-sm text-white/60">
          <p><strong className="text-white">Prueba:</strong> 7 días de Premium por cuenta NavRide. La autoridad de la prueba y los entitlements está en el backend.</p>
          <p><strong className="text-white">Android:</strong> compra, renovación, restauración y cancelación se gestionan con Google Play. NavRide no recibe ni almacena datos de tarjeta.</p>
          <p>Los importes mostrados son la referencia EUR del catálogo. Google Play muestra siempre el precio localizado y vigente antes de confirmar la compra.</p>
        </div>
      </div>
    </PageLayout>
  );
}
