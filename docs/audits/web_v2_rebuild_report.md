# NavRide Web V2 — Informe de reconstrucción

**Fecha:** 2026-06-01  
**Proyecto:** `web-navride` (Next.js 16.2.6)  
**Referencia:** carpeta `documentos navride web` + catálogo legal Flutter  
**Build:** `npm run build` → exit 0 (22 rutas estáticas)

---

## Resumen ejecutivo

Se reconstruyó la web como extensión del ecosistema NavRide (OEM dark, copy real de la app, legal Play-ready). No es una landing SaaS genérica: identidad extraída de `navride_colors.dart`, `navride_legal_catalog.dart` y assets de la app.

---

## Secciones creadas / reconstruidas

| Sección | Ruta | Estado |
|---------|------|--------|
| Home (hero + funcionalidades) | `/` | ✅ Reconstruido |
| Producto | `/producto` | ✅ Nuevo |
| Planes (Free / Rider / Pilot) | `/planes` | ✅ Nuevo |
| Roadmap editable | `/roadmap` | ✅ Reconstruido |
| Noticias editable | `/noticias` | ✅ Nuevo |
| Centro legal | `/legal` | ✅ Reconstruido |
| Contacto | `/contacto` | ✅ Nuevo |
| Soporte Google Play | `/soporte` | ✅ Nuevo |

**Datos editables:** `lib/site/constants.ts` → `ROADMAP_ITEMS`, `NEWS_ITEMS`, `PLANS`, `ATTRIBUTIONS`.

---

## Páginas legales HTML (Google Play / GitHub Pages compatible)

Generadas en `public/legal/` vía `npm run generate:legal` (prebuild automático):

| Documento | URL |
|-----------|-----|
| Política de privacidad (canónica app) | `/legal/privacy_policy.html` |
| Aviso legal | `/legal/legal-notice.html` |
| Términos y condiciones | `/legal/terms.html` |
| Condiciones de suscripción | `/legal/subscription.html` |
| Política de pagos / reembolsos | `/legal/refund.html` |
| Eliminación de datos | `/legal/data-deletion.html` |
| Responsabilidad GPS | `/legal/gps-disclaimer.html` |
| Licencias y atribuciones | `/legal/licenses.html` |

**Redirects** (rutas antiguas → HTML canónico): configurados en `next.config.ts`.

---

## URLs de la aplicación Next

| URL | Tipo |
|-----|------|
| `/` | Marketing |
| `/producto` | Marketing |
| `/planes` | Marketing |
| `/roadmap` | Contenido editable |
| `/noticias` | Contenido editable |
| `/legal` | Hub legal + atribuciones |
| `/contacto` | Contacto real |
| `/soporte` | FAQ + enlaces Play |
| `/legal/*.html` | Estático (8 archivos) |
| `/news` | Redirect → `/noticias` |

**Legacy (sin eliminar, con redirect donde aplica):** `/legal/politica-privacidad`, `/tutorials`, `/simulator`, `/downloads`, `/status`.

---

## Identidad visual aplicada

- **Fondo:** `#050608` (navigationBackground)
- **CTA:** `#FF5A1F` (ctaOrange)
- **Acento:** `#35C759` (navGreen)
- **Superficies:** `#101114`, `#1C1C1E`
- **Tipografía:** Inter (Google Fonts)
- **Assets:** `public/navride_logo.png`, `navride_splash.png`, `logo_navride.png`

---

## Enlaces legales verificados (contenido)

| Enlace | Origen | Estado |
|--------|--------|--------|
| `navride@outlook.com` | Catálogo legal | ✅ mailto en contacto/soporte/HTML |
| Política privacidad app | `assets/legal/privacy_policy.html` | ✅ Copiada tal cual |
| Google Play terms | `licenses.html` | ✅ URL incluida |
| AEPD | `privacy_policy.html` | ✅ https://www.aepd.es |
| Google privacy | `privacy_policy.html` | ✅ https://policies.google.com/privacy |

---

## Enlaces de atribución verificados (clicables en `/legal` y `licenses.html`)

| Proveedor | URL |
|-----------|-----|
| OpenStreetMap | https://www.openstreetmap.org/copyright |
| CARTO | https://carto.com/attributions |
| OpenTopoMap | https://opentopomap.org/about |
| OSRM | https://project-osrm.org/ |
| Open-Meteo | https://open-meteo.com/ |
| Google Play | https://play.google.com/about/play-terms/ |

---

## Google Play compliance — checklist

| Requisito | Estado |
|-----------|--------|
| HTTPS (Vercel) | ✅ En producción |
| Política de privacidad accesible | ✅ `/legal/privacy_policy.html` |
| Eliminación de datos accesible | ✅ `/legal/data-deletion.html` |
| Contacto / soporte | ✅ `/contacto`, `/soporte` |
| Navegación móvil | ✅ Navbar responsive + menú hamburguesa |
| Copy sin Firebase/Stripe inventado | ✅ Alineado con app |
| Términos accesibles | ✅ `/legal/terms.html` |

---

## Bloqueadores restantes

1. **URL canónica Flutter vs web:** La app referencia `https://navride2026.github.io/NavRide/legal/privacy_policy.html` (404 histórico). La web Vercel sirve `/legal/privacy_policy.html` correctamente. **Acción:** actualizar `NavRideLegalCatalog.privacyPolicyPublicUrl` en Flutter a `https://web-navride.vercel.app/legal/privacy_policy.html` o desplegar GitHub Pages desde `assets/legal/`.

2. **Dominio `navride.app`:** NXDOMAIN — no operativo.

3. **Deploy pendiente:** Cambios V2 no desplegados en esta sesión (build local OK). Ejecutar `npx vercel --prod` para publicar.

4. **GitHub ↔ Vercel:** Sin conexión automática (requiere Login Connection en Vercel).

5. **Plan Rider:** Documentado como referencia UI — no vendido en Play (copy explícito, no prometer compra).

6. **Páginas legacy React** (`/legal/politica-privacidad`, etc.): siguen existiendo con copy antiguo; redirects apuntan a HTML canónico. Opcional: eliminar páginas React duplicadas en limpieza futura.

7. **`/legal/terminos-condiciones`:** No existía; cubierto por `/legal/terms.html`. Añadir redirect si la app lo referencia.

---

## Archivos clave creados/modificados

- `lib/site/constants.ts` — copy, planes, roadmap, noticias, atribuciones
- `scripts/generate-legal-html.mjs` — generación HTML legal
- `components/navbar/navbar.tsx`, `footer/footer.tsx`, `hero/hero.tsx`, `features/features.tsx`
- `app/producto`, `app/planes`, `app/contacto`, `app/soporte`, `app/noticias`
- `app/legal/page.tsx`, `app/roadmap/page.tsx`, `app/layout.tsx`
- `public/legal/*.html` (8 documentos)
- `next.config.ts` — redirects legales

---

## Comandos

```bash
npm run generate:legal   # Regenerar HTML legal
npm run build            # prebuild + build
npm run dev              # desarrollo local
```

---

## Próximo paso recomendado

1. Desplegar a Vercel (`npx vercel --prod --yes`)
2. Actualizar URL privacidad en Flutter + Play Console
3. Verificar HTTP 200 en producción para `/legal/privacy_policy.html`
4. Commit + push cuando el usuario lo solicite
