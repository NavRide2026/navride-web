import Link from "next/link";
import PageLayout from "@/components/layout/page-layout";
import { BRAND } from "@/lib/site/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Política de privacidad NavRide — RGPD, Google Play Billing, datos locales y terceros (OSRM, mapas).",
  alternates: { canonical: "/legal/politica-privacidad" },
};

export default function PoliticaPrivacidadPage() {
  return (
    <PageLayout>
      <article className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <Link
          href="/legal"
          className="inline-block mb-8 text-sm text-white/50 hover:text-white transition"
        >
          ← Centro legal
        </Link>

        <header className="mb-10">
          <p className="text-[#FF5A1F] text-sm font-semibold tracking-widest uppercase mb-3">
            RGPD · Google Play
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Política de privacidad
          </h1>
          <p className="mt-3 text-white/50 text-sm">
            Última actualización: {BRAND.lastUpdated}
          </p>
        </header>

        <div className="space-y-10 text-white/70 text-sm leading-relaxed">
          <section>
            <h2 className="text-white font-semibold text-lg mb-3">
              Responsable del tratamiento
            </h2>
            <p>
              <strong className="text-white">{BRAND.holderName}</strong>
              <br />
              {BRAND.holderAddress}
              <br />
              <a
                href={`mailto:${BRAND.supportEmail}`}
                className="text-[#FF5A1F] hover:underline"
              >
                {BRAND.supportEmail}
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">
              1. Ámbito
            </h2>
            <p>
              NavRide es navegación GPS offroad con rutas GPX, mapas
              offline/online y suscripción <strong>NavRide Adventure</strong> vía
              Google Play. Puede usarse con cuenta cloud opcional (Supabase) para
              sincronizar rutas y alertas. La navegación GPS no requiere
              telemetría publicitaria.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">
              2. Datos que tratamos
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-white font-medium mb-1">a) Ubicación GPS</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Coordenadas, velocidad y rumbo durante la navegación GPS.
                  </li>
                  <li>
                    <strong>Android:</strong> permisos{" "}
                    <code>ACCESS_FINE_LOCATION</code> /{" "}
                    <code>ACCESS_COARSE_LOCATION</code> (ubicación mientras usas
                    la app). Durante navegación activa, un{" "}
                    <strong>servicio en primer plano</strong> (
                    <code>FOREGROUND_SERVICE</code> /{" "}
                    <code>FOREGROUND_SERVICE_LOCATION</code>) con notificación
                    persistente («Navegación activa») mantiene el GPS si
                    minimizas la app o apagas la pantalla.
                  </li>
                  <li>
                    NavRide <strong>no</strong> declara ni solicita{" "}
                    <code>ACCESS_BACKGROUND_LOCATION</code> (permiso de
                    ubicación en segundo plano del sistema).
                  </li>
                  <li>
                    Procesado en el dispositivo. NavRide no envía tu posición en
                    tiempo real a servidores con fines publicitarios.
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-white font-medium mb-1">
                  b) Rutas GPX y grabaciones
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Almacenamiento local en tu dispositivo.</li>
                  <li>
                    Si inicias sesión y sincronizas: copia en Supabase (
                    <code>gpx_tracks</code> / <code>gpx_routes</code> / Storage{" "}
                    <code>gpx</code>) asociada a tu usuario.
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-white font-medium mb-1">
                  b2) Alertas comunitarias (cuenta)
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Con sesión: tipo de alerta + coordenadas precisas (+ id de
                    autor en backend). Visibles a otros usuarios como avisos en
                    mapa.
                  </li>
                  <li>
                    La navegación local no envía tu posición continuamente a
                    Supabase.
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-white font-medium mb-1">
                  c) Preferencias y premium
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Ajustes, plan Free/Pilot, trial y consentimientos —
                    almacenamiento local.
                  </li>
                  <li>
                    Confirmación de suscripción vía Google Play Billing (SKU
                    navride_adventure_monthly).
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-white font-medium mb-1">
                  d) OSRM (requiere conexión)
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Cuándo:</strong> importación GPX con adherencia
                    viaria y ruta de aproximación al track.
                  </li>
                  <li>
                    <strong>Qué:</strong> coordenadas muestreadas del track o
                    waypoints de ruta.
                  </li>
                  <li>
                    <strong>Para qué:</strong> map matching y aproximación sobre
                    red viaria.
                  </li>
                  <li>
                    <strong>Servicio:</strong> router.project-osrm.org (público).
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-white font-medium mb-1">e) Mapas online</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    App Beta: estilos/tiles OpenFreeMap (MapLibre). Política:{" "}
                    <a
                      href="https://openfreemap.org/privacy/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FF5A1F] hover:underline"
                    >
                      openfreemap.org/privacy
                    </a>
                    .
                  </li>
                  <li>
                    Web / builds legacy pueden usar también tiles CARTO /
                    OpenTopoMap (datos © OpenStreetMap contributors).
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-white font-medium mb-1">
                  e2) Overpass (grafo vial, app)
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Consultas HTTP a instancias Overpass con bbox alrededor de
                    la posición para construir grafo vial local.
                  </li>
                  <li>
                    Incluye coordenadas en la query; la IP viaja a nivel de red.
                    Retención del operador: no hay política de retención
                    específica publicada por Overpass pública (FOSSGIS / mirrors)
                    — se documenta como no publicada, sin inventar plazos.
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-white font-medium mb-1">
                  f) Open-Meteo (opcional)
                </p>
                <ul className="list-disc pl-5">
                  <li>
                    Si activas alertas climáticas: ubicación aproximada a
                    api.open-meteo.com.
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-white font-medium mb-1">
                  g) Voz / micrófono (opcional)
                </p>
                <ul className="list-disc pl-5">
                  <li>
                    Motor de voz del sistema Android si activas comandos por voz.
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-white font-medium mb-1">
                  h) Logs técnicos locales
                </p>
                <ul className="list-disc pl-5">
                  <li>
                    Errores y eventos en archivos locales; no se suben a NavRide.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">
              3. Datos que NO recogemos
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Sin publicidad, analytics de terceros ni perfiles en servidor
                NavRide.
              </li>
              <li>Sin venta de datos personales.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">
              4. Permisos Android
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Ubicación</strong> (ACCESS_FINE_LOCATION /
                ACCESS_COARSE_LOCATION): navegación GPS mientras usas la app.
              </li>
              <li>
                <strong>Servicio en primer plano</strong> (FOREGROUND_SERVICE /
                FOREGROUND_SERVICE_LOCATION): GPS con pantalla apagada o app
                minimizada durante navegación activa (notificación persistente).
                No se usa ACCESS_BACKGROUND_LOCATION.
              </li>
              <li>
                <strong>Notificaciones</strong> (POST_NOTIFICATIONS): aviso del
                servicio de navegación.
              </li>
              <li>
                <strong>Internet</strong> y estado de red: mapas online, OSRM,
                Open-Meteo, Google Play Billing.
              </li>
              <li>
                <strong>Micrófono</strong> (RECORD_AUDIO): solicitado en runtime
                si activas comandos por voz.
              </li>
              <li>
                <strong>Facturación</strong> (com.android.vending.BILLING):
                suscripción NavRide Adventure vía Google Play.
              </li>
              <li>
                <strong>Almacenamiento legacy</strong> (READ_EXTERNAL_STORAGE,
                maxSdk 32): importar GPX en Android antiguos.
              </li>
              <li>
                <strong>Optimización batería</strong>{" "}
                (REQUEST_IGNORE_BATTERY_OPTIMIZATIONS): opcional para estabilidad
                GPS en algunos dispositivos.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">
              5. Terceros
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Google Play:</strong> pagos y suscripciones.{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FF5A1F] hover:underline"
                >
                  Política de Google
                </a>
              </li>
              <li>
                <strong>Supabase:</strong> autenticación y datos cloud opcionales
                del usuario (perfil, rutas GPX, alertas). Proyecto técnico
                documentado en la app Beta.
              </li>
              <li>
                <strong>OpenFreeMap:</strong> tiles de mapa (app Beta).{" "}
                <a
                  href="https://openfreemap.org/privacy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FF5A1F] hover:underline"
                >
                  Privacidad
                </a>
              </li>
              <li>
                <strong>Overpass API / OpenStreetMap:</strong> consultas de mapa
                vial (app). Operadores terceros; retención específica no
                publicada de forma uniforme.
              </li>
              <li>
                <strong>OSRM / OpenStreetMap:</strong> enrutado en flujos web /
                legacy cuando aplique.
              </li>
              <li>
                <strong>Open-Meteo:</strong> clima opcional (si la función está
                activa en esa build).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">
              6. Retención y eliminación
            </h2>
            <p>
              Datos locales: Ajustes → Eliminar / desinstalación. Cuenta y datos
              cloud: Ajustes → Eliminar cuenta (app), o la ruta web{" "}
              <Link
                href="/delete-account"
                className="text-[#FF5A1F] hover:underline"
              >
                /delete-account
              </Link>{" "}
              (reautenticación + borrado técnico cuando el backend esté
              desplegado), o email {BRAND.supportEmail}. Retención automática en
              producto: no definida (UNDEFINED) salvo eliminación por el usuario.
              Eliminar datos en NavRide no cancela la suscripción de Google Play.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">
              7. Menores
            </h2>
            <p>No destinada a menores de 14 años.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">
              8. Tus derechos (RGPD)
            </h2>
            <p>
              Contacto:{" "}
              <a
                href={`mailto:${BRAND.supportEmail}`}
                className="text-[#FF5A1F] hover:underline"
              >
                {BRAND.supportEmail}
              </a>
              . Reclamación:{" "}
              <a
                href="https://www.aepd.es"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF5A1F] hover:underline"
              >
                AEPD
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">
              9. Actualizaciones
            </h2>
            <p>
              Versión vigente en la app (Ajustes → Legal) y en esta URL pública
              para Google Play: {BRAND.privacyPolicyPublicUrl}
            </p>
          </section>
        </div>
      </article>
    </PageLayout>
  );
}
