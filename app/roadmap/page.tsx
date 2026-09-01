import PageLayout from "@/components/layout/page-layout";
import { SectionHeading } from "@/components/site/section-heading";
import {
  milestoneProgress,
  PRODUCT_FEATURES,
  roadmapGroups,
  statusLabel,
} from "@/lib/product/registry";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "Evolución real de NavRide — progreso derivado de milestones verificables, no fechas inventadas.",
  alternates: { canonical: "/roadmap" },
};

function FeatureRow({
  id,
  name,
  publicDescription,
  status,
  platforms,
  progress,
  lastUpdated,
}: {
  id: string;
  name: string;
  publicDescription: string;
  status: string;
  platforms: string[];
  progress: number;
  lastUpdated: string;
}) {
  return (
    <article
      id={id}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <h3 className="text-base font-semibold text-white">{name}</h3>
        <span className="text-xs text-white/40">{lastUpdated}</span>
      </div>
      <p className="text-sm text-white/60 mb-3">{publicDescription}</p>
      <div className="flex flex-wrap gap-2 text-xs mb-3">
        {platforms.map((p) => (
          <span
            key={p}
            className="rounded-full bg-white/5 px-2 py-0.5 text-white/50 uppercase"
          >
            {p}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-[#35C759] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-mono text-white/50">{progress}%</span>
      </div>
    </article>
  );
}

export default function RoadmapPage() {
  const groups = roadmapGroups();

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <SectionHeading
          eyebrow="Ecosistema NavRide"
          title="Roadmap con evidencias"
          description="Cada porcentaje sale de milestones PASS/IN_PROGRESS — nunca de estimaciones a ojo."
        />

        {(
          [
            ["available", "Disponible ahora", groups.available, "#35C759"],
            ["beta", "En beta", groups.beta, "#FF9500"],
            ["inDevelopment", "En desarrollo", groups.inDevelopment, "#007AFF"],
            ["planned", "Exploración", groups.planned, "#8E8E93"],
          ] as const
        ).map(([key, title, items, color]) =>
          items.length > 0 ? (
            <section key={key} className="mb-10">
              <h2
                className="text-sm font-semibold uppercase tracking-wider mb-4"
                style={{ color }}
              >
                {title}
              </h2>
              <div className="space-y-3">
                {items.map((f) => (
                  <FeatureRow
                    key={f.id}
                    id={f.id}
                    name={f.name}
                    publicDescription={f.publicDescription}
                    status={statusLabel(f.status)}
                    platforms={f.platforms}
                    progress={milestoneProgress(f)}
                    lastUpdated={f.lastUpdated}
                  />
                ))}
              </div>
            </section>
          ) : null,
        )}

        <p className="text-white/30 text-xs mt-8">
          Fuente: Product Registry v1 · {PRODUCT_FEATURES.length} features ·{" "}
          <Link href="/novedades" className="underline hover:text-white/50">
            Ver novedades
          </Link>
        </p>
      </div>
    </PageLayout>
  );
}
