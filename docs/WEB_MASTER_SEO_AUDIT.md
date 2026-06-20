# NavRide Web — SEO Audit

**Fecha:** 2026-06-01  
**Producción:** https://web-navride.vercel.app  
**Modo:** Solo diagnóstico

---

## Puntuación SEO: **4.5 / 10**

---

## Metadata global (`app/layout.tsx`)

| Campo | Valor | Estado |
|-------|-------|--------|
| `title.default` | NavRide — Navegación offroad GPX | ✅ Relevante |
| `title.template` | %s — NavRide | ✅ |
| `description` | GPX, moto, trail, Rally, Google Play | ✅ Buena |
| `metadataBase` | https://web-navride.vercel.app | ✅ |
| `openGraph.title` | NavRide — Navegación offroad GPX | ✅ |
| `openGraph.description` | Beta v0.9.0 | ✅ |
| `openGraph.siteName` | NavRide | ✅ |
| `openGraph.url` | — | ❌ Ausente |
| `openGraph.type` | — | ❌ Ausente |
| `openGraph.images` | — | ❌ Ausente |
| `openGraph.locale` | — | ❌ Ausente |
| `twitter` | — | ❌ Ausente |
| `robots` | — | ❌ Ausente en metadata |
| `alternates.canonical` | — | ❌ Ausente |
| `keywords` | — | ❌ (opcional) |
| `icons` | navride_logo.png | ⚠️ PNG 330KB como favicon |

---

## Metadata por página

| Ruta | title | description | OG propio |
|------|-------|-------------|-----------|
| `/` | Hereda default | Hereda | ❌ |
| `/producto` | Producto — NavRide | ✅ | ❌ |
| `/planes` | Planes — NavRide | ✅ | ❌ |
| `/roadmap` | Roadmap — NavRide | ✅ | ❌ |
| `/noticias` | Noticias — NavRide | ✅ | ❌ |
| `/legal` | Centro legal — NavRide | ✅ | ❌ |
| `/contacto` | Contacto — NavRide | ✅ | ❌ |
| `/soporte` | Soporte — NavRide | ✅ | ❌ |
| Legacy (11 rutas) | Hereda / ninguna | ❌ | ❌ |
| HTML legal (8) | `<title>` only | ❌ | ❌ |

---

## Headings y estructura semántica

### Home `/`
- **H1:** "Navegación GPX para moto, trail y aventura" ✅ (único, descriptivo)
- **H2:** "Lo que NavRide hace hoy" en Features ✅
- **H3:** Por feature ✅
- Estructura lógica ✅

### Páginas V2 internas
- `SectionHeading` renderiza H2 principal ✅
- Subsecciones con H3 ✅
- Sin saltos de nivel graves detectados

### Legacy
- H1 `text-6xl/7xl font-black` — SEO OK semánticamente, estilo inconsistente

### HTML legal
- H1 por documento ✅
- H2 por sección ✅
- Sin H1 duplicado ✅

---

## Sitemap

| Recurso | Estado |
|---------|--------|
| `public/sitemap.xml` | ❌ No existe |
| `app/sitemap.ts` | ❌ No existe |
| **Producción `/sitemap.xml`** | **404** |

### URLs que deberían indexarse (prioridad)
1. `/`
2. `/producto`
3. `/planes`
4. `/legal`
5. `/contacto`
6. `/soporte`
7. `/roadmap`
8. `/noticias`
9. `/legal/privacy_policy.html`
10. `/legal/terms.html`
11. `/legal/data-deletion.html`
12. Resto HTML legal

### URLs que NO deberían indexarse
- `/simulator`, `/downloads`, `/status`, `/tutorials`
- Rutas React legal legacy (redirects)
- `/news` (redirect)

---

## Robots

| Recurso | Estado |
|---------|--------|
| `public/robots.txt` | ❌ No existe |
| `app/robots.ts` | ❌ No existe |
| **Producción `/robots.txt`** | **404** |

**Implicación:** Comportamiento default de crawlers (indexar todo lo enlazado). Stubs legacy pueden indexarse si se descubren.

---

## Open Graph / Social

### Estado actual
- Previews en WhatsApp/Twitter/LinkedIn mostrarán solo título + descripción genéricos
- **Sin imagen** → preview vacía o logo genérico del cliente
- **Sin og:url** → posible confusión con URLs de deployment Vercel alternativas

### Assets candidatos OG (no configurados)
- `/navride_splash.png` (203 KB)
- `/navride_logo.png` (330 KB)
- Screenshot app real (no existe en repo)

---

## HTML estático legal — SEO

| Aspecto | privacy_policy.html | Resto HTML legal |
|---------|---------------------|------------------|
| `<title>` | ✅ | ✅ |
| `meta description` | ❌ | ❌ |
| `meta viewport` | ✅ | ✅ |
| `lang="es"` | ✅ | ✅ |
| `canonical` | ❌ | ❌ |
| Enlaces internos nav | ❌ (privacy) | ✅ (generados) |
| Schema.org | ❌ | ❌ |

**Nota Play:** Google Play no exige SEO de privacidad; sí exige URL accesible y legible ✅

---

## URLs y redirects (SEO impact)

| Redirect | Tipo | SEO |
|----------|------|-----|
| `/legal/politica-privacidad` → `.html` | 308 | ✅ Consolidación |
| `/news` → `/noticias` | 307 | ⚠️ Temporal; preferir 308 |
| `/legal/terminos-condiciones` → `terms.html` | 308 | ✅ |

**Riesgo:** 6 redirects legales correctos; contenido duplicado en código React no se sirve si redirect funciona.

---

## Performance SEO (Core Web Vitals — diagnóstico indirecto)

| Factor | Observación |
|--------|-------------|
| SSR/SSG | Páginas V2 estáticas ✅ |
| Imagen hero LCP | navride_splash.png 203KB, priority ✅ intencional pero pesada |
| Logo navbar | 330KB PNG — excesivo para icono |
| JS client | SimulatorEngine en /tutorials añade bundle client |
| Font | Inter via next/font — optimizado ✅ |
| Legal HTML | <5KB — excelente TTFB |

**Lazy loading:** Hero usa `priority` (correcto para LCP); no hay otras imágenes.

---

## Internacionalización SEO

- **Idioma principal:** es ✅ (`html lang="es"`)
- **Contenido EN residual:** `/news`, SimulatorEngine — ❌ inconsistente
- **hreflang:** ❌ no aplica aún (monolingüe)

---

## README / documentación externa

- README = plantilla Next.js — **no ayuda SEO ni discoverability del proyecto**

---

## Checklist SEO

| Item | Estado |
|------|--------|
| Titles únicos por página V2 | ✅ |
| Meta descriptions V2 | ✅ |
| H1 único por página | ✅ |
| Sitemap | ❌ |
| Robots | ❌ |
| Canonical URLs | ❌ |
| OG image | ❌ |
| Twitter cards | ❌ |
| Structured data | ❌ |
| 404 personalizado | Default Next |
| HTTPS | ✅ Vercel |
| Mobile-friendly | ✅ |
| Page speed legal | ✅ |
| Page speed home | ⚠️ imágenes PNG |

---

## Estado SEO — resumen

**Fortalezas:** Metadata V2 razonable, títulos descriptivos en español, SSG, HTTPS, mobile viewport.

**Debilidades críticas:** Sin sitemap/robots, sin OG image, home sin metadata dedicada, stubs indexables, imágenes pesadas, legal HTML sin description.

**Prioridad SEO pre-lanzamiento público:**
1. robots.txt + sitemap
2. og:image + twitter:card
3. noindex en stubs legacy
4. Optimizar PNG → WebP
5. canonical en layout
