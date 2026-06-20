import PageLayout from "@/components/layout/page-layout";
import { SectionHeading } from "@/components/site/section-heading";
import { ROADMAP_ITEMS } from "@/lib/site/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "Estado real del proyecto NavRide — investigación, desarrollo y completado.",
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  investigacion: { label: "En investigación", color: "text-[#FFD60A]" },
  desarrollo: { label: "En desarrollo", color: "text-[#FF9500]" },
  completado: { label: "Completado", color: "text-[#35C759]" },
};

export default function RoadmapPage() {
  const groups = ["investigacion", "desarrollo", "completado"] as const;

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <SectionHeading
          eyebrow="Roadmap"
          title="Evolución del ecosistema"
          description="Hitos verificados del proyecto. Editable en lib/site/constants.ts."
        />

        {groups.map((status) => {
          const items = ROADMAP_ITEMS.filter((i) => i.status === status);
          if (!items.length) return null;
          const meta = STATUS_LABEL[status];
          return (
            <section key={status} className="mb-10">
              <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${meta.color}`}>
                {meta.label}
              </h3>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li
                    key={item.title}
                    className="rounded-xl border border-white/10 bg-[#101114] p-4"
                  >
                    <p className="text-white font-medium">{item.title}</p>
                    {item.note ? (
                      <p className="text-white/50 text-sm mt-1">{item.note}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <p className="text-white/40 text-xs">
          Para añadir hitos, edita{" "}
          <code className="text-white/60">lib/site/constants.ts</code> →{" "}
          ROADMAP_ITEMS.
        </p>
      </div>
    </PageLayout>
  );
}
