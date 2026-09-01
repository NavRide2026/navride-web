import PageLayout from "@/components/layout/page-layout";
import { SectionHeading } from "@/components/site/section-heading";
import {
  featuresForPlatform,
  milestoneProgress,
  statusLabel,
} from "@/lib/product/registry";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Funciones",
  description:
    "Qué ofrece NavRide hoy: navegación, modos, GPX, Route Studio, sync, Android Auto y más.",
  alternates: { canonical: "/funciones" },
};

export default function FuncionesPage() {
  const webFeatures = featuresForPlatform("web");
  const appFeatures = featuresForPlatform("app");

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <SectionHeading
          eyebrow="NavRide"
          title="Funciones del ecosistema"
          description="App, web y vehículo conectados — una cuenta, un producto."
        />

        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#35C759] mb-4">
            En la web
          </h2>
          <div className="grid gap-3">
            {webFeatures.map((f) => (
              <div
                key={f.id}
                className="rounded-xl border border-white/10 p-4 bg-white/[0.02]"
              >
                <div className="flex justify-between gap-2">
                  <h3 className="font-medium text-white">{f.name}</h3>
                  <span className="text-xs text-white/40 shrink-0">
                    {statusLabel(f.status)}
                  </span>
                </div>
                <p className="text-sm text-white/55 mt-1">{f.publicDescription}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/editor-gpx"
              className="inline-flex items-center rounded-xl bg-[#FF5A1F] px-4 py-2 text-sm font-semibold text-white"
            >
              Crear ruta
            </Link>
            <Link
              href="/mapa-en-vivo"
              className="inline-flex items-center rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80"
            >
              Mapa en vivo
            </Link>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#007AFF] mb-4">
            En la app Android
          </h2>
          <div className="grid gap-3">
            {appFeatures.slice(0, 8).map((f) => (
              <div
                key={f.id}
                className="rounded-xl border border-white/10 p-4 bg-white/[0.02]"
              >
                <div className="flex justify-between gap-2">
                  <h3 className="font-medium text-white">{f.name}</h3>
                  <span className="text-xs font-mono text-white/35">
                    {milestoneProgress(f)}%
                  </span>
                </div>
                <p className="text-sm text-white/55 mt-1">{f.publicDescription}</p>
              </div>
            ))}
          </div>
          <Link
            href="/android-auto"
            className="inline-block mt-4 text-sm text-[#FF9500] underline"
          >
            Android Auto →
          </Link>
        </section>
      </div>
    </PageLayout>
  );
}
