# NavRide Web — Legal Audit

**Fecha:** 2026-06-01  
**Producción:** https://web-navride.vercel.app  
**Referencia app:** `documentos navride web` / NavRideLegalCatalog  
**Modo:** Solo auditoría — sin modificaciones

---

## Puntuación Legal: **7.0 / 10**

---

## Mapa legal completo

### Capa 1 — HTML estático canónico (servido en producción)

| Documento | URL | Generación | HTTP | Tema visual |
|-----------|-----|------------|------|-------------|
| Política privacidad | `/legal/privacy_policy.html` | Manual + sanitize script | 200 | **Claro** (#222) |
| Aviso legal | `/legal/legal-notice.html` | Script prebuild | 200 | Dark OEM |
| Términos | `/legal/terms.html` | Script | 200 | Dark OEM |
| Suscripción | `/legal/subscription.html` | Script | 200 | Dark OEM |
| Pagos/reembolsos | `/legal/refund.html` | Script | 200 | Dark OEM |
| Eliminación datos | `/legal/data-deletion.html` | Script | 200 | Dark OEM |
| GPS disclaimer | `/legal/gps-disclaimer.html` | Script | 200 | Dark OEM |
| Licencias | `/legal/licenses.html` | Script | 200 | Dark OEM |

### Capa 2 — Hub React V2
- **`/legal`** — enlaza 8 documentos + atribuciones con URLs externas clicables ✅

### Capa 3 — Páginas React legacy (redirect 308)
| Ruta React | Redirect | Contenido React | Riesgo |
|------------|----------|-----------------|--------|
| `/legal/politica-privacidad` | privacy_policy.html | Firebase, Stripe, PRO | Alto si redirect falla |
| `/legal/aviso-legal` | legal-notice.html | Suscripción PRO | Medio |
| `/legal/eliminacion-datos` | data-deletion.html | Firebase, Stripe | Alto |
| `/legal/responsabilidad-navegacion` | gps-disclaimer.html | Contenido extenso propio | Bajo |
| `/legal/politica-pagos` | refund.html | **PLACEHOLDER** | Alto |
| `/legal/suscripcion-pro` | subscription.html | **PLACEHOLDER** | Alto |

### Capa 4 — Redirect sin page.tsx
- `/legal/terminos-condiciones` → `/legal/terms.html` ✅ (308 verificado)

---

## Privacidad

### Contenido HTML canónico (`privacy_policy.html`)
- Responsable: Daniel Montero Mora ✅
- Ubicación: Mollet del Vallès, Barcelona, Cataluña, España ✅ (sin DNI/calle — auditado)
- Email: navride@outlook.com ✅
- Ámbito: GPX, offline/online, NavRide Adventure, Google Play ✅
- Datos: GPS local, GPX local, Google Play Billing, OSRM, tiles, Open-Meteo ✅
- **No Firebase analytics** en tratamiento activo ✅
- Permisos Android listados ✅
- Derechos RGPD + AEPD ✅
- Última actualización: 2026-05-30 ✅

### Incoherencias privacidad
1. **React legacy** contradice HTML (Firebase, Stripe, cuentas)
2. **`privacyPolicyPublicUrl` en constants** apunta a GitHub Pages, no Vercel
3. **Estilo visual claro** vs identidad dark resto del sitio
4. Mención "Firebase Analytics" en sección "datos que NO recogemos" — correcto semánticamente pero puede confundir

---

## Términos y condiciones

### `/legal/terms.html`
- Planes Free/Rider/Pilot descritos ✅
- Rider marcado como referencia UI ✅
- Uso seguro, GPS, GPX, OSRM driving profile ✅
- Ley española, Barcelona ✅
- Enlaces a subscription + refund ✅

**Coherencia app:** ✅ Alineado con NavRideLegalContent

---

## Eliminación de datos

### `/legal/data-deletion.html`
- Datos en dispositivo, sin servidor NavRide ✅
- Rutas: Exportar, Eliminar, Eliminar cuenta, Desinstalar ✅
- Suscripción Google Play no se cancela al borrar datos locales ✅
- Email contacto ✅

### React legacy (`eliminacion-datos/page.tsx`)
- ❌ Firebase, Stripe, "documento usuario Firebase"
- Redirect protege producción

**Play Data Safety:** HTML canónico es coherente con app offline-first ✅

---

## Contacto

### `/contacto`
- Titular: Daniel Montero Mora ✅
- Ubicación genérica ✅ (sin DNI)
- Email navride@outlook.com ✅
- Versión app ✅

**Requisito Play soporte:** ✅ Email accesible

---

## Suscripción y pagos

### HTML canónico
- **subscription.html:** NavRide Adventure, SKU, Google Play Billing, renovación ✅
- **refund.html:** Pagos vía Google Play, reembolsos según política Google ✅

### Placeholders en código
- `politica-pagos/page.tsx`: "AQUÍ VA LA POLÍTICA DE PAGOS"
- `suscripcion-pro/page.tsx`: "AQUÍ VAN LAS CONDICIONES DE SUSCRIPCIÓN PRO"

**Producción:** Redirects funcionan ✅

---

## Atribuciones y licencias

### `/legal/licenses.html` + hub `/legal`
| Proveedor | URL en código | Clicable |
|-----------|---------------|----------|
| OpenStreetMap | openstreetmap.org/copyright | ✅ |
| CARTO | carto.com/attributions | ✅ |
| OpenTopoMap | opentopomap.org/about | ✅ |
| OSRM | project-osrm.org | ✅ |
| Open-Meteo | open-meteo.com | ✅ |
| Google Play | play.google.com/about/play-terms | ✅ |

**Verificación HTTP externa:** No ejecutada en esta auditoría (URLs estándar conocidas).

---

## Enlaces rotos (verificación producción)

| URL | Estado |
|-----|--------|
| `/legal/privacy_policy.html` | 200 ✅ |
| `/legal/terms.html` | 200 ✅ |
| `/legal/data-deletion.html` | 200 ✅ |
| `/legal/licenses.html` | 200 ✅ |
| `/legal/politica-privacidad` | 308 → html ✅ |
| `/legal/terminos-condiciones` | 308 → html ✅ |
| `navride2026.github.io/.../privacy_policy.html` | ⚠️ Referenciado en constants; histórico 404 |

---

## ¿Cumpliría requisitos Google Play?

| Requisito Play | Estado | Evidencia |
|----------------|--------|-----------|
| Política privacidad URL pública HTTPS | ✅ | Vercel 200 |
| Política accesible sin login | ✅ | |
| Eliminación de datos documentada | ✅ | data-deletion.html |
| Contacto desarrollador | ✅ | contacto + soporte |
| Términos / suscripción | ✅ | terms + subscription |
| Coherencia Data Safety vs política | ✅ HTML | ⚠️ React legacy |
| Atribuciones mapas | ✅ | licenses.html |
| Sin datos sensibles expuestos (DNI) | ✅ | Sanitizado |

**Veredicto Play legal (web sola):** **Apto para respaldar ficha** si Play Console apunta a URLs Vercel HTML.

**Bloqueador ecosistema:** App Flutter puede seguir apuntando a GitHub Pages ❌

---

## Incoherencias detectadas

| # | Incoherencia | Severidad |
|---|--------------|-----------|
| 1 | Dos universos legal: HTML (Google Play) vs React (Firebase/Stripe) | P0 |
| 2 | URL privacidad constants ≠ producción | P0 |
| 3 | Terminología PRO vs Pilot/Adventure en legacy | P1 |
| 4 | Fechas: HTML 2026-05-30 vs React eliminacion 2026-03-08 | P2 |
| 5 | privacy_policy tema claro vs dark | P2 |
| 6 | Placeholders en código fuente | P1 |
| 7 | `_zip_extract_sample` con NIF antiguo en repo | P3 (no desplegado) |

---

## Contenido incompleto

| Área | Estado |
|------|--------|
| HTML canónico 8/8 | Completo para beta |
| React legacy 6/6 | 2 placeholders, 4 desactualizados |
| Licencias MBTiles detalle | Mencionado en app catalog; breve en web |
| Política cookies | No existe (app no usa cookies web) ✅ N/A |
| DPA procesadores | Resumido en privacidad sección terceros |

---

## Generación legal (build pipeline)

```
prebuild → generate-legal-html.mjs
  → genera 7 HTML dark
  → sanitizePrivacyPolicy() en privacy_policy.html
  → NO copia desde documentos externos (corregido)
```

**Riesgo build Vercel:** Si `privacy_policy.html` no está en repo desplegado, sanitize no crea archivo — actualmente en repo ✅

---

## Resumen legal

La **capa servida al usuario vía redirects + HTML estático** es coherente con NavRide app y Google Play Closed Testing.

La **deuda en código fuente React** representa riesgo de regresión y confusión en auditorías futuras.

**Recomendación (diagnóstico):** Tratar HTML estático como única fuente de verdad legal en web; aislar o eliminar React legal del repositorio en fase posterior.
