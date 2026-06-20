import PageLayout from "@/components/layout/page-layout";
import { SectionHeading } from "@/components/site/section-heading";
import { NEWS_ITEMS } from "@/lib/site/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Noticias",
  description: "Actualizaciones y novedades del ecosistema NavRide.",
};

export default function NoticiasPage() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <SectionHeading
          eyebrow="Noticias"
          title="Actualizaciones NavRide"
          description="Estructura preparada para futuras publicaciones. Editar lib/site/constants.ts."
        />

        <div className="space-y-6">
          {NEWS_ITEMS.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-white/10 bg-[#101114] p-6"
            >
              <time className="text-[#FF5A1F] text-xs font-medium uppercase tracking-wider">
                {item.date}
              </time>
              <h3 className="text-white text-xl font-semibold mt-2 mb-3">
                {item.title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                {item.excerpt}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-10 text-white/40 text-xs">
          Para publicar noticias, añade entradas a NEWS_ITEMS en{" "}
          <code className="text-white/60">lib/site/constants.ts</code>.
        </p>
      </div>
    </PageLayout>
  );
}
