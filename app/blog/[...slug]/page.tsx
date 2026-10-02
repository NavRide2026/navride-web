import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PageLayout from "@/components/layout/page-layout";
import { getAllPosts, getPostBySlug, getRelatedPosts } from "@/lib/blog/posts";
import { SITE_URL } from "@/lib/site/constants";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { ShareBar } from "@/components/blog/share-bar";
import { ElevationChart } from "@/components/blog/elevation-chart";
import { TableOfContents } from "@/components/blog/table-of-contents";
import {
  Clock,
  Calendar,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  Search,
  Sparkles,
} from "lucide-react";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export function generateStaticParams() {
  const postSlugs = getAllPosts().map((post) => ({ slug: [post.slug] }));
  const legacySlugs = [
    { slug: ["guias-gpx", "convertir-kml-a-gpx"] },
    { slug: ["guias-gpx", "visor-gpx-online"] },
    { slug: ["gps-moto", "app-gps-moto-offline"] },
    { slug: ["gps-moto", "alternativas-wikiloc-moto"] },
    { slug: ["gps-moto", "pantalla-carplay-moto-trail"] },
    { slug: ["rutas-gpx", "rutas-moto-trail-espana"] },
  ];
  return [...postSlugs, ...legacySlugs];
}

const LEGACY_SLUG_MAP: Record<string, string> = {
  "convertir-kml-a-gpx": "convertir-kml-a-gpx-moto",
  "visor-gpx-online": "editor-gpx-online-unir-recortar-tracks",
  "app-gps-moto-offline": "app-gps-moto-offline-navegacion",
  "alternativas-wikiloc-moto": "osmand-vs-calimoto-vs-navride-gps-moto",
  "pantalla-carplay-moto-trail": "pantalla-carplay-android-auto-moto",
  "rutas-moto-trail-espana": "rutas-moto-trail-espana-tracks-gpx",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const targetSlug = slug.length === 1 ? slug[0] : (LEGACY_SLUG_MAP[slug[1]] || slug[1]);

  const post = getPostBySlug(targetSlug);
  if (!post) return { title: "Artículo no encontrado" };

  const postUrl = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: `${post.title} — NavRide`,
    description: post.metaDescription,
    keywords: post.seoKeywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      locale: "es_ES",
      url: postUrl,
      title: post.title,
      description: post.metaDescription,
      publishedTime: post.date,
      modifiedTime: post.updatedDate || post.date,
      authors: [post.author.name],
      tags: post.tags,
      images: [
        {
          url: `${SITE_URL}${post.image}`,
          width: 1400,
          height: 788,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.metaDescription,
      images: [`${SITE_URL}${post.image}`],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  if (slug.length === 2) {
    const redirectSlug = LEGACY_SLUG_MAP[slug[1]] || slug[1];
    const targetPost = getPostBySlug(redirectSlug);
    if (targetPost) {
      redirect(`/blog/${targetPost.slug}`);
    }
  }

  const post = getPostBySlug(slug[0]);
  if (!post) notFound();

  const relatedPosts = getRelatedPosts(post.slug, 3);
  const tocItems = post.content.sections.map((s) => ({
    id: s.id,
    heading: s.heading,
  }));

  const jsonLdArticle = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: post.title,
    description: post.metaDescription,
    image: `${SITE_URL}${post.image}`,
    author: {
      "@type": "Person",
      name: post.author.name,
      jobTitle: post.author.role,
    },
    publisher: {
      "@type": "Organization",
      name: "NavRide",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/brand/navride-wordmark-clean.svg`,
      },
    },
    datePublished: post.date,
    dateModified: post.updatedDate || post.date,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
    keywords: post.seoKeywords.join(", "),
  };

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.category, item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 4, name: post.title, item: `${SITE_URL}/blog/${post.slug}` },
    ],
  };

  return (
    <PageLayout>
      <ReadingProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdArticle) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />

      <article className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        {/* Breadcrumb Navigation & Share */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs text-white/50">
          <nav aria-label="Migas de pan" className="flex flex-wrap items-center gap-1.5">
            <Link href="/" className="transition hover:text-white">
              Inicio
            </Link>
            <ChevronRight size={13} className="text-white/30" />
            <Link href="/blog" className="transition hover:text-white">
              Blog
            </Link>
            <ChevronRight size={13} className="text-white/30" />
            <span className="text-white/70">{post.category}</span>
          </nav>
          <ShareBar title={post.title} />
        </div>

        {/* Compact Hero Cover Image (Real photo, controlled height) */}
        <div className="relative mb-8 h-48 sm:h-64 md:h-72 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#090b0e] shadow-lg">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 896px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f12]/80 via-transparent to-transparent" />
        </div>

        {/* Article Header */}
        <header className="mb-10 border-b border-white/10 pb-8">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[#8BEA00]/30 bg-[#8BEA00]/10 px-3 py-1 text-xs font-semibold text-[#8BEA00]">
              {post.eyebrow}
            </span>
            <span className="flex items-center gap-1 text-xs text-white/50">
              <Clock size={13} /> {post.readTime}
            </span>
            <span className="flex items-center gap-1 text-xs text-white/50">
              <Calendar size={13} />{" "}
              {new Date(post.date).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            {post.gpxStats?.difficulty && (
              <span className="rounded-lg border border-white/10 bg-[#171A1F] px-2.5 py-0.5 text-xs text-[#FF9D2E]">
                Nivel: {post.gpxStats.difficulty}
              </span>
            )}
            {post.gpxStats?.offlineReady && (
              <span className="rounded-lg border border-[#8BEA00]/20 bg-[#8BEA00]/10 px-2.5 py-0.5 text-xs text-[#8BEA00] flex items-center gap-1">
                <CheckCircle size={12} /> 100% Offline
              </span>
            )}
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl leading-[1.15]">
            {post.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/75 sm:text-lg">
            {post.excerpt}
          </p>
        </header>

        {/* Optional Elevation Chart for Route Articles */}
        {post.elevationStats && (
          <div className="mb-8">
            <ElevationChart
              highPointMeters={post.elevationStats.highPointMeters}
              lowPointMeters={post.elevationStats.lowPointMeters}
              ascentMeters={post.elevationStats.ascentMeters}
              distanceKm={post.elevationStats.distanceKm}
              terrainBreakdown={post.elevationStats.terrainBreakdown}
            />
          </div>
        )}

        {/* Two-Column Grid: Content on Left + Improved Sticky Index on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-10">
          {/* Main Article Content */}
          <div className="lg:col-span-8 space-y-10 text-base leading-relaxed text-white/80">
            {/* Mobile collapsible index */}
            <TableOfContents items={tocItems} />

            <p className="text-lg font-normal leading-relaxed text-white/85">
              {post.content.intro}
            </p>

            {post.content.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24 space-y-4">
                <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                  {section.heading}
                </h2>
                {section.subheading && (
                  <p className="text-sm font-medium text-[#8BEA00]">
                    {section.subheading}
                  </p>
                )}

                <div className="space-y-4">
                  {section.body.map((para, idx) => (
                    <p key={idx} className="leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>

                {/* Numbered Steps */}
                {section.steps && (
                  <div className="my-6 space-y-3">
                    {section.steps.map((step) => (
                      <div
                        key={step.num}
                        className="flex gap-4 rounded-xl border border-white/10 bg-[#121418] p-4 items-start"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FF8500] text-xs font-black text-black">
                          {step.num}
                        </span>
                        <div>
                          <h3 className="font-semibold text-white text-sm">
                            {step.title}
                          </h3>
                          <p className="mt-1 text-xs text-white/60 leading-normal">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tip Callout Box */}
                {section.tipBox && (
                  <aside
                    className={`my-6 rounded-2xl border p-5 ${
                      section.tipBox.type === "warning"
                        ? "border-[#FF8500]/30 bg-[#FF8500]/10 text-white"
                        : "border-[#8BEA00]/30 bg-[#8BEA00]/10 text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2 font-semibold text-sm">
                      <span
                        className={
                          section.tipBox.type === "warning"
                            ? "text-[#FF9D2E]"
                            : "text-[#8BEA00]"
                        }
                      >
                        {section.tipBox.title}
                      </span>
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed">
                      {section.tipBox.text}
                    </p>
                  </aside>
                )}

                {/* Structured Comparison Table */}
                {section.tableData && (
                  <div className="my-6 overflow-x-auto rounded-2xl border border-white/10 bg-[#0d0f12]">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="border-b border-white/10 bg-white/5 text-white">
                        <tr>
                          {section.tableData.headers.map((h, i) => (
                            <th key={i} className="p-3 sm:p-4 font-semibold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white/70">
                        {section.tableData.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-white/5 transition">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-3 sm:p-4">
                                {cIdx === 0 ? (
                                  <strong className="text-white">{cell}</strong>
                                ) : (
                                  cell
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}

            {/* Quick Search Tip */}
            <div className="my-8 rounded-2xl border border-white/10 bg-[#121418] p-5 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8BEA00]/15 text-[#8BEA00]">
                <Search size={20} />
              </div>
              <div className="text-xs leading-relaxed text-white/70 text-center sm:text-left">
                <strong className="text-white">Búsqueda rápida en Google:</strong> Puedes
                encontrar la versión limpia de este track buscando:{" "}
                <code className="rounded bg-black/40 px-2 py-0.5 font-mono text-[#FF9D2E]">
                  NavRide {post.title.split(":")[0]}
                </code>
              </div>
            </div>

            {/* In-Article CTA Banner */}
            <aside className="my-10 rounded-3xl border border-[#FF8500]/40 bg-gradient-to-br from-[#171A1F] via-[#121418] to-[#1c1209] p-6 sm:p-8">
              <span className="rounded-full border border-[#8BEA00]/40 bg-[#8BEA00]/15 px-3 py-1 text-xs font-semibold text-[#8BEA00]">
                {post.content.ctaBox.badgeText}
              </span>
              <h3 className="mt-3 text-xl font-bold text-white sm:text-2xl">
                {post.content.ctaBox.title}
              </h3>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">
                {post.content.ctaBox.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={post.content.ctaBox.buttonHref}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#FF8500] px-6 text-sm font-bold text-[#080808] hover:bg-[#ff9d2e] transition shadow-[0_8px_24px_rgba(255,133,0,.25)]"
                >
                  {post.content.ctaBox.buttonText}
                </Link>
                <Link
                  href="/producto"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 text-sm font-medium text-white hover:bg-white/10 transition"
                >
                  Ver funciones de la app
                </Link>
              </div>
            </aside>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 pt-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg border border-white/10 bg-[#121418] px-3 py-1 text-xs text-white/60"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Back to Blog Navigation */}
            <div className="pt-6 border-t border-white/10 flex items-center justify-between">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-[#FF8500] transition"
              >
                <ArrowLeft size={16} /> Volver al blog
              </Link>
              <Link
                href="/editor-gpx"
                className="inline-flex items-center gap-1.5 text-xs text-[#FF9D2E] hover:underline"
              >
                <span>Abrir Editor GPX</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>

          {/* Improved Desktop Sticky Sidebar Index */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <TableOfContents items={tocItems} />

              {/* Sidebar Quick CTA */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#101216] to-[#15120e] p-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8BEA00] flex items-center gap-1.5 mb-2">
                  <Sparkles size={12} /> NavRide Web
                </span>
                <h4 className="text-sm font-bold text-white leading-snug">
                  ¿Tienes este track en tu ordenador?
                </h4>
                <p className="mt-1 text-xs text-white/60 leading-relaxed">
                  Ábrelo en nuestro editor web para limpiar puntos anómalos y ver la altimetría antes de salir.
                </p>
                <Link
                  href="/editor-gpx"
                  className="mt-3.5 inline-flex w-full items-center justify-center rounded-xl bg-[#FF8500] py-2 text-xs font-bold text-black hover:bg-[#ff9d2e] transition"
                >
                  Abrir Editor GPX Gratis
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {/* Related Articles with Real Photography Cover Thumbnails */}
        {relatedPosts.length > 0 && (
          <section className="mt-20 border-t border-white/10 pt-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF8500]">
                  Sigue explorando
                </span>
                <h3 className="text-2xl font-bold tracking-tight text-white mt-1">
                  Artículos y Guías Relacionadas
                </h3>
              </div>
              <Link
                href="/blog"
                className="text-xs font-semibold text-[#8BEA00] hover:underline flex items-center gap-1"
              >
                Ver todo el blog →
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/blog/${rel.slug}`}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#101114] transition-all duration-300 hover:border-[#FF8500]/50 hover:bg-[#13151a] hover:shadow-[0_12px_32px_rgba(0,0,0,.6)]"
                >
                  <div>
                    <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-[#0d0f12]">
                      <Image
                        src={rel.image}
                        alt={rel.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    <div className="p-5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#FF8500] mb-2">
                        {rel.eyebrow}
                      </p>
                      <h4 className="text-base font-bold text-white transition group-hover:text-[#FF9D2E] line-clamp-2 leading-snug">
                        {rel.title}
                      </h4>
                      <p className="mt-2 text-xs text-white/60 line-clamp-2 leading-relaxed">
                        {rel.excerpt}
                      </p>
                    </div>
                  </div>
                  <div className="p-5 pt-0">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#8BEA00]">
                      Leer guía completa →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </PageLayout>
  );
}
