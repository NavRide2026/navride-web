import type { Metadata } from "next";
import Link from "next/link";
import PageLayout from "@/components/layout/page-layout";
import { SectionHeading } from "@/components/site/section-heading";
import { getAllPosts } from "@/lib/blog/posts";
import { BlogSearchFilter } from "@/components/blog/blog-search-filter";

export const metadata: Metadata = {
  title: "Blog de rutas GPX, guías técnicas y navegación off-road para moto trail",
  description: "Aprende a abrir, convertir y seguir archivos GPX; rutas TET y Transpirenaica en España; comparativas de apps GPS y soportes antivibración para moto de aventura.",
  keywords: [
    "rutas moto trail España",
    "rutas GPX moto",
    "trans euro trail espana gpx",
    "abrir archivo gpx en el movil",
    "editor gpx online",
    "app gps moto offline",
    "osmand vs calimoto",
    "movil rugerizado para moto trail",
    "transpirenaica en moto offroad gpx",
    "legislacion moto de campo espana",
  ],
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog NavRide — GPX, rutas trail y navegación off-road",
    description: "Guías técnicas, rutas GPX verificadas, navegación offline y comparativas para moto trail.",
    url: "https://navride-web.vercel.app/blog",
    type: "website",
    locale: "es_ES",
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <PageLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        <SectionHeading
          eyebrow="Blog & Recursos Técnicos"
          title="Rutas GPX, guías técnicas y aventura en moto trail"
          description="Aprende a abrir, editar y navegar tracks GPX, prepara mapas offline y descubre las mejores rutas de aventura de la península."
        />

        {/* All high-value articles with image thumbnails, search and category filters */}
        <section className="mb-14">
          <BlogSearchFilter posts={posts} />
        </section>

        {/* CTA Banner */}
        <section className="mt-16 overflow-hidden rounded-3xl border border-[#FF8500]/30 bg-gradient-to-r from-[#171A1F] via-[#121418] to-[#1a120b] p-8 md:p-12">
          <div className="max-w-2xl">
            <span className="rounded-full border border-[#8BEA00]/30 bg-[#8BEA00]/10 px-3 py-1 text-xs font-semibold text-[#8BEA00]">
              Herramienta web gratuita
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
              ¿Tienes una ruta GPX para tu próxima salida?
            </h2>
            <p className="mt-3 text-base text-white/70">
              Carga el archivo en nuestro editor web, revisa el trazado, limpia tramos erróneos y prepara las etapas antes de llevarlo al móvil.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/editor-gpx"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#FF8500] px-6 font-semibold text-[#080808] hover:bg-[#ff9d2e] transition"
              >
                Probar el Editor GPX
              </Link>
              <Link
                href="/producto"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 bg-[#111318]/70 px-6 font-medium text-white/90 hover:border-white/40 transition"
              >
                Conocer la App NavRide
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
