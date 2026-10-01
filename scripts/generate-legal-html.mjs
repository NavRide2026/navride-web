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

const updated = "2026-09-19";
const email = '<a href="mailto:navride@outlook.com">navride@outlook.com</a>';
const location = "España";

const docs = {
  "legal-notice.html": wrap(
    "Aviso legal",
    `<h1>Aviso legal — NavRide</h1><p class="last-updated">Última actualización: ${updated}</p>
    <h2>Titular</h2>${p(`NavRide Developer<br>${location}<br>Email: ` + email)}
    <h2>Servicio</h2>${p("NavRide ofrece una aplicación y servicios web relacionados con navegación, rutas GPX y mapas. Algunas funciones pueden requerir conexión, una cuenta o un plan compatible.")}
    <h2>Uso</h2>${p("Debes utilizar NavRide de forma lícita y segura. La aplicación es una ayuda a la navegación y no sustituye las señales, las normas de circulación ni la atención necesaria durante la conducción.")}
    <h2>Propiedad intelectual</h2>${p('Los contenidos, diseño y software propios de NavRide están protegidos por la normativa aplicable. Los mapas, datos y servicios de terceros mantienen sus propias licencias y atribuciones, disponibles en <a href="/legal/licenses.html">Licencias y atribuciones</a>.')}
    <h2>Disponibilidad y responsabilidad</h2>${p("La disponibilidad y precisión de GPS, mapas, rutas y servicios externos puede variar. Nada en este aviso limita los derechos que la normativa aplicable reconozca al usuario.")}
    <h2>Legislación aplicable</h2>${p("Se aplica la legislación española, sin perjuicio de las normas imperativas de protección de consumidores y usuarios que correspondan.")}
    <h2>Contacto</h2>${p(email)}`
  ),

  "terms.html": wrap(
    "Términos y condiciones",
    `<h1>Términos y condiciones — NavRide</h1><p class="last-updated">Última actualización: ${updated}</p>
    <h2>1. Aceptación</h2>${p('Al utilizar NavRide aceptas estos términos y la <a href="/legal/politica-privacidad">Política de privacidad</a>.')}
    <h2>2. Servicio</h2>${p("NavRide permite planificar, importar y seguir rutas GPX y utilizar funciones de navegación y mapas según la versión y el plan disponibles.")}
    <h2>3. Cuenta</h2>${p("Algunas funciones permiten usar una cuenta para guardar o sincronizar información. Eres responsable de mantener seguras tus credenciales y de la información que guardes en tu cuenta.")}
    <h2>4. Rutas y conducción segura</h2>${p("Comprueba la ruta y las condiciones reales antes y durante el recorrido. No manipules el dispositivo mientras conduces. Debes respetar la señalización, las restricciones de acceso y la normativa aplicable.")}
    <h2>5. Contenido del usuario</h2>${p("Eres responsable de las rutas y archivos que importes, crees o compartas, así como de disponer de los derechos necesarios sobre ellos.")}
    <h2>6. Planes y compras</h2>${p('Las funciones, límites y precios vigentes se muestran en <a href="/planes">Planes</a> y, cuando la compra se realiza en Android, en la pantalla de compra de Google Play antes de confirmar el pago.')}
    <h2>7. Disponibilidad</h2>${p("GPS, mapas, cobertura y servicios externos pueden contener errores, sufrir interrupciones o no estar disponibles temporalmente.")}
    <h2>8. Cambios</h2>${p("Podemos actualizar NavRide y estos términos cuando sea necesario. La versión vigente se publica en esta página.")}
    <h2>9. Legislación aplicable</h2>${p("Se aplica la legislación española, sin perjuicio de la normativa imperativa que resulte aplicable al usuario.")}
    <h2>Contacto</h2>${p(email)}`
  ),

  "subscription.html": wrap(
    "Condiciones de suscripción",
    `<h1>Condiciones de suscripción — NavRide</h1><p class="last-updated">Última actualización: ${updated}</p>
    <h2>Compra</h2>${p("Las suscripciones contratadas desde Android se procesan mediante Google Play. El precio, periodo de facturación y condiciones aplicables se muestran antes de confirmar la compra.")}
    <h2>Renovación</h2>${p("Las suscripciones con renovación automática continúan hasta que las canceles en Google Play. La fecha y el importe de la siguiente renovación se gestionan desde tu cuenta de Google Play.")}
    <h2>Cancelación</h2>${p("Puedes cancelar desde Google Play → Pagos y suscripciones → Suscripciones. La cancelación evita futuras renovaciones; el acceso se mantiene durante el periodo ya pagado, salvo que la normativa o Google Play indiquen otra cosa.")}
    <h2>Restauración</h2>${p("Si reinstalas la aplicación, puedes restaurar una compra compatible utilizando la misma cuenta de Google Play con la que se realizó.")}
    <h2>Planes</h2>${p('Consulta las funciones y precios publicados en <a href="/planes">Planes</a>.')}
    <h2>Contacto</h2>${p(email)}`
  ),

  "refund.html": wrap(
    "Pagos y reembolsos",
    `<h1>Pagos y reembolsos — NavRide</h1><p class="last-updated">Última actualización: ${updated}</p>
    <h2>Pagos</h2>${p("Las compras digitales realizadas desde Android se procesan mediante Google Play. NavRide no recibe ni almacena los datos de tu tarjeta.")}
    <h2>Cancelación</h2>${p("Puedes gestionar o cancelar una suscripción desde Google Play → Pagos y suscripciones → Suscripciones.")}
    <h2>Reembolsos</h2>${p('Las solicitudes de reembolso de compras procesadas por Google Play se tramitan conforme a sus condiciones y a los derechos que te reconozca la normativa aplicable. Consulta <a href="https://support.google.com/googleplay/answer/2479637" target="_blank" rel="noopener">la ayuda oficial de Google Play</a>.')}
    <h2>Contacto</h2>${p(email)}`
  ),

  "data-deletion.html": wrap(
    "Eliminación de datos y cuenta",
    `<h1>Eliminación de datos y cuenta — NavRide</h1><p class="last-updated">Última actualización: ${updated}</p>
    <h2>Eliminar la cuenta</h2>${p('Puedes solicitar la eliminación desde la aplicación o desde la página <a href="/delete-account">Eliminar cuenta</a>. También puedes escribir a ' + email + " desde el correo asociado a tu cuenta.")}
    <h2>Qué se elimina</h2>${p("Al eliminar tu cuenta se eliminan la cuenta de acceso y los datos asociados que NavRide mantiene para el perfil y la sincronización de rutas, salvo la información que deba conservarse temporalmente por una obligación legal.")}
    <h2>Datos del dispositivo</h2>${p("Los archivos o datos que existan únicamente en tu dispositivo se eliminan desde la propia aplicación o al desinstalarla, según corresponda.")}
    <h2>Suscripción</h2>${p("Eliminar la cuenta de NavRide no cancela automáticamente una suscripción de Google Play. Si tienes una suscripción activa, cancélala también desde Google Play.")}
    <h2>Contacto</h2>${p(email)}`
  ),

  "gps-disclaimer.html": wrap(
    "Seguridad y navegación",
    `<h1>Seguridad y navegación — NavRide</h1><p class="last-updated">Última actualización: ${updated}</p>
    ${p("NavRide es una ayuda a la navegación. La información de GPS, mapas y rutas puede ser inexacta, incompleta o quedar desactualizada.")}
    <h2>Durante la conducción</h2>${p("Mantén la atención en la vía, respeta la señalización y no manipules el dispositivo en marcha. La situación real del terreno y las indicaciones oficiales tienen prioridad.")}
    <h2>Rutas</h2>${p("Una ruta puede atravesar zonas restringidas, privadas, cerradas o no aptas para tu vehículo. Comprueba siempre las condiciones y permisos necesarios antes de continuar.")}
    <h2>Emergencias</h2>${p("NavRide no es un servicio de emergencias. En España y la Unión Europea, el número general de emergencias es el 112.")}`
  ),

  "licenses.html": wrap(
    "Licencias y atribuciones",
    `<h1>Licencias y atribuciones — NavRide</h1><p class="last-updated">Última actualización: ${updated}</p>
    ${p("NavRide utiliza mapas, datos y servicios de terceros. Las atribuciones se muestran también en el mapa cuando corresponde.")}
    <div class="attribution-card"><h3>OpenStreetMap</h3><div class="applies">Datos cartográficos</div><p>© OpenStreetMap contributors. Datos disponibles bajo ODbL.</p><p><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">openstreetmap.org/copyright</a></p></div>
    <div class="attribution-card"><h3>OpenFreeMap / OpenMapTiles</h3><div class="applies">Mapas vectoriales y etiquetas web</div><p>Servicios cartográficos basados en datos de OpenStreetMap y OpenMapTiles.</p><p><a href="https://openfreemap.org/" target="_blank" rel="noopener">openfreemap.org</a></p></div>
    <div class="attribution-card"><h3>Esri World Imagery</h3><div class="applies">Vista satélite web</div><p>Imágenes y datos atribuidos a Esri y sus proveedores según se muestra en el mapa.</p><p><a href="https://www.esri.com/en-us/legal/terms/full-master-agreement" target="_blank" rel="noopener">esri.com</a></p></div>
    <div class="attribution-card"><h3>CARTO / OpenTopoMap</h3><div class="applies">Capas que los utilicen</div><p>Sus respectivas atribuciones se aplican cuando una capa basada en estos servicios está disponible.</p><p><a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a> · <a href="https://opentopomap.org/about" target="_blank" rel="noopener">OpenTopoMap</a></p></div>
    <div class="attribution-card"><h3>Project OSRM</h3><div class="applies">Cálculo de rutas online del editor</div><p>Servicio de enrutado basado en datos de OpenStreetMap.</p><p><a href="https://project-osrm.org/" target="_blank" rel="noopener">project-osrm.org</a></p></div>`
  ),
};

for (const [file, html] of Object.entries(docs)) {
  writeFileSync(join(outDir, file), html, "utf8");
  console.log("Wrote", file);
}

console.log("Done.");
