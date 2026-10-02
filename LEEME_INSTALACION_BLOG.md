# 🏍️ NavRide — Módulo de Blog de Alto Tráfico & Estrategia SEO 2026/2027

Este paquete contiene la implementación completa, optimizada y compilada del sistema de Blog para **NavRide**, diseñado específicamente para maximizar el tráfico orgánico en el nicho de moto trail, off-road, tracks GPX y navegación de aventura.

---

## 📦 Contenido del Paquete

1. **`app/blog/page.tsx`**:
   - Página principal del blog (`/blog`) con diseño dark nativo de NavRide (`#050608` / `#101114`).
   - Buscador en tiempo real por palabras clave, tags y categorías.
   - Píldoras de filtro por temática con contadores de artículos.
   - Tarjeta hero destacada con ficha técnica de navegación.
   - Banner de llamada a la acción hacia el **Editor GPX** (`/editor-gpx`).

2. **`app/blog/[slug]/page.tsx`**:
   - Página dinámica de cada artículo (`/blog/[slug]`) con **Static Site Generation (SSG)** para carga instantánea (<1s LCP).
   - Barra superior de progreso de lectura interactiva.
   - Migas de pan (*Breadcrumbs*) semánticas.
   - Botón de compartir y copiar enlace al portapapeles.
   - **Perfil Altimétrico Interactivo (SVG):** Gráfico de cotas máximas, desniveles acumulados y desglose porcentual de terreno (% pista, % grava, % enlace).
   - Cajas de consejos técnicos off-road y avisos de seguridad.
   - Tablas comparativas nativas de alto contraste.
   - **Acordeón interactivo de Preguntas Frecuentes (FAQ)**.
   - Gancho táctico de búsqueda de marca (*Brand-Search Lift*).
   - Bloque de conversión in-article con botón hacia el Editor GPX o la App.
   - Tarjeta de autor con biografía E-E-A-T.
   - **Datos Estructurados Schema.org:** `TechArticle`, `BreadcrumbList` y `FAQPage` en formato JSON-LD.

3. **`components/blog/`**:
   - `blog-search-filter.tsx`: Buscador y filtrado en vivo en el cliente.
   - `reading-progress.tsx`: Barra de progreso de lectura.
   - `elevation-chart.tsx`: Gráfico altimétrico interactivo SVG y barras de composición de firme.
   - `faq-accordion.tsx`: Acordeón accesible de preguntas frecuentes.
   - `share-bar.tsx`: Copiado de enlace y feedback visual.

4. **`lib/blog/posts.ts`**:
   - Fuente tipada en TypeScript con **7 artículos de alta autoridad** y redacción técnica profunda:
     1. *Cómo abrir y seguir un archivo GPX en el móvil: Guía definitiva para moto trail*
     2. *TET España GPX: Guía definitiva para descargar y navegar el Trans Euro Trail*
     3. *Transpirenaica en Moto Off-Road: Track GPX, Etapas y Guía de Paso Legal*
     4. *OsmAnd vs Calimoto vs NavRide: Comparativa definitiva de navegadores para moto*
     5. *Móvil Rugerizado vs Garmin Zūmo XT2: ¿Qué elegir para navegar en moto trail?*
     6. *Editor GPX Online: Cómo unir, recortar y limpiar tracks de moto sin programas*
     7. *Legislación de la moto de campo en España 2026/2027: Dónde es legal circular*

5. **`ESTRATEGIA_SEO_NAVRIDE.md`**:
   - Estudio de mercado exhaustivo, volúmenes de búsqueda mensuales, clustering temático, arquitectura de silos y tácticas de SEO Gris seguro (Parasite SEO en sitios DR 85+, Tier 2 Link Building y 301 de dominios expirados sin riesgo algorítmico).

---

## 🚀 Cómo Desplegar o Probar

Si estás en el repositorio local de NavRide:
```bash
# Para iniciar el servidor de desarrollo
npm run dev

# Para compilar la versión de producción
npm run build
```

El build compilará automáticamente las 29 páginas estáticas y el `sitemap.xml` dinámico donde el blog tiene prioridad máxima de indexación.
