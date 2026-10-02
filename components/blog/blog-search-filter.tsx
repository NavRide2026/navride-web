"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Clock, ArrowRight, X, Compass, FileCode, Route, Map, ShieldCheck, Mountain } from "lucide-react";
import type { BlogPost } from "@/lib/blog/posts";

interface BlogSearchFilterProps {
  posts: BlogPost[];
}

export function BlogSearchFilter({ posts }: BlogSearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "Todos los artículos", icon: Compass },
    { id: "guias-gpx", label: "Guías & Tutoriales", icon: FileCode },
    { id: "rutas-gpx", label: "Rutas & Tracks GPX", icon: Route },
    { id: "comparativas-gps", label: "Comparativas GPS", icon: Map },
    { id: "tecnica-legalidad", label: "Técnica & Legalidad", icon: ShieldCheck },
  ];

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory =
        selectedCategory === "all" || post.categorySlug === selectedCategory;

      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        post.tags.some((t) => t.toLowerCase().includes(query)) ||
        post.seoKeywords.some((k) => k.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [posts, searchTerm, selectedCategory]);

  return (
    <div>
      {/* Search Bar & Stats */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-white/40">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por track, TET, Transpirenaica, GPX, GPS..."
            className="w-full rounded-2xl border border-white/10 bg-[#101114] py-2.5 pl-10 pr-9 text-sm text-white placeholder-white/40 transition focus:border-[#FF8500]/60 focus:bg-[#14161b] focus:outline-none focus:ring-1 focus:ring-[#FF8500]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/40 hover:text-white"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <span className="text-xs text-white/40 self-end sm:self-center">
          Mostrando {filteredPosts.length} de {posts.length} artículos técnicos
        </span>
      </div>

      {/* Category Pills */}
      <div className="mb-10 flex flex-wrap gap-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          const count =
            cat.id === "all"
              ? posts.length
              : posts.filter((p) => p.categorySlug === cat.id).length;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition ${
                isSelected
                  ? "border border-[#FF8500]/60 bg-[#FF8500]/20 text-[#FF9D2E] shadow-[0_0_15px_rgba(255,133,0,0.15)]"
                  : "border border-white/10 bg-[#101114] text-white/70 hover:border-white/20 hover:text-white"
              }`}
            >
              <Icon size={14} className={isSelected ? "text-[#FF8500]" : "text-white/40"} />
              <span>{cat.label}</span>
              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Posts Grid with Cover Images */}
      {filteredPosts.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#101114] p-12 text-center my-8">
          <Search size={32} className="mx-auto text-white/30 mb-3" />
          <h3 className="text-lg font-bold text-white">No se encontraron artículos</h3>
          <p className="mt-1 text-sm text-white/50">
            Intenta buscar con otros términos como &quot;GPX&quot;, &quot;TET&quot;, &quot;OsmAnd&quot;, &quot;Ruta&quot; o &quot;Offline&quot;.
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("all");
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
          >
            Restablecer filtros
          </button>
        </div>
      ) : (
        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <article
              key={post.slug}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#101114] transition-all duration-300 hover:border-[#FF8500]/50 hover:bg-[#13151a] hover:shadow-[0_12px_36px_rgba(0,0,0,.6)]"
            >
              <div>
                {/* Image Cover */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0d0f12]">
                  <Image
                    src={post.image || "/blog/gpx-navegacion-moto.jpg"}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#101114] via-transparent to-black/30" />
                  <span className="absolute top-3 left-3 rounded-full border border-black/40 bg-black/70 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8BEA00]">
                    {post.eyebrow}
                  </span>
                  <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full border border-black/40 bg-black/70 backdrop-blur-md px-2.5 py-1 text-[10px] text-white/80">
                    <Clock size={11} /> {post.readTime}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6">
                  <h3 className="text-lg font-bold text-white transition group-hover:text-[#FF9D2E] leading-snug">
                    <Link href={`/blog/${post.slug}`} className="focus:outline-none">
                      {post.title}
                    </Link>
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-white/60 line-clamp-3">
                    {post.excerpt}
                  </p>

                  {/* Technical stats badge for route articles */}
                  {post.gpxStats?.distanceKm && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#8BEA00]/20 bg-[#8BEA00]/10 px-2.5 py-1 text-xs text-[#8BEA00]">
                      <Mountain size={13} />
                      <span>{post.gpxStats.distanceKm} km · Dificultad {post.gpxStats.difficulty}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-5 sm:p-6 pt-0">
                <div className="flex flex-wrap gap-1.5 mb-4 border-t border-white/5 pt-4">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-white/5 bg-[#171A1F] px-2 py-0.5 text-[10px] text-white/55"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <time className="text-[11px] text-white/40">
                    {new Date(post.date).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF8500] hover:text-[#ff9d2e]"
                  >
                    <span>Leer artículo</span>
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
