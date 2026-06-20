# NavRide Web — Master Findings

**Fecha:** 2026-06-01  
**Metodología:** Revisión de código fuente + verificación HTTP producción  
**Total hallazgos:** 47

---

## Leyenda de severidad

| Nivel | Significado |
|-------|-------------|
| **P0** | Bloqueador Play, legal o confianza |
| **P1** | Degradación significativa pre-lanzamiento público |
| **P2** | Deuda técnica / UX / SEO |
| **P3** | Mejora deseable |

---

## P0 — Críticos

### F-001 · URL privacidad Flutter desalineada con web
- **Evidencia:** `lib/site/constants.ts` → `privacyPolicyPublicUrl` apunta a `navride2026.github.io/NavRide/legal/privacy_policy.html`
- **Producción:** Vercel sirve `/legal/privacy_policy.html` con 200
- **Riesgo:** Play Console y app pueden apuntar a URL 404
- **Estado:** Bloqueador de coherencia ecosistema

### F-002 · Código legal React contradictorio (Firebase/Stripe/PRO)
- **Archivos:** `app/legal/politica-privacidad/page.tsx`, `eliminacion-datos/page.tsx`, `aviso-legal/page.tsx`
- **Contenido:** Menciona Firebase, Stripe, suscripción PRO, cuentas de usuario
- **App real:** Google Play Billing, offline-first, NavRide Adventure
- **Mitigación actual:** Redirects 308 a HTML canónico
- **Riesgo:** Si redirect falla o alguien accede en dev/build estático sin redirect, copy incorrecto para Play Data Safety

### F-003 · Placeholders legales en código fuente
- **Archivos:** `politica-pagos/page.tsx` → "AQUÍ VA LA POLÍTICA DE PAGOS"; `suscripcion-pro/page.tsx` → "AQUÍ VAN LAS CONDICIONES..."
- **Mitigación:** Redirects a HTML generado
- **Riesgo:** Deuda confusa para auditores y futuros desarrolladores

---

## P1 — Altos

### F-004 · Sin sitemap ni robots.txt
- **Producción:** `/robots.txt` → 404, `/sitemap.xml` → 404
- **Impacto:** Indexación subóptima; crawlers sin guía

### F-005 · Rutas stub accesibles públicamente
- **`/simulator`**, **`/downloads`**, **`/status`:** solo `<h1>` placeholder
- **HTTP:** 200 en producción
- **Impacto:** Percepción amateur si usuario descubre URL directa

### F-006 · `/tutorials` monta simulador EN, no tutoriales
- **Contenido:** `SimulatorEngine` — "Try NavRide", "INTERACTIVE NAVIGATION SIMULATOR"
- **Idioma:** Inglés en ruta no enlazada
- **Impacto:** Confunde propósito; `TutorialEngine` existe pero no se usa

### F-007 · `/news` legacy en inglés
- **Contenido:** "Dynamic Camera Improvements" — copy dev genérico
- **Redirect:** 307 a `/noticias` (correcto para usuarios)
- **Problema:** Sigue en build; duplicidad

### F-008 · Sin enlace Google Play / descarga
- **`/downloads`:** stub
- **Impacto:** Usuario desde web no puede ir a la app

### F-009 · Open Graph incompleto
- **Faltan:** `og:image`, `og:url`, `og:type`, `og:locale`, Twitter cards
- **Impacto:** Previews sociales pobres o inexistentes

### F-010 · Imágenes PNG pesadas sin optimización WebP/AVIF
- **navride_logo.png:** 330 KB
- **navride_splash.png:** 203 KB (hero priority)
- **Impacto:** LCP en móvil degradado

### F-011 · Dominio `navride.app` no operativo
- **Estado:** NXDOMAIN (documentado en audits previos)
- **Impacto:** Marca fragmentada en Vercel subdomain

---

## P2 — Medios

### F-012 · Home sin metadata propia
- **`/`** hereda layout; no hay `export const metadata` en `page.tsx`
- **Impacto:** Menor control SEO por página

### F-013 · 11 rutas sin metadata individual
- Legacy + stubs + home

### F-014 · `privacy_policy.html` estilo claro vs resto dark
- **CSS:** fondo blanco, texto #222
- **Resto legal HTML:** tema dark OEM
- **Impacto:** Inconsistencia visual al llegar desde Play

### F-015 · README desactualizado
- Menciona Geist font; proyecto usa Inter
- Plantilla create-next-app genérica

### F-016 · Componentes muertos en repo
- `TutorialEngine` + 5 tutorials
- `simulator-navbar.tsx` (0 bytes)
- UI shadcn casi sin uso

### F-017 · `framer-motion` en package.json sin uso en V2
- Bundle potencial innecesario si se importa en futuro sin tree-shake

### F-018 · `_zip_extract_sample/` en workspace
- Contiene legal con DNI antiguo
- No desplegado pero confunde auditoría local

### F-019 · Botones `<button>` dentro de `<Link>` en legal legacy
- Patrón semántico incorrecto (accesibilidad)

### F-020 · FAQ limitado a 5 preguntas
- Faltan: offline, Rider, permisos, OSRM, reinstalación, .mbtiles

### F-021 · Noticias: solo 2 entradas
- Útil como estructura; percibido como decorativo hoy

### F-022 · Roadmap: 6 ítems
- Creíble para beta; falta fecha en hitos completados

### F-023 · Sin página dedicada FAQ
- FAQ embebido en soporte solamente

### F-024 · Contraste textos `white/40` y `white/50`
- Posible borderline WCAG AA en fondo #050608

### F-025 · Simulador sin aria-labels en controles
- Navigation/GPX/Camera buttons

### F-026 · Legal HTML sin meta description
- Solo `<title>` en estáticos

### F-027 · Footer no lista todos los documentos legales
- Solo hub + privacidad; resto vía `/legal`

### F-028 · Constantes duplican lógica de `legal-html.ts`
- `lib/site/legal-html.ts` no usado por build

---

## P3 — Bajos

### F-029 · `logo_navride.png` sin referencia en código
### F-030 · SVGs plantilla Next en public/
### F-031 · Mix estilos legacy (`text-7xl font-black`) vs V2 (`SectionHeading`)
### F-032 · Sin skip-link accesibilidad
### F-033 · Sin tests
### F-034 · Sin analytics
### F-035 · Sin manifest PWA
### F-036 · `hooks/` referenciado en components.json pero vacío
### F-037 · GitHub ↔ Vercel sin auto-deploy documentado
### F-038 · Noticias sin RSS/Atom
### F-039 · Roadmap sin filtros ni timeline visual
### F-040 · Sin breadcrumbs en páginas internas
### F-041 · Sin versión/changelog público detallado
### F-042 · Hero usa mockup splash, no screenshot real de app
### F-043 · Sin vídeo demo
### F-044 · Sin sección "press kit"
### F-045 · Sin comparativa planes visual (tabla features)
### F-046 · Sin mención explícita "Android only" en home
### F-047 · `privacyPolicyPublicUrl` en constants no apunta a producción actual

---

## Matriz de cobertura por área

| Área | Hallazgos P0 | Hallazgos P1 | Hallazgos P2+ |
|------|-------------|-------------|---------------|
| Legal | 3 | 0 | 4 |
| UX/UI | 0 | 3 | 8 |
| SEO | 0 | 2 | 3 |
| Play | 1 | 2 | 2 |
| Arquitectura | 0 | 2 | 6 |
| Contenido | 0 | 1 | 5 |
| Performance | 0 | 1 | 1 |
| Accesibilidad | 0 | 0 | 4 |

---

## Verificaciones HTTP producción (2026-06-01)

| URL | Resultado |
|-----|-----------|
| `/` | 200 (~32 KB) |
| `/producto` | 200 |
| `/planes` | 200 |
| `/legal` | 200 |
| `/legal/privacy_policy.html` | 200 |
| `/legal/terms.html` | 200 |
| `/legal/data-deletion.html` | 200 |
| `/contacto` | 200 |
| `/soporte` | 200 |
| `/simulator` | 200 ⚠️ stub |
| `/downloads` | 200 ⚠️ stub |
| `/status` | 200 ⚠️ stub |
| `/tutorials` | 200 ⚠️ legacy |
| `/news` | 307 → `/noticias` |
| `/legal/politica-pagos` | 308 → refund.html |
| `/legal/terminos-condiciones` | 308 → terms.html |
| `/robots.txt` | 404 |
| `/sitemap.xml` | 404 |

**Enlaces externos atribuciones:** no verificados HTTP en esta auditoría (URLs presentes en código; ver LEGAL audit).
