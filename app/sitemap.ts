import type { MetadataRoute } from "next";
import { PUBLIC_ROUTES, SITE_URL, BRAND } from "@/lib/site/constants";
import { getAllPosts } from "@/lib/blog/posts";
import { getAllKeywordGuides } from "@/lib/blog/keyword-guides";

const excluded = new Set(["/noticias", "/login", "/perfil", "/mi-garaje", "/mis-rutas", "/editor-gpx", "/delete-account"]);

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = PUBLIC_ROUTES.filter((route) => !excluded.has(route)).map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(BRAND.lastUpdated),
    changeFrequency: route === "/" || route === "/blog" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route === "/blog" ? 0.9 : route.includes("legal") ? 0.5 : 0.7,
  }));
  const articleRoutes: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updatedDate || post.date),
    changeFrequency: "monthly",
    priority: post.featured ? 0.85 : 0.75,
  }));
  const keywordGuideRoutes: MetadataRoute.Sitemap = getAllKeywordGuides().map((guide) => ({
    url: `${SITE_URL}/blog/${guide.categorySlug}/${guide.slug}`,
    lastModified: new Date(guide.updatedDate),
    changeFrequency: "monthly",
    priority: 0.8,
  }));
  return [...staticRoutes, ...articleRoutes, ...keywordGuideRoutes];
}
