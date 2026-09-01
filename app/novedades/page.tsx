import PageLayout from "@/components/layout/page-layout";
import { SectionHeading } from "@/components/site/section-heading";
import { newsSorted } from "@/lib/product/news";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Novedades",
  description: "Cambios publicados en NavRide — app, web y ecosistema.",
  alternates: { canonical: "/novedades" },
};

export default function NovedadesPage() {
  const entries = newsSorted();

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <SectionHeading
          eyebrow="NavRide"
          title="Novedades"
          description="Solo anuncios públicos aprobados. Sin detalles internos de desarrollo."
        />

        <div className="space-y-6">
          {entries.map((e) => (
            <article
              key={e.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <time className="text-xs text-white/40">{e.date}</time>
              <h2 className="text-lg font-semibold text-white mt-1">{e.title}</h2>
              <p className="text-sm text-white/60 mt-2">{e.summary}</p>
              <div className="flex flex-wrap gap-2 mt-3 text-xs">
                {e.platforms.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-white/5 px-2 py-0.5 text-white/50 uppercase"
                  >
                    {p}
                  </span>
                ))}
                {e.version && (
                  <span className="text-white/40">v{e.version}</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
