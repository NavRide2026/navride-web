# NavRide Web — Google Play Readiness

**Fecha:** 2026-06-01  
**Producción:** https://web-navride.vercel.app  
**App:** NavRide v0.9.0 beta · Android · Closed Testing  
**Modo:** Solo auditoría

---

## Puntuación Google Play (web como soporte): **7.5 / 10**

---

## Contexto

Google Play exige que la ficha de la app tenga URLs accesibles para:
- Política de privacidad
- (Recomendado/frecuente) Términos, eliminación de datos, soporte

La web NavRide actúa como **infraestructura legal y de confianza** para la app, no como canal de distribución principal (aún).

---

## Checklist Play Store — Web

| Requisito | ¿Cumple? | URL / evidencia | Notas |
|-----------|----------|-----------------|-------|
| HTTPS | ✅ | Vercel TLS | |
| Política privacidad pública | ✅ | `/legal/privacy_policy.html` → 200 | Canónica web |
| URL privacidad accesible sin login | ✅ | Verificado HTTP | |
| Eliminación de datos documentada | ✅ | `/legal/data-deletion.html` → 200 | |
| Términos / condiciones | ✅ | `/legal/terms.html` → 200 | |
| Condiciones suscripción | ✅ | `/legal/subscription.html` | NavRide Adventure |
| Política pagos | ✅ | `/legal/refund.html` | Google Play Billing |
| Contacto desarrollador | ✅ | `/contacto` + mailto | navride@outlook.com |
| Soporte usuario | ✅ | `/soporte` | FAQ + email |
| Descargo GPS / navegación | ✅ | `/legal/gps-disclaimer.html` | |
| Atribuciones mapas | ✅ | `/legal/licenses.html` | OSM, CARTO, etc. |
| Navegación móvil | ✅ | Navbar responsive | |
| Contenido legal coherente con app | ✅ HTML | ⚠️ React legacy no |
| Sin promesas falsas en web V2 | ✅ | Planes, features | |
| DNI/datos sensibles titular | ✅ | Sanitizado | Solo ciudad/región |

---

## URLs para Play Console (recomendadas)

| Campo Play Console | URL recomendada |
|--------------------|-----------------|
| **Privacy Policy** | `https://web-navride.vercel.app/legal/privacy_policy.html` |
| Delete account URL (si aplica) | `https://web-navride.vercel.app/legal/data-deletion.html` |
| Website (opcional) | `https://web-navride.vercel.app` |
| Email | navride@outlook.com |

### URL actual en app Flutter (desalineada)

```
https://navride2026.github.io/NavRide/legal/privacy_policy.html
```

**Estado histórico:** 404 en GitHub Pages  
**Acción requerida (app, no web):** Actualizar `NavRideLegalCatalog.privacyPolicyPublicUrl`  
**Bloqueador ecosistema:** ⚠️ P0 — no es fallo de la web Vercel

---

## Closed Testing vs Producción

### Closed Testing (hoy)
| Criterio | Listo |
|----------|-------|
| Legal URLs HTTPS | ✅ |
| Contacto email | ✅ |
| Política coherente Data Safety | ✅ (HTML) |
| Beta comunicada en web | ✅ v0.9.0 |
| Stubs no enlazados desde app | ✅ (app no deep-linka /downloads) |

**Veredicto Closed Testing:** **LISTO** si Play Console usa URLs Vercel.

### Producción pública (futuro)
| Criterio | Listo |
|----------|-------|
| Dominio propio marca | ❌ navride.app NXDOMAIN |
| Store listing link en web | ❌ |
| Stubs eliminados/noindex | ❌ |
| SEO básico | ❌ |
| Screenshots reales marketing | ❌ |
| Versión estable (no beta label) | ❌ app 0.9.0 |

**Veredicto Producción pública:** **NO LISTO** — requiere app 1.0 + web polish + dominio.

---

## Data Safety ↔ Web alignment

| Declaración típica Data Safety | Web HTML | App catalog |
|-------------------------------|----------|-------------|
| Ubicación GPS | ✅ Local | ✅ |
| Archivos GPX locales | ✅ | ✅ |
| Google Play Billing | ✅ | ✅ |
| OSRM coordenadas muestreadas | ✅ | ✅ |
| Tiles mapas | ✅ + atribuciones | ✅ |
| Open-Meteo opcional | ✅ | ✅ |
| Sin cuenta NavRide servidor | ✅ | ✅ |
| Sin Firebase Analytics | ✅ HTML | ✅ |
| Sin Stripe | ✅ HTML | ✅ |

**Riesgo:** Revisores o usuarios que encuentren React legacy verían Firebase/Stripe — mitigado por redirects en producción.

---

## Coherencia legal web ↔ ficha Play

### Lo que Play verificará
1. Email contacto = mismo titular ✅
2. Política menciona permisos Android ✅
3. Suscripción = Google Play ✅
4. Eliminación datos explicada ✅

### Gaps ficha Play (no web)
- Screenshot reales en Play listing
- Clasificación contenido
- Países distribución
- Formulario Data Safety completado en Console

---

## Flujos usuario Play → Web

```
Instala app → Legal in-app → ¿URL externa?
  → Debe resolver privacy_policy.html ✅ (si URL Vercel)

Usuario cancela suscripción → /soporte FAQ ✅

Usuario pide borrar datos → /legal/data-deletion.html ✅
  → In-app: Ajustes → Privacidad ✅ alineado

Revisor Play → abre privacy URL
  → 200, legible, español ✅
```

---

## Riesgos Play específicos

| Riesgo | Probabilidad | Impacto | Mitigación actual |
|--------|--------------|---------|-------------------|
| URL privacidad app ≠ web | Alta | Rechazo/confusión | Cambiar catalog Flutter |
| Stub /downloads indexado | Baja | Percepción negativa | noindex futuro |
| Política clara vs Data Safety | Baja | Revisión manual | HTML alineado |
| Email soporte no responde | Operacional | Malus reseñas | Fuera alcance web |
| Beta label vs producción | Media | Expectativas | Web honesta ✅ |

---

## ¿La web está preparada para respaldar una ficha Play?

### Sí, para:
- Closed Testing / beta cerrada
- Declaración legal pública
- Soporte post-instalación básico
- Atribuciones obligatorias mapas

### No yet, para:
- Lanzamiento masivo con web como hub de conversión
- Marca en dominio propio
- Paridad marketing con competidores (Calimoto/Kurviger)

---

## Acciones mínimas pre-Play (ecosistema, no solo web)

| # | Acción | Responsable |
|---|--------|-------------|
| 1 | Play Console → privacy URL Vercel | Dev app |
| 2 | Flutter catalog URL update | Dev app |
| 3 | Verificar 200 post-deploy en CI | Web |
| 4 | Confirmar email navride@outlook.com activo | Titular |
| 5 | Data Safety form = copy HTML | Dev app |

---

## URLs verificadas en producción (2026-06-01)

```
200  /legal/privacy_policy.html
200  /legal/terms.html
200  /legal/data-deletion.html
200  /legal/subscription.html
200  /legal/refund.html
200  /legal/gps-disclaimer.html
200  /legal/licenses.html
200  /legal/legal-notice.html
200  /contacto
200  /soporte
308  /legal/politica-privacidad → privacy_policy.html
308  /legal/terminos-condiciones → terms.html
```

---

## Conclusión Play Readiness

**La web Vercel cumple el rol de infraestructura legal para Google Play Closed Testing.**

El bloqueador principal no es la web, sino la **sincronización de URLs entre app Flutter, Play Console y dominio final**.

Publicación Play con confianza total requiere:
1. Unificar URL privacidad en los tres puntos
2. Eliminar deuda legal React del repo
3. Añadir enlace Play Store cuando exista listing
4. Dominio propio cuando esté operativo
