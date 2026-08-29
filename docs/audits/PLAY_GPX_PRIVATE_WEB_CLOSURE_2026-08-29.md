# PLAY GPX PRIVATE WEB CLOSURE — 2026-08-29

**Repo:** NavRide2026/navride-web  
**Workstream:** BLOCK 4C — WEB GPX PRIVATE STORAGE COMPATIBILITY  
**Bucket gpx live:** `public = false` (no revertido)

---

## VEREDICTO

**STATICALLY VERIFIED — READY FOR VERCEL DEPLOY**

Commit `6f7d17f` pusheado a `origin/main` (auto-deploy Vercel esperado).

---

## A. Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `lib/gpx/saveRouteToCloud.ts` | Sin `getPublicUrl`; `storage_url` = object path; `objectPathFromStorageRef`; `downloadOwnGpx`; `fetchGpxViaEdge` |
| `components/profile/SavedRoutesList.tsx` | Download autenticado (no `href={storage_url}`) |
| `app/api/gpx/save/route.ts` | Upload con sesión usuario (sin admin/service_role) |
| `docs/audits/PLAY_GPX_PRIVATE_WEB_CLOSURE_2026-08-29.md` | Este informe |

---

## B. Consumidores encontrados

| Ubicación | Antes | Después |
|-----------|-------|---------|
| `saveRouteToCloud` create | `getPublicUrl` → public URL | object path |
| `saveRouteToCloud` update | parser solo public | parser multi-formato |
| `SavedRoutesList` GPX | `<a href={storage_url}>` | `downloadOwnGpx` |
| `app/api/gpx/save` | admin client opcional | server user session |
| `GpxEditor` download local | Blob local (sin Storage) | sin cambio (OK) |
| `app/ruta/[id]` | deep link app scheme | sin bytes/storage_url (OK) |
| `avatars` getPublicUrl | bucket público intencional | sin cambio |

---

## C. getPublicUrl eliminado (GPX)

Sí — ningún `getPublicUrl` sobre bucket `gpx` permanece.

---

## D. Nuevo contrato `storage_url`

Nuevos inserts/updates guardan:

`<USER_UUID>/<timestamp>_<title>.gpx`

Columna sigue llamándose `storage_url` (compatibilidad).

---

## E. Parser compatibilidad histórica

`objectPathFromStorageRef` acepta:

- path relativo
- `/object/public/gpx/`
- `/object/sign/gpx/`
- `/object/authenticated/gpx/`
- URLs absolutas Supabase con esos markers

---

## F. Owner download flow

Sesión → `objectPathFromStorageRef` → `storage.from('gpx').download(path)` → Blob → object URL → revoke.

---

## G. Public route Edge flow

`fetchGpxViaEdge(supabase, routeId)` → Functions `gpx-route-content` (ya ACTIVE live).  
Deep link page no descarga bytes; abre app con `routeId`.

---

## H. Security matrix

| Caso | Esperado |
|------|----------|
| Owner private | ALLOW Storage RLS |
| USER B private | DENY |
| Anon private | DENY |
| is_public | Edge gpx-route-content |
| Bucket public | false |

---

## I. Service-role review

| Uso | Estado |
|-----|--------|
| `lib/supabase/admin.ts` | Server-only env |
| `api/gpx/save` | **Ya no** usa admin para GPX |
| Client / NEXT_PUBLIC | sin service_role |
| Avatars API | server; getPublicUrl avatars OK |

---

## J. Build/lint

- `npm run build`: **OK** (Next.js 16.2.6)
- `npm run lint`: errores preexistentes (GpxEditor refs, set-state-in-effect en SavedRoutesList loadRoutes, etc.) — no introducidos por este cierre GPX

## K. Deployment status

- Commit: `6f7d17f` en `main`
- Push: `b4a66ce..6f7d17f` → `origin/main`
- Vercel: auto-deploy desde main

## L. Remaining blockers

Ninguno de código GPX public-URL en web. Confirmar en Vercel dashboard que el deploy de `6f7d17f` quedó Ready.
