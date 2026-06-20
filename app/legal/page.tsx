import Link from "next/link";
import PageLayout from "@/components/layout/page-layout";
import { SectionHeading } from "@/components/site/section-heading";
import { ATTRIBUTIONS, BRAND, LEGAL_DOCS } from "@/lib/site/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Centro legal",
  description:
    "Documentación legal NavRide: privacidad, términos, suscripción, eliminación de datos y atribuciones.",
};

export default function LegalPage() {
  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <SectionHeading
          eyebrow="Legal"
          title="Centro legal NavRide"
          description={`Documentación OEM alineada con la app. Última actualización: ${BRAND.lastUpdated}.`}
        />

        <section className="mb-14">
          <h3 className="text-white font-semibold mb-4">Documentos</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {LEGAL_DOCS.map((doc) => (
              <Link
                key={doc.href}
                href={doc.href}
                className={`rounded-xl border p-4 transition hover:border-[#FF5A1F]/40 ${
                  doc.critical
                    ? "border-[#FF5A1F]/30 bg-[#FF5A1F]/5"
                    : "border-white/10 bg-[#101114]"
                }`}
              >
                <span className="text-white font-medium">{doc.title}</span>
                {doc.critical ? (
                  <span className="block text-[#FF5A1F] text-xs mt-1">
                    URL Google Play
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-white font-semibold mb-4">
            Atribuciones cartográficas
          </h3>
          <p className="text-white/50 text-sm mb-6">
            Todas las URLs son clicables y abren el sitio oficial del proveedor.
          </p>
          <div className="space-y-3">
            {ATTRIBUTIONS.map((attr) => (
              <article
                key={attr.title}
                className="rounded-xl border border-white/10 bg-[#1C1C1E] p-4"
              >
                <h4 className="text-[#35C759] font-medium">{attr.title}</h4>
                <p className="text-white/40 text-xs mt-1">{attr.appliesTo}</p>
                <p className="text-white/60 text-sm mt-2">{attr.detail}</p>
                <a
                  href={attr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-[#FF5A1F] text-sm hover:underline break-all"
                >
                  {attr.url}
                </a>
              </article>
            ))}
          </div>
          <Link
            href="/legal/licenses.html"
            className="inline-block mt-6 text-[#FF5A1F] text-sm hover:underline"
          >
            Ver página completa de licencias →
          </Link>
        </section>
      </div>
    </PageLayout>
  );
}
