import type { MetadataRoute } from "next";
import { PUBLIC_ROUTES, SITE_URL, BRAND } from "@/lib/site/constants";

const excluded = new Set(["/noticias", "/login", "/perfil", "/mi-garaje", "/mis-rutas", "/editor-gpx", "/delete-account"]);

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.filter((route) => !excluded.has(route)).map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(BRAND.lastUpdated),
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route.includes("legal") ? 0.6 : 0.7,
  }));
}
