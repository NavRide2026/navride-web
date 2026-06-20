import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "legal");
mkdirSync(outDir, { recursive: true });

const CSS = `:root{color-scheme:dark}body{font-family:Inter,-apple-system,sans-serif;max-width:720px;margin:0 auto;padding:32px 20px 64px;background:#050608;color:#fff;line-height:1.7}h1{color:#FF5A1F;font-size:1.5rem}h2{color:#fff;font-size:1.05rem;margin-top:2rem;font-weight:600}p,li{font-size:.95rem;color:rgba(255,255,255,.85)}ul{padding-left:1.2rem}a{color:#FF5A1F}.last-updated{color:rgba(255,255,255,.5);font-size:.85rem;margin-bottom:2rem}.nav{margin-bottom:2rem;font-size:.85rem}.nav a{margin-right:1rem}.attribution-card{background:#1C1C1E;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:16px;margin-bottom:12px}.attribution-card h3{margin:0 0 8px;font-size:1rem;color:#35C759}.attribution-card .applies{font-size:.8rem;color:rgba(255,255,255,.5);margin-bottom:8px}`;

const nav = `<nav class="nav"><a href="/">Inicio</a><a href="/legal">Centro legal</a><a href="/contacto">Contacto</a></nav>`;

function wrap(title, body) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NavRide — ${title}</title><style>${CSS}</style></head><body>${nav}${body}</body></html>`;
}

function p(text) {
  return `<p>${text}</p>`;
}

const updated = "2026-05-30";
const email = '<a href="mailto:navride@outlook.com">navride@outlook.com</a>';
const location = "Mollet del Vallès, Barcelona, Cataluña, España";

const docs = {
  "legal-notice.html": wrap(
    "Aviso legal",
    `<h1>Aviso legal — NavRide</h1><p class="last-updated">Última actualización: ${updated}</p>
    <h2>Titular</h2>${p(`Daniel Montero Mora<br>${location}<br>Email: ` + email)}
    <h2>1. Identificación y normativa</h2>${p("Este aviso se publica conforme a la Ley 34/2002 (LSSI-CE) y normativa aplicable en España.")}
    <h2>2. Objeto</h2>${p("NavRide es una aplicación móvil de navegación offroad para motos, coches y bicicletas. Permite visualizar mapas, importar rutas GPX, navegar con GPS, grabar tracks y acceder a funciones premium mediante suscripción NavRide Adventure gestionada por Google Play.")}
    ${p("NavRide funciona principalmente en el dispositivo (offline-first). No existe servidor propio de NavRide para cuentas de usuario ni almacenamiento de rutas en la nube.")}
    <h2>3. Condición de usuario</h2>${p("El uso de la app implica la aceptación de este Aviso legal, los Términos y condiciones y la Política de privacidad vigentes.")}
    <h2>4. Reglas de uso</h2>${p("El usuario se compromete a un uso lícito, a no interferir en el funcionamiento de la app y a mantener una conducción segura. NavRide es una ayuda a la navegación; no sustituye las señales de tráfico ni la atención del conductor.")}
    <h2>5. Propiedad intelectual</h2>${p("Interfaces, diseño, software y contenidos propios de NavRide están protegidos por la legislación de propiedad intelectual. Los mapas utilizan datos y estilos de terceros (OpenStreetMap, CARTO, OpenTopoMap) sujetos a sus licencias.")}
    <h2>6. Servicios de terceros</h2>${p("La app puede usar Google Play, tiles cartográficos (CARTO, OpenTopoMap, datos © OpenStreetMap contributors), enrutado OSRM, Open-Meteo (clima opcional) y servicios del sistema Android (GPS, voz).")}
    <h2>7. Limitación de responsabilidad</h2>${p("NavRide no garantiza exactitud permanente de GPS, mapas o rutas. El titular no se responsabiliza de daños derivados del uso salvo en los supuestos legalmente exigibles.")}
    <h2>8. Legislación y fuero</h2>${p("Legislación española. Jurisdicción: Barcelona, salvo normativa imperativa en contrario.")}
    <h2>Contacto</h2>${p(email)}`
  ),

  "terms.html": wrap(
    "Términos y condiciones",
    `<h1>Términos y condiciones — NavRide</h1><p class="last-updated">Última actualización: ${updated}</p>
    <h2>1. Aceptación</h2>${p('Al instalar o usar NavRide aceptas estos Términos y la <a href="/legal/politica-privacidad">Política de privacidad</a>.')}
    <h2>2. Descripción del servicio</h2>${p("Navegación offroad con mapas online/offline, importación GPX, HUD, voz opcional y suscripción premium NavRide Adventure.")}
    <h2>3. Planes</h2>
    <ul><li><strong>Free:</strong> Prueba gratuita de 7 días de navegación GPX online. Al finalizar, la navegación requiere suscripción Pilot o plan compatible.</li>
    <li><strong>Rider:</strong> 4,99 € / mes · hasta 10 tracks/mes (máx. 50 km c/u), rally hasta 10 h/mes. Plan de referencia UI — no vendido en Play actualmente.</li>
    <li><strong>Pilot:</strong> 7,99 € / mes · desbloqueo total: navegación, rally, mapas offline y herramientas GPX. Suscripción NavRide Adventure en Google Play.</li></ul>
    <h2>4. Uso seguro</h2>${p("Cumple la normativa de tráfico. Configura rutas antes de conducir. Eres responsable de tu conducción.")}
    <h2>5. GPS, mapas y offline</h2>${p("La precisión GPS y los mapas pueden variar (túneles, cobertura, datos desactualizados). OSRM y mapas online requieren conexión.")}
    <h2>6. Contenido GPX</h2>${p("Eres responsable de la licitud de los tracks que importes. La adherencia automática de GPX usa el perfil «driving» de OSRM (red viaria para vehículos).")}
    <h2>7. Limitación de responsabilidad</h2>${p("NavRide no se responsabiliza de accidentes, sanciones o daños por errores de posicionamiento, rutas inexactas o uso inadecuado.")}
    <h2>8. Suscripción</h2>${p('Ver <a href="/legal/subscription.html">Condiciones de suscripción</a> y <a href="/legal/refund.html">Política de pagos</a>. Ver <a href="/legal/politica-privacidad">Política de privacidad</a>.')}
    <h2>9. Modificaciones</h2>${p("Podemos actualizar la app y estos términos. El uso continuado implica aceptación.")}
    <h2>10. Ley aplicable</h2>${p("Legislación española. Jurisdicción Barcelona, salvo normativa imperativa.")}
    <h2>Contacto</h2>${p(email)}`
  ),

  "subscription.html": wrap(
    "Condiciones de suscripción",
    `<h1>Condiciones de suscripción — NavRide Adventure</h1><p class="last-updated">Última actualización: ${updated}</p>
    <h2>1. Planes disponibles</h2>
    <ul><li><strong>Free:</strong> Prueba gratuita de 7 días de navegación GPX online.</li>
    <li><strong>Rider:</strong> 4,99 € / mes · referencia UI, no vendido en Play actualmente.</li>
    <li><strong>Pilot (NavRide Adventure):</strong> 7,99 € / mes · desbloqueo total vía Google Play.</li></ul>
    <h2>2. Suscripción Pilot</h2>${p("Producto: navride_adventure_monthly. Proveedor: Google Play Billing. Renovación automática mensual hasta cancelación.")}
    ${p("La suscripción NavRide Adventure se renueva automáticamente cada mes al precio indicado en Google Play hasta que la canceles. Puedes gestionar o cancelar en Google Play → Pagos y suscripciones → Suscripciones.")}
    <h2>3. Activación y restauración</h2>${p("Tras confirmación de Google Play, NavRide activa el plan en el dispositivo. Tras reinstalar, usa «Restaurar suscripción» con la misma cuenta Google Play.")}
    <h2>4. Cancelación y reembolsos</h2>${p('Ver <a href="/legal/refund.html">Política de pagos</a>. Los reembolsos se gestionan conforme a Google Play.')}
    <h2>Contacto</h2>${p(email)}`
  ),

  "refund.html": wrap(
    "Política de pagos",
    `<h1>Política de pagos y reembolsos — NavRide</h1><p class="last-updated">Última actualización: ${updated}</p>
    <h2>1. Proveedor</h2>${p("Los pagos de NavRide Adventure se procesan exclusivamente mediante Google Play Billing. NavRide no gestiona cobros directos ni almacena datos de pago.")}
    <h2>2. Precio</h2>${p("7,99 € / mes — importe mostrado por Google Play al comprar.")}
    <h2>3. Renovación automática</h2>${p("La suscripción se renueva mensualmente salvo cancelación previa en Google Play → Pagos y suscripciones → Suscripciones.")}
    <h2>4. Cancelación</h2>${p("Puedes cancelar en cualquier momento. Mantienes acceso Pilot hasta fin del periodo pagado.")}
    <h2>5. Reembolsos</h2>${p('Los reembolsos se solicitan a Google Play según su política (<a href="https://play.google.com/about/play-terms/" target="_blank" rel="noopener">play.google.com</a>). NavRide no procesa devoluciones directas salvo obligación legal.')}
    <h2>6. Restauración</h2>${p("Usa «Restaurar suscripción» en la app con la cuenta Google Play que realizó la compra.")}
    <h2>Contacto</h2>${p(email)}`
  ),

  "data-deletion.html": wrap(
    "Eliminación de datos",
    `<h1>Política de eliminación de datos — NavRide</h1><p class="last-updated">Última actualización: ${updated}</p>
    <h2>1. Ámbito</h2>${p("Todos los datos de usuario se almacenan en el dispositivo; no hay servidor NavRide con copia de tus rutas.")}
    <h2>2. Cómo eliminar</h2>
    <ul><li><strong>Exportar mis datos:</strong> Ajustes → Privacidad → Exportar mis datos (JSON local).</li>
    <li><strong>Eliminar mis datos:</strong> Ajustes → Privacidad → Eliminar mis datos.</li>
    <li><strong>Eliminar cuenta:</strong> Ajustes → Eliminar cuenta (borra datos locales; no existe cuenta en servidor NavRide).</li>
    <li><strong>Desinstalación:</strong> elimina todos los datos locales.</li></ul>
    <h2>3. Suscripción Google Play</h2>${p("Eliminar datos locales NO cancela la suscripción. Cancélala en Google Play.")}
    <h2>4. Solicitudes adicionales</h2>${p(email)}`
  ),

  "gps-disclaimer.html": wrap(
    "Responsabilidad GPS",
    `<h1>Descargo de responsabilidad GPS — NavRide</h1><p class="last-updated">Última actualización: ${updated}</p>
    ${p("NavRide es una ayuda a la navegación. El usuario es responsable de cumplir las normas de tráfico.")}
    <h2>Limitaciones técnicas</h2>${p("GPS, cobertura, mapas y rutas OSRM/GPX pueden contener errores, retrasos o desactualización.")}
    <h2>Conducta segura</h2>${p("Mantén la atención en la vía. No manipules el dispositivo en marcha.")}
    <h2>Responsabilidad</h2>${p("El uso no sustituye tu criterio ni las señales. NavRide no se responsabiliza de accidentes, sanciones o daños derivados del uso.")}
    <h2>Emergencias</h2>${p("Ante situación grave, contacta servicios de emergencia (112 en España).")}`
  ),

  "licenses.html": wrap(
    "Licencias y atribuciones",
    `<h1>Licencias y atribuciones — NavRide</h1><p class="last-updated">Última actualización: ${updated}</p>
    ${p("NavRide muestra atribución permanente en el mapa. Enlaces oficiales de cada proveedor:")}
    <div class="attribution-card"><h3>OpenStreetMap</h3><div class="applies">Todos los modos de mapa</div><p>Datos cartográficos © OpenStreetMap contributors, ODbL.</p><p><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">https://www.openstreetmap.org/copyright</a></p></div>
    <div class="attribution-card"><h3>CARTO</h3><div class="applies">Mapa Normal online y preparación offline</div><p>Mapa Normal (Voyager): tiles CARTO basados en OpenStreetMap.</p><p><a href="https://carto.com/attributions" target="_blank" rel="noopener">https://carto.com/attributions</a></p></div>
    <div class="attribution-card"><h3>OpenTopoMap</h3><div class="applies">Mapa Topo online y preparación offline</div><p>© OpenTopoMap (CC-BY-SA), datos OSM, relieve SRTM.</p><p><a href="https://opentopomap.org/about" target="_blank" rel="noopener">https://opentopomap.org/about</a></p></div>
    <div class="attribution-card"><h3>OSRM</h3><div class="applies">Approach y adherencia GPX (con conexión)</div><p>Project OSRM — enrutado y map matching. Datos © OSM.</p><p><a href="https://project-osrm.org/" target="_blank" rel="noopener">https://project-osrm.org/</a></p></div>
    <div class="attribution-card"><h3>Open-Meteo</h3><div class="applies">Alertas climáticas (opcional)</div><p>Datos meteorológicos opcionales.</p><p><a href="https://open-meteo.com/" target="_blank" rel="noopener">https://open-meteo.com/</a></p></div>
    <div class="attribution-card"><h3>Google Play</h3><div class="applies">NavRide Adventure</div><p>Distribución y facturación de suscripción.</p><p><a href="https://play.google.com/about/play-terms/" target="_blank" rel="noopener">https://play.google.com/about/play-terms/</a></p></div>
    <h2>Privacidad OSRM</h2>${p('Ver <a href="/legal/politica-privacidad">Política de privacidad</a>, sección OSRM.')}`
  ),
};

for (const [file, html] of Object.entries(docs)) {
  writeFileSync(join(outDir, file), html, "utf8");
  console.log("Wrote", file);
}

console.log("Done.");
