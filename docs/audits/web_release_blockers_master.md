# Bloqueadores Web NavRide — Lista Maestra

| Campo | Valor |
|-------|-------|
| **Fecha** | 2026-06-01 |
| **Alcance** | Despliegue web · Google Play Closed Testing · Google Play Producción |
| **Modo** | Auditoría de bloqueadores (sin implementación) |
| **Verificación build** | `npm run build` ejecutado en repo local |

---

## Respuesta directa

### 1. Qué bloquea el despliegue

| # | Bloqueador |
|---|------------|
| B-D01 | `npm run build` **falla** — archivos `page.tsx` vacíos |
| B-D02 | Código desplegable **no está en git remoto** (sin remote, legales sin commitear) |
| B-D03 | Dominio `navride.app` **no resuelve por DNS público** (NXDOMAIN) |
| B-D04 | Sitio responde **HTTP 503** cuando es alcanzable (sin deployment válido) |

### 2. Qué bloquea Google Play

| Ámbito | Bloqueador |
|--------|------------|
| **Closed Testing** | URL registrada `https://navride.app/legal/privacy_policy.html` **inaccesible** (503) y **inexistente en el repo** |
| **Closed Testing** | Política de privacidad real (`/legal/politica-privacidad`) **inaccesible** (503) |
| **Producción** | Todo lo de Closed Testing |
| **Producción** | Ruta `/legal/terminos-condiciones` **no implementada** (404 cuando el sitio esté activo) |
| **Producción** | Rutas `/contact` y `/support` **no existen** |

### 3. Orden exacto de resolución

```
1. B-D01  → Corregir page.tsx vacíos (build)
2. B-D02  → Commitear y publicar código en repositorio remoto
3. B-D04  → Desplegar build exitoso en Vercel
4. B-D03  → Configurar DNS de navride.app hacia Vercel
5. GP-01  → Exponer URL de privacidad que usa Play Console (redirect o archivo estático)
6. GP-02  → Crear /legal/terminos-condiciones
7. GP-03  → Crear rutas públicas de contacto y soporte
```

---

## BUILD

### Resultado

**El build NO puede completarse.**

### Error exacto

```
▲ Next.js 16.2.6 (Turbopack)
✓ Compiled successfully in 4.8s
Running TypeScript ...
Failed to type check.

.next/dev/types/validator.ts:42:39
Type error: File 'C:/Users/navri/Desktop/web-navride/app/downloads/page.tsx' is not a module.
```

### Archivos responsables

| Archivo | Estado | Efecto |
|---------|--------|--------|
| `app/downloads/page.tsx` | **Vacío (0 bytes)** | Provoca fallo TypeScript reportado |
| `app/status/page.tsx` | **Vacío (0 bytes)** | Provocará el mismo fallo al corregir downloads |
| `app/simulator/page.tsx` | **Vacío (0 bytes)** | Provocará el mismo fallo al corregir status |

### Dependencias involucradas

| Dependencia | Rol en build |
|-------------|--------------|
| `next@16.2.6` | Ejecuta build + type check de rutas App Router |
| `typescript@5` | Valida que cada `page.tsx` exporte un módulo válido |
| `eslint-config-next@16.2.6` | No ejecutado en este fallo (build muere antes) |

**Conclusión build:** Vercel no puede generar un artefacto de producción válido hasta que los tres `page.tsx` vacíos exporten un componente React.

---

## DEPLOYMENT

### Vercel

| Elemento | Estado |
|----------|--------|
| `vercel.json` | **No existe** |
| `.vercel/` en repo | **No existe** (ignorado en `.gitignore`) |
| Git remote | **No configurado** |
| Último commit desplegable | `db8c0fc` — solo plantilla create-next-app |
| Páginas legales en commit | **No** — directorio `app/legal/` está untracked |

### next.config.ts

Configuración vacía. No hay `output`, `redirects`, `rewrites` ni headers. **No bloquea por sí solo**, pero tampoco corrige la URL legacy de Play Store.

### Variables de entorno

| Elemento | Estado |
|----------|--------|
| `.env*` en repo | **No existen** |
| Referencias a `process.env` en páginas legales | **No detectadas** |

**Conclusión:** No hay bloqueador por variables de entorno faltantes.

### Por qué el sitio devuelve 503

| Evidencia | Resultado |
|-----------|-----------|
| `GET https://navride.app/` (fetch externo) | **503 Service Unavailable** |
| `GET https://navride.app/legal/privacy_policy.html` | **503** |
| `npm run build` local | **Fallido** |
| Código legal en git remoto | **Ausente** |

**Causa raíz (orden de probabilidad):**

1. **No hay deployment de producción válido** — build roto impide despliegue nuevo; último commit en git no contiene la web actual.
2. **Dominio mal configurado o sin propagación** — DNS público devuelve NXDOMAIN (ver sección DNS); el 503 puede provenir de infraestructura Vercel residual sin proyecto activo.
3. **No es un problema de routing de `privacy_policy.html`** — el 503 afecta también a `/` y rutas existentes.

---

## DNS

### Configuración esperada (Vercel + dominio custom)

| Registro | Valor esperado |
|----------|----------------|
| Apex `navride.app` | A records de Vercel **o** ALIAS/ANAME al target Vercel |
| `www.navride.app` | CNAME → `cname.vercel-dns.com` |
| SSL | Automático vía Vercel tras verificación de dominio |

### Evidencia actual (2026-06-01)

| Prueba | Resultado |
|--------|-----------|
| `nslookup navride.app 8.8.8.8` | **NXDOMAIN** — *Non-existent domain* |
| `Invoke-WebRequest https://navride.app/` (local) | **No se puede resolver el nombre remoto** |
| Fetch externo | **503** (host alcanzable desde otra red, dominio no resuelve localmente) |

### Inconsistencia detectada

- Resolvers públicos (Google DNS): **dominio inexistente**.
- Infraestructura de fetch externa: **503** (implica que en algún momento existió configuración o hay caché/proxy intermedio).

### Causa probable de NXDOMAIN

1. Dominio no registrado o expirado.
2. Registros DNS eliminados o nunca creados en el registrador.
3. Nameservers apuntando a servicio incorrecto sin registros A/CNAME.

**Impacto:** Sin DNS operativo, ninguna URL de la web es accesible públicamente → bloqueo total para Google Play.

---

## LEGAL — Existencia y accesibilidad

> Solo existencia de ruta/archivo y accesibilidad HTTP. Sin evaluación de contenido legal.

### Documentos requeridos para la auditoría

| Documento | Archivo en repo | Ruta Next.js | Accesible en prod |
|-------------|-----------------|--------------|-------------------|
| Política de privacidad | ✅ `app/legal/politica-privacidad/page.tsx` | `/legal/politica-privacidad` | ❌ 503 |
| Términos y condiciones | ❌ **No existe** | `/legal/terminos-condiciones` (solo enlace) | ❌ 404 (cuando sitio activo) |
| Aviso legal | ✅ `app/legal/aviso-legal/page.tsx` | `/legal/aviso-legal` | ❌ 503 |
| Eliminación de datos | ✅ `app/legal/eliminacion-datos/page.tsx` | `/legal/eliminacion-datos` | ❌ 503 |
| Contacto | ❌ **No existe** | — | ❌ |
| Soporte | ❌ **No existe** | — | ❌ |

### URL registrada en Google Play (reportada)

| URL | Archivo/ruta en repo | Accesible |
|-----|----------------------|-----------|
| `https://navride.app/legal/privacy_policy.html` | ❌ **No existe** (sin HTML en `public/`, sin redirect) | ❌ 503 |

### Documentos adicionales presentes en `/legal` (referencia)

| Documento | Existe archivo | Accesible prod |
|-----------|----------------|----------------|
| Índice legal | ✅ `app/legal/page.tsx` | ❌ 503 |
| Suscripción Pro | ✅ `app/legal/suscripcion-pro/page.tsx` | ❌ 503 |
| Política de pagos | ✅ `app/legal/politica-pagos/page.tsx` | ❌ 503 |
| Responsabilidad navegación | ✅ `app/legal/responsabilidad-navegacion/page.tsx` | ❌ 503 |

---

## GOOGLE PLAY — Bloqueadores exactos

### Closed Testing

| ID | Bloqueador | Motivo |
|----|------------|--------|
| GP-CT-01 | Build de producción fallido | Vercel no puede desplegar la web actual |
| GP-CT-02 | Código legal fuera de git remoto | El deployment automático no incluiría las páginas legales |
| GP-CT-03 | DNS `navride.app` no resuelve (NXDOMAIN) | URL de política de privacidad inalcanzable |
| GP-CT-04 | Sitio responde 503 | Google verifica la URL del listing; 503 = fallo de verificación |
| GP-CT-05 | URL Play `privacy_policy.html` no existe en el proyecto | Aunque el sitio estuviera activo, la ruta daría 404 |

### Producción

Incluye **todos** los bloqueadores de Closed Testing, más:

| ID | Bloqueador | Motivo |
|----|------------|--------|
| GP-PR-01 | `/legal/terminos-condiciones` no implementada | Enlace activo en centro legal → 404; app con suscripción requiere condiciones accesibles |
| GP-PR-02 | Sin ruta `/contact` | No hay página pública de contacto del desarrollador |
| GP-PR-03 | Sin ruta `/support` | No hay página pública de soporte |
| GP-PR-04 | `/legal/eliminacion-datos` inaccesible (503) | Requisito de eliminación de cuenta/datos no verificable vía web |

---

## LISTA MAESTRA PRIORIZADA

### P0 — Bloquea despliegue y cualquier verificación de Google Play

| ID | Descripción | Impacto | Dependencia |
|----|-------------|---------|-------------|
| **P0-01** | `app/downloads/page.tsx` vacío rompe `npm run build` | Imposible generar artefacto de producción | Ninguna |
| **P0-02** | `app/status/page.tsx` vacío — mismo patrón de fallo | Build seguirá fallando tras corregir P0-01 | P0-01 |
| **P0-03** | `app/simulator/page.tsx` vacío — mismo patrón de fallo | Build seguirá fallando tras corregir P0-02 | P0-02 |
| **P0-04** | Páginas legales y web actual no commiteadas; sin git remote | Vercel no puede desplegar el código real | P0-03 (build debe pasar antes de desplegar) |
| **P0-05** | DNS `navride.app` → NXDOMAIN en DNS público (8.8.8.8) | Dominio inaccesible desde internet | Ninguna (paralelo a P0-01..04) |
| **P0-06** | Sitio en producción responde HTTP 503 | Ninguna URL verificable por Google Play | P0-03 + P0-04 + P0-05 |
| **P0-07** | URL Play `https://navride.app/legal/privacy_policy.html` no mapeada en repo | Verificación de política de privacidad fallará con 404/503 | P0-06 |

### P1 — Bloquea Closed Testing (asumiendo P0 resueltos)

| ID | Descripción | Impacto | Dependencia |
|----|-------------|---------|-------------|
| **P1-01** | `/legal/politica-privacidad` debe responder HTTP 200 vía HTTPS | URL alternativa real de privacidad debe ser accesible si se actualiza Play Console | P0-06 |
| **P1-02** | Coherencia entre URL en Play Console y ruta web desplegada | Si Play Console mantiene `privacy_policy.html`, se requiere redirect o archivo estático | P0-07 |

> **Nota:** P1-01 y P1-02 son verificaciones post-despliegue. Si P0 no se resuelven, Closed Testing permanece bloqueado.

### P2 — Bloquea Producción (asumiendo P0 y verificación Closed Testing resueltos)

| ID | Descripción | Impacto | Dependencia |
|----|-------------|---------|-------------|
| **P2-01** | Falta `app/legal/terminos-condiciones/page.tsx` | Ruta enlazada desde `/legal` devuelve 404 | P0-06 |
| **P2-02** | Falta página `/contact` | Sin URL pública de contacto del desarrollador | P0-06 |
| **P2-03** | Falta página `/support` | Sin URL pública de soporte | P0-06 |
| **P2-04** | `/legal/eliminacion-datos` debe responder HTTP 200 | Eliminación de datos no demostrable públicamente | P0-06 |

---

## HOJA DE RUTA CERRADA (secuencia ejecutable)

| Paso | Acción | Resuelve | Paralelo |
|------|--------|----------|----------|
| **1** | Implementar export válido en `app/downloads/page.tsx` | P0-01 | — |
| **2** | Implementar export válido en `app/status/page.tsx` | P0-02 | — |
| **3** | Implementar export válido en `app/simulator/page.tsx` | P0-03 | — |
| **4** | Confirmar `npm run build` exitoso | Gate de despliegue | — |
| **5** | Commitear todo el código web + configurar git remote + push | P0-04 | — |
| **6** | Desplegar en Vercel desde repo con build exitoso | P0-06 (parcial) | Paso 5 |
| **7** | Configurar registros DNS de `navride.app` hacia Vercel | P0-05 | Paso 6 |
| **8** | Verificar HTTPS 200 en `/` y `/legal/politica-privacidad` | P0-06, P1-01 | Paso 7 |
| **9** | Crear ruta o redirect para `/legal/privacy_policy.html` **o** actualizar URL en Play Console | P0-07, P1-02 | Paso 8 |
| **10** | Crear `app/legal/terminos-condiciones/page.tsx` | P2-01 | Paso 8 |
| **11** | Crear `app/contact/page.tsx` (o ruta equivalente acordada) | P2-02 | Paso 8 |
| **12** | Crear `app/support/page.tsx` (o ruta equivalente acordada) | P2-03 | Paso 8 |
| **13** | Verificar HTTP 200 en `/legal/eliminacion-datos` | P2-04 | Paso 8 |

**Gate Closed Testing:** Pasos 1–9 completados y verificados.

**Gate Producción:** Pasos 1–13 completados y verificados.

---

## Evidencias

### Build (2026-06-01)

```
npm run build → exit code 1
Type error: File '.../app/downloads/page.tsx' is not a module.
```

### DNS (2026-06-01)

```
nslookup navride.app 8.8.8.8 → Non-existent domain
```

### HTTP producción (2026-06-01)

```
https://navride.app/ → 503 Service Unavailable
https://navride.app/legal/privacy_policy.html → 503 Service Unavailable
```

### Git (2026-06-01)

```
Remote: (ninguno)
Untracked: app/legal/, app/downloads/, app/status/, app/simulator/, components/, ...
Último commit: db8c0fc Initial commit from Create Next App
```

---

*Documento de bloqueadores. Sin mejoras opcionales. Sin trabajo futuro fuera del alcance.*
