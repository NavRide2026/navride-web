import PageLayout from "@/components/layout/page-layout";
import { SectionHeading } from "@/components/site/section-heading";
import { roadmapGroups } from "@/lib/product/registry";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Evolución",
  description: "Estado de las principales funciones de NavRide.",
  alternates: { canonical: "/roadmap" },
};

export default function RoadmapPage() {
  const groups = roadmapGroups();

  const sections = [
    ["Disponible", groups.available, "#35C759"],
    ["En beta", groups.beta, "#FF9500"],
    ["En desarrollo", groups.inDevelopment, "#007AFF"],
    ["En estudio", groups.planned, "#8E8E93"],
  ] as const;

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <SectionHeading
          eyebrow="NavRide"
          title="Evolución"
          description="Consulta qué funciones están disponibles y cuáles siguen en desarrollo."
        />

        {sections.map(([title, items, color]) =>
          items.length > 0 ? (
            <section key={title} className="mb-10">
              <h2
                className="mb-4 text-sm font-semibold uppercase tracking-wider"
                style={{ color }}
              >
                {title}
              </h2>
              <div className="space-y-3">
                {items.map((feature) => (
                  <article
                    key={feature.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5"
                  >
                    <h3 className="text-base font-semibold text-white">
                      {feature.name}
                    </h3>
                    <p className="mt-2 text-sm text-white/60">
                      {feature.publicDescription}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ) : null,
        )}
      </div>
    </PageLayout>
  );
}
