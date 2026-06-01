# Auditoría Técnica Web NavRide — Google Play Readiness

| Campo | Valor |
|-------|-------|
| **Fecha** | 2026-06-01 |
| **Alcance** | Repositorio `web-navride` + verificación externa de `https://navride.app` |
| **Modo** | Auditoría exclusiva (sin implementación de cambios) |
| **Estado git** | Rama `master`, 1 commit (`Initial commit from Create Next App`), trabajo legal/web sin commitear |
| **Auditor** | Agente Cursor (automático) |

---

## Resumen ejecutivo

La web de NavRide es un proyecto **Next.js 16 (App Router)** con páginas legales en español bajo rutas dinámicas (`/legal/politica-privacidad`), pero **Google Play apunta a una URL legacy** (`/legal/privacy_policy.html`) que **no existe en el repositorio**.

El dominio `navride.app` responde con **HTTP 503 Service Unavailable** en todas las rutas probadas desde infraestructura externa, y **no resuelve por DNS** desde el entorno de auditoría local (NXDOMAIN). El build de producción **falla** por archivos de página vacíos.

**Conclusión:** Existen **bloqueadores P0** tanto de infraestructura/despliegue como de alineación URL/contenido que impiden usar la web como política de privacidad pública para Google Play en su estado actual.

---

## 1. Arquitectura web

### 1.1 Framework y stack

| Componente | Valor detectado | Evidencia |
|------------|-----------------|-----------|
| Framework | **Next.js 16.2.6** (App Router) | `package.json` |
| Runtime UI | React 19.2.4 | `package.json` |
| Lenguaje | TypeScript 5 | `tsconfig.json` |
| Estilos | Tailwind CSS 4 + PostCSS | `package.json`, `postcss.config.mjs`, `app/globals.css` |
| UI | shadcn/ui + Radix UI | `components.json`, `components/ui/*` |
| Animaciones | framer-motion | `package.json`, `components/hero/hero.tsx` |
| Fuentes | Geist (next/font/google) | `app/layout.tsx` |

### 1.2 Estructura del proyecto

```
web-navride/
├── app/                    # App Router (rutas basadas en carpetas)
│   ├── layout.tsx          # Layout raíz + metadata
│   ├── page.tsx            # Home (/)
│   ├── globals.css
│   ├── legal/              # Centro legal
│   ├── roadmap/
│   ├── news/
│   ├── tutorials/
│   ├── simulator/          # page.tsx VACÍO
│   ├── downloads/            # page.tsx VACÍO
│   └── status/               # page.tsx VACÍO
├── components/             # Navbar, Footer, Hero, Simulator, UI
├── lib/utils.ts
├── public/                 # Solo SVGs de plantilla
│   ├── file.svg
│   ├── vercel.svg
│   └── window.svg
├── next.config.ts          # Sin configuración custom
├── package.json
└── tsconfig.json
```

**Total archivos rastreados:** ~56 (excl. `node_modules`).

### 1.3 Sistema de build

| Script | Comando | Resultado auditoría |
|--------|---------|---------------------|
| Dev | `next dev` | No probado en esta auditoría |
| Build | `next build` | **FALLA** |
| Start | `next start` | No ejecutable sin build exitoso |
| Lint | `eslint` | No ejecutado |

**Error de build (evidencia):**

```
▲ Next.js 16.2.6 (Turbopack)
✓ Compiled successfully in 5.6s
Running TypeScript ...
Failed to type check.

.next/dev/types/validator.ts:42:39
Type error: File 'C:/Users/navri/Desktop/web-navride/app/downloads/page.tsx' is not a module.
```

Archivos vacíos detectados (0 bytes, sin export):

- `app/downloads/page.tsx`
- `app/status/page.tsx`
- `app/simulator/page.tsx`

### 1.4 Export estático vs SSR

| Aspecto | Estado |
|---------|--------|
| `output: 'export'` en `next.config.ts` | **No configurado** |
| `next export` / static HTML | **No usado** |
| Modo de renderizado | **SSR/SSG híbrido por defecto de Next.js** (requiere servidor Node o plataforma compatible como Vercel) |
| Archivos `.html` estáticos en `public/` | **Ninguno** |

**Implicación:** Las rutas legales son páginas React servidas dinámicamente; no existen ficheros `.html` servibles directamente como `privacy_policy.html`.

### 1.5 Sistema de routing

Routing basado en **App Router** de Next.js 16:

| Ruta URL | Archivo fuente | Estado |
|----------|----------------|--------|
| `/` | `app/page.tsx` | ✅ Implementada |
| `/legal` | `app/legal/page.tsx` | ✅ Implementada |
| `/legal/aviso-legal` | `app/legal/aviso-legal/page.tsx` | ✅ Implementada |
| `/legal/politica-privacidad` | `app/legal/politica-privacidad/page.tsx` | ✅ Implementada (contenido completo) |
| `/legal/terminos-condiciones` | **No existe** | ❌ Enlace roto desde `/legal` |
| `/legal/suscripcion-pro` | `app/legal/suscripcion-pro/page.tsx` | ⚠️ Placeholder |
| `/legal/responsabilidad-navegacion` | `app/legal/responsabilidad-navegacion/page.tsx` | ✅ Implementada |
| `/legal/politica-pagos` | `app/legal/politica-pagos/page.tsx` | ⚠️ Placeholder |
| `/legal/eliminacion-datos` | `app/legal/eliminacion-datos/page.tsx` | ✅ Implementada |
| `/roadmap` | `app/roadmap/page.tsx` | ✅ Implementada (básica) |
| `/news` | `app/news/page.tsx` | ✅ Implementada (básica) |
| `/tutorials` | `app/tutorials/page.tsx` | ✅ Implementada |
| `/downloads` | `app/downloads/page.tsx` | ❌ Vacío (rompe build) |
| `/status` | `app/status/page.tsx` | ❌ Vacío (rompe build) |
| `/simulator` | `app/simulator/page.tsx` | ❌ Vacío |
| `/legal/privacy_policy.html` | **No existe en ningún sitio** | ❌ No mapeada |

No hay `middleware.ts`, `rewrites`, `redirects` ni rutas API.

### 1.6 Carpeta `public/`

Contenido actual:

```
public/
├── file.svg      (asset plantilla create-next-app)
├── vercel.svg    (asset plantilla create-next-app)
└── window.svg    (asset plantilla create-next-app)
```

- **No hay** subcarpeta `public/legal/`
- **No hay** `privacy_policy.html`, `robots.txt`, `sitemap.xml`, favicon custom, ni APK descargable

### 1.7 Gestión de páginas legales

- **Patrón:** Componentes React en `app/legal/<slug>/page.tsx` con layout compartido (`PageLayout` → Navbar + Footer).
- **Índice:** `app/legal/page.tsx` lista 7 documentos legales con cards enlazadas.
- **Contenido real vs placeholder:**
  - Completos: privacidad, aviso legal, eliminación de datos, responsabilidad navegación
  - Placeholder: política de pagos (`"AQUÍ VA LA POLÍTICA DE PAGOS"`), suscripción Pro (`"AQUÍ VAN LAS CONDICIONES DE SUSCRIPCIÓN PRO"`)
  - Inexistente: términos y condiciones (enlace presente, página ausente)
- **Contacto embebido:** `navride@outlook.com` en privacidad, aviso legal y eliminación de datos (no hay página `/contact` ni `/support`).

---

## 2. Vercel

### 2.1 Archivos de configuración

| Archivo | ¿Existe? |
|---------|----------|
| `vercel.json` | **No** |
| `.vercel/project.json` | **No** (carpeta `.vercel` en `.gitignore`, no presente en repo) |
| Variables de entorno commiteadas | **No** (`.env*` ignorado) |

### 2.2 Rewrites, redirects, headers

**No hay configuración** de rewrites, redirects ni headers en el repositorio.

`next.config.ts` está vacío de opciones:

```typescript
const nextConfig: NextConfig = {
  /* config options here */
};
```

### 2.3 ¿Puede la config provocar 503?

Desde el **código del repositorio**, no hay configuración que explique un 503. Un 503 en Vercel/Next.js suele indicar:

1. **Despliegue caído, suspendido o sin build exitoso**
2. **Función/serverless en error** (cold start fallido, crash en runtime)
3. **Dominio apuntando a proyecto inexistente o sin producción activa**
4. **Protección/escalado** (límite de invocaciones, proyecto pausado)

Como el **build local falla**, es altamente probable que **no exista un despliegue válido** o que el último despliegue en Vercel también falle.

### 2.4 ¿Rutas legales correctamente expuestas?

**En código:** Sí, bajo rutas Next.js en español.

**En producción:** No verificable — todo el dominio devuelve 503.

**Para Google Play:** No — la URL registrada (`privacy_policy.html`) no tiene equivalente en código ni redirect.

---

## 3. Dominio

### 3.1 Configuración en el repositorio

| Referencia | Resultado |
|------------|-----------|
| `navride.app` en código fuente | **0 referencias** |
| DNS / registros A/CNAME | **No documentados en repo** |
| `vercel.json` con dominio | **No existe** |
| README despliegue | Mención genérica a Vercel (plantilla create-next-app) |

### 3.2 Verificación DNS (auditoría 2026-06-01)

| Prueba | Resultado |
|--------|-----------|
| `nslookup navride.app` (DNS local) | **NXDOMAIN** — *Non-existent domain* |
| `nslookup navride.app 8.8.8.8` (Google DNS) | **NXDOMAIN** |
| `Invoke-WebRequest https://navride.app/` (Windows) | **Error:** *No se puede resolver el nombre remoto* |
| Fetch externo (infraestructura Cursor) | **HTTP 503** en `/`, `/legal`, `/legal/privacy_policy.html`, `/legal/politica-privacidad` |

**Interpretación:** Hay **inconsistencia entre resolvers**. El fetch externo alcanza un host que responde 503; el entorno local no resuelve el dominio. Posibles causas:

- Dominio recién registrado / propagación incompleta
- Registros DNS mal configurados o eliminados
- Dominio apuntando a Vercel con proyecto roto (Vercel puede responder 503)
- Conflicto entre registrador y hosting

### 3.3 Configuración esperada para despliegue (documentación, no recomendación)

Para Next.js 16 en Vercel, lo esperado sería:

1. Proyecto Vercel vinculado al repo `web-navride`
2. Build command: `next build` (debe pasar)
3. Dominio custom `navride.app` → CNAME a `cname.vercel-dns.com` (o A records de Vercel)
4. Certificado SSL automático de Vercel (HTTPS)

**Estado actual:** Ninguno de estos puntos está verificable como operativo.

---

## 4. Páginas legales — inventario detallado

### 4.1 Política de privacidad

| Campo | Valor |
|-------|-------|
| **Ubicación** | `app/legal/politica-privacidad/page.tsx` |
| **URL prevista (Next.js)** | `https://navride.app/legal/politica-privacidad` |
| **URL Google Play reportada** | `https://navride.app/legal/privacy_policy.html` |
| **Accesible en producción** | ❌ 503 |
| **Contenido** | ✅ Completo (RGPD, responsable Daniel Montero Mora, Firebase, Stripe, permisos GPS, email contacto) |
| **Problemas** | Desalineación URL; dominio caído; sin `.html` estático |

### 4.2 Términos y condiciones

| Campo | Valor |
|-------|-------|
| **Ubicación** | **No existe** — solo enlace en `app/legal/page.tsx` línea 40 |
| **URL prevista** | `https://navride.app/legal/terminos-condiciones` |
| **Accesible** | ❌ Página no implementada → 404 si el sitio estuviera activo |
| **Problemas** | Enlace roto en centro legal; posible requisito Play Console sin cubrir |

### 4.3 Aviso legal

| Campo | Valor |
|-------|-------|
| **Ubicación** | `app/legal/aviso-legal/page.tsx` |
| **URL prevista** | `https://navride.app/legal/aviso-legal` |
| **Accesible** | ❌ 503 |
| **Contenido** | ✅ Completo (LSSI-CE, titular, email) |
| **Problemas** | Dominio caído |

### 4.4 Eliminación de datos

| Campo | Valor |
|-------|-------|
| **Ubicación** | `app/legal/eliminacion-datos/page.tsx` |
| **URL prevista** | `https://navride.app/legal/eliminacion-datos` |
| **Accesible** | ❌ 503 |
| **Contenido** | ✅ Completo (procedimiento in-app, Firebase, Stripe, plazos, soporte email) |
| **Problemas** | Dominio caído; Google Play puede pedir URL dedicada de eliminación de cuenta — no hay URL corta tipo `/delete-account` |

### 4.5 Contacto

| Campo | Valor |
|-------|-------|
| **Ubicación** | **No hay página dedicada** |
| **Referencias** | Email `navride@outlook.com` en privacidad, aviso legal, eliminación de datos |
| **URL prevista** | Ninguna (`/contact` no existe) |
| **Accesible** | ❌ N/A |
| **Problemas** | Google Play exige forma de contacto del desarrollador accesible públicamente; email solo dentro de páginas legales no enlazadas desde home/footer |

### 4.6 Soporte

| Campo | Valor |
|-------|-------|
| **Ubicación** | **No hay página dedicada** |
| **Referencias** | Sección "Soporte" dentro de `eliminacion-datos/page.tsx` con email |
| **URL prevista** | Ninguna (`/support` no existe) |
| **Accesible** | ❌ N/A |
| **Problemas** | Sin página de soporte visible desde navegación principal |

### 4.7 Documentos legales adicionales (no solicitados explícitamente pero presentes)

| Documento | Archivo | Estado contenido |
|-----------|---------|------------------|
| Condiciones Suscripción Pro | `app/legal/suscripcion-pro/page.tsx` | ⚠️ Placeholder |
| Política de Pagos | `app/legal/politica-pagos/page.tsx` | ⚠️ Placeholder |
| Responsabilidad Navegación | `app/legal/responsabilidad-navegacion/page.tsx` | ✅ Completo |

---

## 5. Google Play Compliance

### 5.1 Checklist

| Requisito | Estado | Severidad | Notas |
|-----------|--------|-----------|-------|
| Política de privacidad pública | ❌ | **P0** | URL registrada devuelve 503; ruta real distinta |
| URLs HTTPS | ⚠️ | **P0** | HTTPS no verificable (dominio no resuelve / 503) |
| Accesibilidad móvil | ⚠️ | **P2** | Diseño responsive con Tailwind (viewport-friendly en código); no verificable en prod |
| Página de contacto | ❌ | **P1** | Solo email embebido en legales |
| Página de soporte | ❌ | **P1** | No existe como ruta independiente |
| Eliminación de datos / cuenta | ⚠️ | **P1** | Contenido existe en `/legal/eliminacion-datos` pero inaccesible (503) |
| Términos y condiciones | ❌ | **P1** | Enlace roto — página no creada |
| Consistencia URL Play Console ↔ Web | ❌ | **P0** | `privacy_policy.html` ≠ `politica-privacidad` |

### 5.2 Bloqueadores Closed Testing

| ID | Bloqueador | Motivo |
|----|------------|--------|
| BT-01 | Política de privacidad inaccesible | Google verifica la URL; 503 = rechazo o retención |
| BT-02 | URL incorrecta en Play Console | Apunta a ruta inexistente en el proyecto |
| BT-03 | Sitio web no desplegado | Build falla; código no commiteado; DNS inconsistente |
| BT-04 | Email de contacto no en URL pública simple | Revisores buscan contacto accesible desde la store listing |

### 5.3 Bloqueadores Producción

Todos los de Closed Testing, más:

| ID | Bloqueador | Motivo |
|----|------------|--------|
| BP-01 | Contenido legal incompleto | Política pagos y suscripción Pro son placeholders |
| BP-02 | Términos y condiciones ausentes | Enlace 404 en centro legal |
| BP-03 | Metadata web genérica | `title: "Create Next App"` — mala señal de profesionalismo en revisión |
| BP-04 | Sin página de descarga funcional | `/downloads` vacío; botón "Download APK" en hero sin enlace |

---

## 6. Errores y riesgos

### 6.1 Routing

| Problema | Severidad | Detalle |
|----------|-----------|---------|
| `/legal/terminos-condiciones` → 404 | **P1** | Enlace en `app/legal/page.tsx` sin `page.tsx` destino |
| `/legal/privacy_policy.html` → inexistente | **P0** | URL esperada por Play Store, no mapeada |
| `/downloads`, `/status`, `/simulator` rotos | **P1** | Archivos vacíos; rompen build |

### 6.2 Páginas huérfanas / navegación

| Página | En navbar | En footer | En /legal |
|--------|-----------|-----------|-----------|
| `/legal/*` | ✅ `/legal` | ❌ | — |
| `/roadmap` | ✅ | ❌ | ❌ |
| `/news` | ✅ | ❌ | ❌ |
| `/tutorials` | ✅ | ❌ | ❌ |
| `/downloads` | ❌ | ❌ | ❌ |
| `/status` | ❌ | ❌ | ❌ |
| `/simulator` | ❌ | ❌ | ❌ |

Footer (`components/footer/footer.tsx`) solo muestra `NAVRIDE 2026` — **sin enlaces legales**.

Botones del Hero (`components/hero/hero.tsx`) son `<button>` sin `href` — **no navegan** a downloads ni roadmap.

### 6.3 Enlaces rotos internos

- `/legal/terminos-condiciones` — **confirmado roto**

### 6.4 Configuraciones peligrosas

| Riesgo | Severidad | Detalle |
|--------|-----------|---------|
| Código no commiteado | **P1** | Todo el trabajo legal está en `??` (untracked); despliegue desde git remoto no incluiría legales |
| Build roto en CI/Vercel | **P0** | `npm run build` falla |
| Sin `vercel.json` redirects | **P1** | No hay compatibilidad con URLs legacy de Play Store |
| Metadata por defecto | **P2** | `app/layout.tsx`: title/description de plantilla |

### 6.5 SEO

| Problema | Severidad |
|----------|-----------|
| `metadata.title = "Create Next App"` | P2 |
| `lang="en"` con contenido mayoritariamente en español | P2 |
| Sin `robots.txt` / `sitemap.xml` | P2 |
| Sin Open Graph / Twitter cards | P2 |

### 6.6 Despliegue

| Problema | Severidad |
|----------|-----------|
| Git: 1 commit, sin remote verificado | P1 |
| Build production fail | P0 |
| Dominio 503 / DNS NXDOMAIN | P0 |
| `.vercel` no versionado (normal) pero sin evidencia de proyecto linkado | P1 |

---

## 7. Investigación específica del error 503

### 7.1 ¿Existe `privacy_policy.html`?

| Ubicación buscada | Resultado |
|-------------------|-----------|
| `public/legal/privacy_policy.html` | ❌ No existe |
| `public/*.html` | ❌ Ningún HTML |
| `app/legal/privacy_policy.html/` | ❌ No existe |
| Referencias en código | ❌ Cero matches de `privacy_policy` |
| Rewrites a `.html` | ❌ No hay `vercel.json` ni config Next |

**Conclusión:** La ruta `privacy_policy.html` **no existe** en el proyecto. Si algún sistema externo (Play Console, app Android) apunta a esa URL, **nunca servirá contenido** salvo que se cree el archivo estático o un redirect.

### 7.2 ¿Coincide la URL esperada con la estructura real?

| Origen | URL |
|--------|-----|
| Google Play (reportado) | `https://navride.app/legal/privacy_policy.html` |
| Implementación real | `https://navride.app/legal/politica-privacidad` |

**Desalineación total:** convención inglés + extensión `.html` vs slug español + App Router sin extensión.

### 7.3 ¿Conflictos de routing?

No hay conflictos internos de routing Next.js para `privacy_policy.html` porque la ruta simplemente **no está definida**. En un despliegue funcional, Next.js devolvería **404**, no 503.

El **503 afecta a todo el dominio**, incluyendo `/` y `/legal/politica-privacidad`. Esto indica un **problema de infraestructura/hosting**, no un conflicto de routing específico de la política de privacidad.

### 7.4 ¿Conflictos de build?

**Sí — bloqueante:**

```
Type error: File '.../app/downloads/page.tsx' is not a module.
```

Mientras existan páginas vacías en `app/`, el build de producción **no completará**. Vercel no podrá desplegar una versión nueva exitosamente.

### 7.5 ¿Motivo evidente del 503?

| Hipótesis | Probabilidad | Evidencia |
|-----------|--------------|-----------|
| Build fallido → sin deployment válido | **Alta** | `npm run build` falla localmente |
| Proyecto Vercel caído/suspendido | **Alta** | 503 global en fetch externo |
| DNS mal configurado / dominio no propagado | **Alta** | NXDOMAIN en múltiples resolvers locales |
| Código no desplegado (untracked) | **Alta** | Legales no commiteados |
| Routing específico de `privacy_policy.html` | **Baja** | 503 también en `/` y rutas existentes |
| Rate limiting / WAF | **Baja** | Sin evidencia en repo |

**Diagnóstico principal:** El 503 **no es causado por la ruta `privacy_policy.html` en sí**, sino porque **el sitio completo está indisponible** a nivel de hosting/DNS/despliegue. La URL de Play Store es un **problema adicional** (ruta inexistente + desalineación) que se manifestaría como **404** una vez resuelto el 503.

---

## 8. Matriz de severidad consolidada

| ID | Hallazgo | Sev | Tipo |
|----|----------|-----|------|
| H-01 | Dominio `navride.app` responde 503 en todas las rutas | **P0** | Infraestructura |
| H-02 | DNS NXDOMAIN desde entorno de auditoría | **P0** | Dominio |
| H-03 | `npm run build` falla (páginas vacías) | **P0** | Build |
| H-04 | URL Play `privacy_policy.html` no existe en repo | **P0** | Compliance |
| H-05 | URL real `/legal/politica-privacidad` ≠ URL Play | **P0** | Compliance |
| H-06 | `/legal/terminos-condiciones` enlazado pero no implementado | **P1** | Routing |
| H-07 | Sin páginas `/contact` ni `/support` | **P1** | Compliance |
| H-08 | Política pagos y suscripción Pro son placeholders | **P1** | Contenido |
| H-09 | Código legal sin commitear en git | **P1** | Despliegue |
| H-10 | Sin `vercel.json` (redirects/headers) | **P1** | Config |
| H-11 | Footer sin enlaces legales | **P2** | UX/Compliance |
| H-12 | Metadata "Create Next App" | **P2** | SEO |
| H-13 | `lang="en"` vs contenido ES | **P2** | SEO/a11y |
| H-14 | Hero buttons sin navegación | **P2** | UX |

---

## 9. Recomendaciones (sin implementar)

> Estas acciones están documentadas como guía post-auditoría. **No se han ejecutado** en esta auditoría.

### P0 — Resolver antes de Closed Testing

1. **Restaurar disponibilidad del dominio:** Verificar en registrador DNS que `navride.app` tiene registros válidos apuntando a Vercel (o hosting elegido). Confirmar certificado SSL activo.
2. **Corregir build:** Completar o eliminar `app/downloads/page.tsx`, `app/status/page.tsx`, `app/simulator/page.tsx` hasta que `npm run build` pase.
3. **Desplegar código actual:** Commitear y pushear páginas legales; verificar deployment exitoso en Vercel dashboard.
4. **Alinear URL de privacidad con Play Console** — elegir una estrategia:
   - **Opción A:** Cambiar URL en Play Console a `https://navride.app/legal/politica-privacidad`
   - **Opción B:** Crear `public/legal/privacy_policy.html` estático o redirect en `vercel.json`:
     ```json
     { "redirects": [{ "source": "/legal/privacy_policy.html", "destination": "/legal/politica-privacidad", "permanent": true }] }
     ```
5. **Verificar post-despliegue:** Confirmar HTTP 200 en la URL exacta registrada en Play Console.

### P1 — Antes de Producción

6. Crear `app/legal/terminos-condiciones/page.tsx` con contenido legal completo.
7. Completar placeholders de política de pagos y suscripción Pro.
8. Crear página pública de contacto/soporte (p. ej. `/support` con email y formulario o mailto).
9. Añadir enlaces legales en footer (privacidad, eliminación de datos, contacto).
10. Actualizar metadata en `app/layout.tsx` (title, description, lang=`es`).

### P2 — Mejora continua

11. Añadir `robots.txt` y `sitemap.xml`.
12. Conectar botones del Hero a rutas reales (`/downloads`, `/roadmap`).
13. Implementar Open Graph tags para compartir en store listing.

---

## 10. Evidencias técnicas recopiladas

### 10.1 Probes HTTP externos

| URL | HTTP Status | Fecha |
|-----|-------------|-------|
| `https://navride.app/` | **503** | 2026-06-01 |
| `https://navride.app/legal` | **503** | 2026-06-01 |
| `https://navride.app/legal/privacy_policy.html` | **503** | 2026-06-01 |
| `https://navride.app/legal/politica-privacidad` | **503** | 2026-06-01 |

### 10.2 Probes DNS locales

```
nslookup navride.app → Non-existent domain
nslookup navride.app 8.8.8.8 → Non-existent domain
Invoke-WebRequest https://navride.app/ → No se puede resolver el nombre remoto
```

### 10.3 Build local

```
npm run build → FAILED
Error: app/downloads/page.tsx is not a module
Next.js 16.2.6 (Turbopack)
```

### 10.4 Git status (extracto)

```
 M app/globals.css, app/page.tsx, package.json, package-lock.json
?? app/legal/, app/downloads/, app/status/, app/simulator/, components/, ...
```

### 10.5 Archivos clave inspeccionados

- `package.json`, `next.config.ts`, `app/layout.tsx`
- `app/legal/page.tsx`, `app/legal/politica-privacidad/page.tsx`
- `app/legal/eliminacion-datos/page.tsx`, `app/legal/aviso-legal/page.tsx`
- `components/footer/footer.tsx`, `components/navbar/navbar.tsx`
- `components/hero/hero.tsx`

---

## 11. Conclusión final

La web NavRide tiene **contenido legal sustancial ya redactado en el repositorio local** (especialmente privacidad y eliminación de datos), pero **no está en condiciones de servir como URL pública para Google Play** por tres razones convergentes:

1. **Infraestructura:** El dominio no responde correctamente (503 / posible fallo DNS).
2. **Despliegue:** El build de producción falla y el código no está commiteado.
3. **Alineación:** La URL registrada en Play Store (`privacy_policy.html`) no corresponde con la arquitectura real del proyecto (`/legal/politica-privacidad`).

**Prioridad inmediata:** Restaurar DNS + build + deploy, luego alinear la URL de privacidad entre Play Console y la web.

---

*Fin del informe de auditoría. Documento generado en modo solo lectura sobre el código de aplicación; única acción de escritura: este archivo de auditoría.*
