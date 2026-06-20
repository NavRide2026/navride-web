# NavRide Web — Master Audit

**Fecha:** 2026-06-01  
**Alcance:** Auditoría exhaustiva pre-publicación y Google Play  
**Producción auditada:** https://web-navride.vercel.app  
**Código auditado:** `c:\Users\navri\Desktop\web-navride`  
**Modo:** Solo lectura — sin modificaciones

---

## Resumen ejecutivo

NavRide Web ha pasado por una reconstrucción V2 (junio 2026) que alinea la home, producto, planes, legal HTML, contacto y soporte con la identidad y el copy real de la app Flutter. La web **ya no es una landing genérica de create-next-app**, pero convive con **capas legacy** (simulador, tutoriales, páginas legales React obsoletas, stubs vacíos) que degradan la percepción de madurez y representan riesgo técnico/legal si los redirects fallan.

**Veredicto:** Publicable como **web de soporte beta cerrada + legal Play**, no como **producto web de mercado masivo**.

---

## Puntuaciones (0–10)

| Dimensión | Nota | Comentario breve |
|-----------|------|------------------|
| Estado general | **6.5** | V2 sólida en núcleo; deuda legacy visible |
| UX/UI | **7.0** | OEM dark coherente en rutas V2; inconsistencias en legacy |
| Branding | **7.5** | Paleta y tono NavRide bien aplicados en V2 |
| Legal | **7.0** | HTML canónico Play-ready; código React contradictorio persiste |
| SEO | **4.5** | Metadata básica; sin sitemap, robots, OG image |
| Google Play | **7.5** | URLs legales accesibles en Vercel; desalineación URL Flutter |

---

## Respuestas obligatorias

### 1. ¿Publicable hoy?
**Sí, con reservas.** Como web de soporte legal y marketing de beta cerrada vinculada a Google Play Closed Testing. **No** como lanzamiento público amplio sin limpiar legacy, SEO y enlaces de descarga.

### 2. ¿Qué falta realmente?
- Sitemap + robots.txt
- Open Graph completo (imagen, url, locale)
- Eliminar o aislar rutas legacy (simulator, downloads, status, news, tutoriales)
- Alinear `privacyPolicyPublicUrl` en app Flutter con Vercel
- Página de descarga Play real (enlace a listing cuando exista)
- FAQ ampliado (offline, Rider vs Pilot, OSRM, permisos Android)
- Metadata en home (`/`) explícita
- Dominio propio (`navride.app`) operativo
- README y documentación de proyecto actualizados

### 3. ¿Qué sobra?
- `/simulator`, `/downloads`, `/status` (stubs vacíos)
- `/news` (duplicado EN; redirect existe pero página sigue en build)
- 6 páginas React legales legacy con copy Firebase/Stripe/PRO
- `TutorialEngine` + 5 componentes tutorial (sin ruta)
- `simulator-navbar.tsx` (archivo vacío)
- Assets plantilla Next (`vercel.svg`, `file.svg`, `window.svg`, `next.svg`, `globe.svg`)
- `logo_navride.png` (330 KB + 149 KB duplicados parcialmente — solo uno usado)
- UI shadcn instalada pero casi sin uso (dialog, sheet, tabs, card, button)
- Carpeta `_zip_extract_sample/` en repo (referencia Flutter, no producción)
- `framer-motion` en dependencias (sin uso aparente en páginas V2)

### 4. ¿Qué haría si fuera el CTO de NavRide?
1. **Congelar canon legal:** solo HTML estático; borrar páginas React legales del build.
2. **Unificar URL privacidad** Flutter ↔ Vercel ↔ Play Console en un solo dominio.
3. **Podar rutas huérfanas** antes de producción Play pública.
4. **Añadir sitemap/robots + OG** en una pasada mínima de SEO.
5. **No invertir en simulador web** — la app es el producto; la web es legal + confianza + conversión Play.
6. **Dominio propio** cuando DNS esté listo; Vercel como staging hasta entonces.
7. **CI:** verificar HTTP 200 en URLs legales en cada deploy.

---

## Inventario completo

### Páginas App Router (19 rutas)

| Ruta | Estado | Navbar | Metadata |
|------|--------|--------|----------|
| `/` | V2 activa | — | Hereda layout |
| `/producto` | V2 activa | ✅ | ✅ |
| `/planes` | V2 activa | ✅ | ✅ |
| `/roadmap` | V2 activa | ✅ | ✅ |
| `/noticias` | V2 activa | ✅ | ✅ |
| `/legal` | V2 activa | ✅ | ✅ |
| `/contacto` | V2 activa | ✅ | ✅ |
| `/soporte` | V2 activa | ✅ (CTA) | ✅ |
| `/legal/politica-privacidad` | Legacy → redirect 308 | ❌ | ❌ |
| `/legal/aviso-legal` | Legacy → redirect 308 | ❌ | ❌ |
| `/legal/eliminacion-datos` | Legacy → redirect 308 | ❌ | ❌ |
| `/legal/responsabilidad-navegacion` | Legacy → redirect 308 | ❌ | ❌ |
| `/legal/politica-pagos` | Legacy placeholder → redirect | ❌ | ❌ |
| `/legal/suscripcion-pro` | Legacy placeholder → redirect | ❌ | ❌ |
| `/news` | Legacy EN → redirect 307 | ❌ | ❌ |
| `/simulator` | Stub | ❌ | ❌ |
| `/tutorials` | Legacy simulador | ❌ | ❌ |
| `/downloads` | Stub | ❌ | ❌ |
| `/status` | Stub | ❌ | ❌ |

### HTML estático legal (8 archivos)

| URL | Existe | HTTP prod |
|-----|--------|-----------|
| `/legal/privacy_policy.html` | ✅ | 200 |
| `/legal/legal-notice.html` | ✅ | 200 |
| `/legal/terms.html` | ✅ | 200 |
| `/legal/subscription.html` | ✅ | 200 |
| `/legal/refund.html` | ✅ | 200 |
| `/legal/data-deletion.html` | ✅ | 200 |
| `/legal/gps-disclaimer.html` | ✅ | 200 |
| `/legal/licenses.html` | ✅ | 200 |

**Redirect sin page.tsx:** `/legal/terminos-condiciones` → `/legal/terms.html` (308 ✅)

### Componentes reutilizables

| Grupo | Archivos | Uso |
|-------|----------|-----|
| Site V2 | navbar, footer, hero, features, page-layout, section-heading, plan-card | Activos |
| Simulator | 7 archivos | Solo `/tutorials` |
| Tutorials | 6 archivos | **Ninguna ruta** |
| UI shadcn | 7 archivos | Solo Badge en plan-card |

### Assets públicos

| Asset | Tamaño | Usado |
|-------|--------|-------|
| `navride_logo.png` | 330 KB | Navbar, favicon |
| `navride_splash.png` | 203 KB | Hero (priority load) |
| `logo_navride.png` | 149 KB | **No usado** |
| SVG plantilla Next | <2 KB c/u | **No usados** |
| Legal HTML | 2–5 KB c/u | Servidos estáticos |

### Lo que NO existe

- `sitemap.xml` / `app/sitemap.ts`
- `robots.txt` / `app/robots.ts`
- `app/icon.tsx` / favicon.ico dedicado
- Página `/descargas` o enlace Play Store real
- `/faq` dedicada (FAQ solo en `/soporte`)
- Tests automatizados (unit, e2e, a11y)
- Analytics configurado
- i18n / inglés coherente
- PWA / manifest

---

## Arquitectura

```
app/                    → 19 rutas React (22 en build con _not-found)
public/legal/           → 8 HTML canónicos Play
lib/site/constants.ts   → Fuente única V2 (planes, roadmap, news, legal)
scripts/generate-legal   → Prebuild HTML (7 generados + sanitize privacy)
components/site/        → V2 design system mínimo
components/simulator/   → Legacy interactivo
components/tutorials/   → Legacy muerto
docs/audits/            → Informes previos
docs/WEB_MASTER_*.md    → Esta auditoría
```

**Stack:** Next.js 16.2.6, React 19, Tailwind 4, TypeScript 5, Inter font.

---

## NavRide App vs Web

| Tema | App (canónico) | Web V2 | ¿Alineado? |
|------|----------------|--------|------------|
| Suscripción | NavRide Adventure / Pilot vía Google Play | ✅ | ✅ |
| Backend | Offline-first, sin cuentas servidor | ✅ comunicado | ✅ |
| Firebase/Stripe | No en catálogo legal app | HTML ✅; React legacy ❌ | Parcial |
| Plan Rider | Referencia UI, no vendido Play | ✅ explícito | ✅ |
| Trial 7 días | ✅ | ✅ | ✅ |
| Grabación voz | Futuro | ✅ marcado como futuro | ✅ |
| Mapas offline | .mbtiles + corredor Pilot | ✅ | ✅ |
| OSRM | Con conexión, perfil driving | Mencionado en legal | ✅ |
| Versión | 0.9.0 beta | ✅ | ✅ |
| URL privacidad | GitHub Pages (404 histórico) | Vercel OK | ❌ desalineado |

**Promesas falsas detectadas en web:** Ninguna en rutas V2 servidas al usuario. Riesgo en código legacy React (Firebase, Stripe, PRO, cuentas) si redirects se desactivan.

---

## Competitividad (percepción, no funciones)

| Referente | NavRide Web vs percepción |
|-----------|---------------------------|
| Google Maps | NavRide transmite nicho offroad/GPX, no competidor generalista |
| Waze | Menos “social”; más técnico/OEM — apropiado para trail |
| Calimoto | Calimoto tiene web madura, screenshots reales, store links — NavRide aún beta |
| Kurviger | Kurviger comunica planner + comunidad — NavRide más OEM/minimal |
| DMD2 | DMD2 tiene imagen utilitaria — NavRide V2 más premium visual |

**Conclusión:** La V2 se acerca a Calimoto/Kurviger en tono premium dark, pero les falta profundidad de contenido (galería app real, testimonios, store badge, vídeo).

---

## Documentos relacionados

- [WEB_MASTER_FINDINGS.md](./WEB_MASTER_FINDINGS.md) — hallazgos priorizados
- [WEB_MASTER_UX_UI_AUDIT.md](./WEB_MASTER_UX_UI_AUDIT.md)
- [WEB_MASTER_SEO_AUDIT.md](./WEB_MASTER_SEO_AUDIT.md)
- [WEB_MASTER_LEGAL_AUDIT.md](./WEB_MASTER_LEGAL_AUDIT.md)
- [WEB_MASTER_PLAY_READINESS.md](./WEB_MASTER_PLAY_READINESS.md)
