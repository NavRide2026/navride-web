import PageLayout from "@/components/layout/page-layout";
import { SectionHeading } from "@/components/site/section-heading";
import { featuresForPlatform, statusLabel } from "@/lib/product/registry";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Funciones",
  description: "Funciones disponibles en la app y la web de NavRide.",
  alternates: { canonical: "/funciones" },
};

function FeatureList({ platform }: { platform: "web" | "app" }) {
  const features = featuresForPlatform(platform);
  return (
    <div className="grid gap-3">
      {features.map((feature) => (
        <article
          key={feature.id}
          className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-medium text-white">{feature.name}</h3>
            <span className="text-xs text-white/40">
              {statusLabel(feature.status)}
            </span>
          </div>
          <p className="mt-1 text-sm text-white/55">
            {feature.publicDescription}
          </p>
        </article>
      ))}
    </div>
  );
}

export default function FuncionesPage() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <SectionHeading
          eyebrow="NavRide"
          title="Funciones"
          description="App y web trabajan juntas para planificar, guardar y seguir tus rutas."
        />

        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#35C759]">
            Web
          </h2>
          <FeatureList platform="web" />
          <Link
            href="/editor-gpx"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center rounded-xl bg-[#FF5A1F] px-4 py-2 text-sm font-semibold text-white"
          >
            Abrir editor de rutas
          </Link>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#007AFF]">
            App Android
          </h2>
          <FeatureList platform="app" />
        </section>
      </div>
    </PageLayout>
  );
}
