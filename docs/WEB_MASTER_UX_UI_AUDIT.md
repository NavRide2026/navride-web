# NavRide Web — UX/UI Audit

**Fecha:** 2026-06-01  
**Producción:** https://web-navride.vercel.app  
**Enfoque:** Primera impresión, confianza, OEM premium, navegación, responsive

---

## Puntuación UX/UI: **7.0 / 10**

---

## Primera impresión (Home `/`)

### Lo que funciona
- **Hero claro:** "Navegación GPX para moto, trail y aventura" — posicionamiento inmediato
- **Tags de uso:** Moto, Trail, Adventure, Touring, Viajes, Carretera secundaria
- **CTA dual:** Producto + Planes — flujo lógico
- **Mockup dispositivo** con splash real de la app — ancla visual credibilidad
- **Nota beta honesta:** v0.9.0, trial 7 días, Google Play
- **Paleta OEM dark** (#050608, #FF5A1F, #35C759) coherente con app Flutter

### Lo que resta confianza
- Sin badge Google Play ni enlace de descarga
- Sin capturas reales de navegación/HUD/Rally (solo splash)
- Sin prueba social (reviews, beta testers, prensa)
- Footer minimal — no transmite empresa establecida

### Veredicto primera impresión
**¿Parece aplicación profesional?** Sí, en rutas V2.  
**¿Parece startup?** Parcialmente — tono técnico ayuda, pero escasez de contenido la delata como proyecto early-stage.  
**¿Parece landing improvisada?** No en home V2; sí si el usuario cae en `/simulator` o `/downloads`.  
**¿Parece producto listo para mercado?** Beta cerrada sí; mercado masivo no.

---

## Navegación

### Navbar V2
- Enlaces: Producto, Planes, Roadmap, Noticias, Legal, Contacto
- CTA Soporte (naranja) — correcto para Play
- **Menú hamburguesa móvil** con aria-label ✅
- Logo + wordmark ✅

### Problemas
- **Rutas legacy no enlazadas** pero descubribles (URL directa, crawlers)
- Sin breadcrumbs en páginas internas
- Legal hub bien estructurado; footer solo enlaza subset
- No hay búsqueda (aceptable para tamaño actual)

### Flujos usuario Play
```
Google Play → ¿web? → /legal/privacy_policy.html ✅
Usuario con duda → /soporte ✅
Contacto legal → /contacto ✅
Conocer producto → /producto ✅
```
**Gap:** Play listing → web descarga (inexistente)

---

## Página por página

| Página | Claridad | Confianza | Premium | Notas |
|--------|----------|-----------|---------|-------|
| `/` | 8 | 7 | 8 | Mejor página del sitio |
| `/producto` | 9 | 8 | 7 | Copy honesto, bien estructurado |
| `/planes` | 8 | 8 | 7 | Rider marcado "referencia UI" — transparente |
| `/roadmap` | 7 | 7 | 6 | Funcional pero escueto |
| `/noticias` | 6 | 6 | 6 | 2 posts — parece plantilla |
| `/legal` | 9 | 8 | 7 | Hub profesional, atribuciones claras |
| `/contacto` | 8 | 8 | 6 | Datos mínimos pero suficientes |
| `/soporte` | 8 | 8 | 7 | FAQ útil; falta ampliar |
| `/tutorials` | 4 | 5 | 5 | Simulador EN, no tutoriales |
| `/simulator` | 2 | 3 | 3 | Stub |
| `/downloads` | 2 | 3 | 3 | Stub |
| `/status` | 2 | 3 | 3 | Stub |
| Legal HTML | 8 | 8 | 6 | privacy_policy tema claro rompe OEM |

---

## Branding visual

| Elemento | Estado | Nota |
|----------|--------|------|
| Logo navbar | ✅ | navride_logo.png 36px |
| Favicon | ✅ | Mismo logo PNG (no .ico optimizado) |
| Colores marca | ✅ | Alineados con navride_colors.dart |
| Tipografía | ✅ | Inter — legible, moderna |
| Iconografía | ⚠️ | Lucide en features; sin set propio NavRide |
| Tarjetas | ✅ | border white/10, bg #101114/#1C1C1E |
| Jerarquía | ✅ | SectionHeading consistente en V2 |
| Tono copy | ✅ | Español técnico, sin hype SaaS |
| Legacy visual | ❌ | text-7xl font-black, tracking extremo |

### Alineación NavRide Adventure / Trail / OEM
- **Adventure/Trail:** tags y copy offroad ✅
- **OEM:** dark, precisión, sin gradientes marketing ✅
- **Premium:** suficiente en V2; no nivel Calimoto aún

---

## Legibilidad

- **Tamaños:** body text-sm/lg adecuados en móvil
- **Contraste:** textos white/60 legibles; white/40 en footer/notas — revisar WCAG
- **Longitud línea:** max-w-3xl/6xl bien aplicado
- **Legal HTML:** line-height 1.7 ✅; privacy_policy font-size 0.95rem ✅

---

## Responsive

| Breakpoint | Comportamiento | Problemas |
|------------|----------------|-----------|
| Móvil (<640px) | Navbar hamburger, stack hero, cards 1 col | Hero mockup puede dominar scroll |
| Tablet | grid 2 col features/planes | OK |
| Desktop | max-w-6xl centrado | OK |
| Ultrawide | Contenido centrado con márgenes amplios | No hay max-width en simulador — OK |

### Móvil-first (prioridad Play)
- Navbar usable ✅
- CTAs thumb-friendly (py-3, rounded-full) ✅
- Legal HTML viewport meta ✅
- Imagen hero priority — **203 KB PNG** puede ralentizar 3G

### Simulador `/tutorials`
- Título `text-7xl` — overflow probable en móvil estrecho
- Controles flex-wrap ✅

---

## Accesibilidad (diagnóstico código)

| Criterio | Estado |
|----------|--------|
| lang="es" | ✅ |
| alt en imágenes Next | ✅ (2 imágenes) |
| aria-label menú móvil | ✅ |
| skip link | ❌ |
| landmarks main/header/footer | Parcial (main en PageLayout) |
| FAQ details/summary | ⚠️ sin aria-expanded |
| Simulador botones | ❌ sin labels |
| focus visible | shadcn base ✅ |
| color solo para info | ⚠️ roadmap usa color + texto |

---

## UX/UI — Comunicación

### Comunica bien
- Qué es NavRide (GPX offroad moto/trail)
- Trial 7 días y suscripción Play
- Planes con honestidad sobre Rider
- Legal accesible y centralizado
- Beta status transparente

### Comunica mal
- `/tutorials` sugiere aprendizaje, muestra simulador toy
- `/downloads` promete descargas, está vacío
- `/news` EN vs `/noticias` ES — inconsistencia idioma
- Sin CTA "Descargar en Google Play"

### Falta comunicar
- Screenshots reales de la app en uso
- Requisitos mínimos Android
- Qué es "approach" vs "navegación GPX" visualmente
- Proceso beta cerrada / cómo unirse
- Diferencia visual Free vs Pilot

---

## Comparativa percepción (confianza / imagen)

| Producto | NavRide Web V2 |
|----------|----------------|
| Google Maps | NavRide más nicho, menos institucional |
| Waze | Menos casual, más técnico |
| Calimoto | Calimoto gana en riqueza visual y store presence |
| Kurviger | Kurviger gana en profundidad contenido; NavRide comparable en dark OEM |
| DMD2 | NavRide más pulido visualmente que DMD2 web |

---

## Recomendaciones UX/UI (solo diagnóstico — no implementar)

1. Ocultar o eliminar stubs antes de tráfico público
2. Sustituir splash por 3–5 screenshots reales de app
3. Añadir badge Google Play cuando listing exista
4. Unificar idioma ES en todo el sitio
5. Ampliar FAQ en soporte
6. Alinear tema dark en privacy_policy.html
7. Tabla comparativa planes (visual)
