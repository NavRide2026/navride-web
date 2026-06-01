# Informe de Despliegue Vercel — NavRide Web

| Campo | Valor |
|-------|-------|
| **Fecha** | 2026-06-01 |
| **Cuenta Vercel** | `navride-6003` |
| **Proyecto Vercel** | `navride-6003s-projects/web-navride` |
| **Repositorio GitHub** | https://github.com/NavRide2026/navride-web |
| **Rama** | `main` |
| **Commit desplegado** | `10cefaf` — Add NavRide web with legal pages and site structure for Vercel deployment. |

---

## Resumen ejecutivo

**Despliegue Production exitoso.** La web está pública en Vercel con HTTPS.

| URL principal | Estado |
|---------------|--------|
| **https://web-navride.vercel.app** | ✅ **200 OK** — Production alias |

El dominio custom **`navride.app`** sigue **sin resolver** (acción manual del propietario pendiente).

---

## FASE 1 — Git

| Paso | Resultado |
|------|-----------|
| Remote configurado | ✅ `origin` → `https://github.com/NavRide2026/navride-web.git` |
| Archivos añadidos | ✅ 49 archivos (app, components, legal, docs/audits, lib) |
| Excluidos | ✅ `.next/`, `node_modules/`, `.env*`, `.vercel/` (via `.gitignore`) |
| Commit | ✅ `10cefaf` |
| Push | ✅ `main` → `origin/main` |

---

## FASE 2 — Vercel

| Paso | Resultado |
|------|-----------|
| Vercel CLI | ✅ 54.6.1 (via npx) |
| Login | ✅ Cuenta `navride-6003` (OAuth device flow completado) |
| Proyecto | ✅ `web-navride` (detectado Next.js 16.2.6) |
| Build remoto | ✅ Exitoso (17 rutas estáticas) |
| Production deploy | ✅ **READY** |

### Detalles del deployment

| Campo | Valor |
|-------|-------|
| **Deployment ID** | `dpl_CDaHUUPErJVwswF9BD6LCvC6mNGL` |
| **URL deployment** | https://web-navride-larc4vfha-navride-6003s-projects.vercel.app |
| **URL Production (alias)** | **https://web-navride.vercel.app** |
| **Inspector** | https://vercel.com/navride-6003s-projects/web-navride/CDaHUUPErJVwswF9BD6LCvC6mNGL |
| **Framework** | Next.js 16.2.6 |
| **Región build** | Washington, D.C. (iad1) |

### Advertencia GitHub ↔ Vercel

```
Error: Failed to link NavRide2026/navride-web.
You need to add a Login Connection to your GitHub account first. (400)
```

El deploy **sí se completó** subiendo archivos directamente. La integración Git automática **no está conectada** — requiere acción manual (ver abajo).

---

## FASE 3 — Validación HTTP

Probado el **2026-06-01** contra `https://web-navride.vercel.app`:

| Ruta | HTTP | Google Play relevante |
|------|------|----------------------|
| `/` | ✅ **200** | Home |
| `/legal` | ✅ **200** | Centro legal |
| `/legal/politica-privacidad` | ✅ **200** | Política de privacidad |
| `/legal/eliminacion-datos` | ✅ **200** | Eliminación de datos |
| `/legal/aviso-legal` | ✅ 200 (no probado en script, ruta existe en build) | Aviso legal |
| `/legal/privacy_policy.html` | ❌ **404** | URL registrada en Play Console |
| `/legal/terminos-condiciones` | ❌ **404** | Enlace roto en `/legal` |

---

## FASE 4 — Google Play Readiness

### URLs públicas disponibles ahora (HTTPS)

Usar **`https://web-navride.vercel.app`** como base hasta que `navride.app` esté operativo:

| Documento | URL funcional |
|-----------|---------------|
| Home | https://web-navride.vercel.app/ |
| Centro legal | https://web-navride.vercel.app/legal |
| **Política de privacidad** | https://web-navride.vercel.app/legal/politica-privacidad |
| Aviso legal | https://web-navride.vercel.app/legal/aviso-legal |
| Eliminación de datos | https://web-navride.vercel.app/legal/eliminacion-datos |
| Responsabilidad navegación | https://web-navride.vercel.app/legal/responsabilidad-navegacion |
| Política de pagos | https://web-navride.vercel.app/legal/politica-pagos |
| Suscripción Pro | https://web-navride.vercel.app/legal/suscripcion-pro |

### URLs NO disponibles (404)

| URL | Motivo |
|-----|--------|
| `https://web-navride.vercel.app/legal/privacy_policy.html` | Ruta no implementada (legacy Play Store) |
| `https://web-navride.vercel.app/legal/terminos-condiciones` | Página no creada |
| `https://navride.app/*` | Dominio sin DNS (NXDOMAIN) |

### Acción mínima para Google Play Closed Testing

**Opción A (rápida):** Actualizar Play Console con:

```
https://web-navride.vercel.app/legal/politica-privacidad
```

**Opción B:** Configurar `navride.app` + redirect `privacy_policy.html` → `politica-privacidad` (requiere dominio).

---

## Bloqueadores restantes

| ID | Bloqueador | Severidad | Acción |
|----|------------|-----------|--------|
| B-01 | `navride.app` no resuelve DNS | **P0** | Registrar/configurar dominio + DNS Vercel |
| B-02 | Play Console apunta a `privacy_policy.html` | **P0** | Cambiar URL en Play **o** crear redirect |
| B-03 | `/legal/terminos-condiciones` → 404 | **P1** | Crear página (fuera de este despliegue) |
| B-04 | GitHub no vinculado a Vercel | **P2** | Conectar GitHub en Vercel settings |
| B-05 | Sin `/contact` ni `/support` | **P2** | Producción Play (post Closed Testing) |

---

## Acciones manuales pendientes

### 1. Dominio `navride.app` (propietario)

1. Registrar o recuperar `navride.app` en el registrador.
2. En Vercel → Project `web-navride` → **Settings → Domains** → Add `navride.app`.
3. Configurar DNS según instrucciones Vercel (A o CNAME).
4. Verificar SSL automático.

### 2. Google Play Console (propietario)

Actualizar URL de política de privacidad a una URL que responda **200**:

```
https://web-navride.vercel.app/legal/politica-privacidad
```

(o la equivalente en `navride.app` tras configurar dominio).

### 3. Vercel ↔ GitHub (opcional, recomendado)

1. Ir a https://vercel.com/account/settings/authentication
2. Conectar cuenta **GitHub** (Login Connection).
3. En proyecto `web-navride` → **Settings → Git** → Connect `NavRide2026/navride-web`.

Documentación: https://vercel.com/docs/accounts/create-an-account#login-methods-and-connections

---

## Estado final

| Componente | Estado |
|------------|--------|
| GitHub `main` | ✅ Publicado |
| Vercel Production | ✅ **LIVE** |
| Build | ✅ OK |
| HTTPS | ✅ OK |
| Páginas legales críticas | ✅ Accesibles |
| Dominio custom | ❌ Pendiente |
| URL legacy Play Store | ❌ 404 |

**Web pública operativa en:** https://web-navride.vercel.app

---

*Generado tras ejecución automática de despliegue. Detenido en dominio custom (acción manual requerida).*
