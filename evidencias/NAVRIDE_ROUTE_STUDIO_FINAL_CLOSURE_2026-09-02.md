# NAVRIDE_ROUTE_STUDIO_FINAL_CLOSURE — 2026-09-02

## Scope

Cierre final de **NavRide Web Route Studio** en `web-navride` (solo web).  
**No** se tocó NavRide Beta / mobile ni OTA.

## Entregables implementados

| # | Requisito | Estado |
|---|-----------|--------|
| 1 | Mapa primary + sidebar colapsable (desktop 100vw) + drawer móvil `max-h:72dvh` / `overflow-hidden` / scroll `flex-1 min-h-0 overflow-y-auto` | DONE |
| 2 | Básico vs Avanzado con capacidades reales distintas | DONE |
| 3 | Mi ubicación: spinner, marcador, error si denied/unavailable | DONE |
| 4 | Satélite: labels vectoriales OpenFreeMap (sin raster planet overlay) + atribución; ruta encima | DONE |
| 5 | `snapClickToRoute` + `detectAbsurdDetour` al añadir waypoints | DONE |
| 6 | Delete / insert / select waypoint (avanzado) | DONE |
| 7 | Track casing+core, opacidad alta, brillo HSV mín., controles ancho/opacidad, casing satélite | DONE |
| 8 | Route Doctor con `analyzeRouteHealth` (no stub) | DONE |
| 9 | `clearDraft` tras guardado OK | DONE |
| 10 | Undo incluye color; Ctrl+Z/Y; cap ~50 | DONE |
| 11 | Punto inalcanzable: mensaje claro, sin línea recta fingida | DONE |
| 12 | Moto vs coche: UI documenta OSRM driving compartido; modos separados; re-ruta al cambiar | DONE |
| 13 | Autosave recovery + `clearDraft` | DONE |
| 14 | Tests `tests/route-studio/` | DONE |
| 15 | Este archivo de evidencias | DONE |

## Archivos tocados

- `components/gpx/GpxEditor.tsx`
- `components/route-studio/capability-panels.tsx`
- `components/route-studio/track-color-picker.tsx`
- `lib/route-studio/routing.ts`
- `lib/route-studio/mode-capabilities.ts` *(nuevo)*
- `lib/route-studio/track-style.ts` *(nuevo)*
- `lib/route-studio/satellite-style.ts` *(nuevo)*
- `lib/route-studio/route-health.ts` *(sin cambios de API; consumido por UI)*
- `lib/route-studio/autosave.ts` *(clearDraft ya existía; cableado en save)*
- `tests/route-studio/route-studio.test.mjs` *(nuevo)*
- `package.json` (`test:route-studio`, `test`)
- `evidencias/NAVRIDE_ROUTE_STUDIO_FINAL_CLOSURE_2026-09-02.md`

## Comportamiento clave

### Básico
Actividad, localizar, añadir puntos, undo/redo, guardar, exportar. Sin lista de waypoints, sin insert/delete/reorder, sin Route Doctor detallado, sin controles grosor/opacidad.

### Avanzado
Lista waypoints (select / reorder / delete), insert entre puntos, edición nombre segmento, width/opacity, health details + Route Doctor, manejo desvío absurdo, re-ruta al cambiar modo.

### Satélite
Esri World Imagery + source vector `tiles.openfreemap.org/planet` con capas symbol/line de etiquetas (fetch liberty filtrado o fallback sync). Capas de ruta (`nav-casing` / `nav-glow` / `nav-lyr-lines` / puntos) se añaden **después** del estilo → quedan encima de labels.

## Limitaciones restantes

1. **OSRM público**: moto y coche comparten perfil `driving`; no hay restricciones moto reales en web.
2. **Snap / routing** dependen de `router.project-osrm.org` (latencia, rate-limit, cobertura).
3. **Labels vectoriales**: dependen de disponibilidad OpenFreeMap/glyphs; si falla el fetch liberty se usa el estilo sync mínimo.
4. **Elevación / 3D / routing offline**: fuera de alcance web; Route Doctor web es análisis geométrico ligero.
5. **Export GPX**: solo incluye geometría enrutada OK (no waypoints sueltos ni rectas fallidas).
6. **Insertar waypoint**: requiere selección previa + modo Insertar; un clic inserta tras el índice activo.
7. **Historial**: segmentos (incl. color); no historial de título/modo transporte/estilo mapa.
8. **Sin cambios** en app móvil, Beta ni pipeline OTA.

## Verificación (2026-09-02)

```
npm run test:route-studio  → 8/8 pass
npx eslint components/gpx/GpxEditor.tsx components/route-studio/* lib/route-studio/*  → clean
npm run build              → success (Next.js 16.2.6)
```

`tsc --noEmit` reporta errores preexistentes fuera de Route Studio (`lib/supabase/server.ts`, `middleware.ts`, Deno edge function). No bloquean el build (Next omite validación de tipos en este proyecto).

Fecha: 2026-09-02  
Proyecto: `C:\Users\Nitropc\Desktop\web-navride\web-navride`
