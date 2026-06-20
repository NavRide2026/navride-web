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
              Google Play. No hay cuentas obligatorias ni login en servidor
              NavRide.
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
                    Coordenadas, velocidad y rumbo durante navegación o servicio
                    foreground (pantalla apagada en navegación activa).
                  </li>
                  <li>
                    Procesado en el dispositivo. NavRide no envía tu posición en
                    tiempo real a servidores propios.
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-white font-medium mb-1">
                  b) Rutas GPX y grabaciones
                </p>
                <ul className="list-disc pl-5">
                  <li>Almacenamiento local en tu dispositivo.</li>
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
                <ul className="list-disc pl-5">
                  <li>
                    Peticiones de tiles a CARTO CDN / OpenTopoMap (datos ©
                    OpenStreetMap contributors).
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
                ACCESS_COARSE_LOCATION): navegación GPS.
              </li>
              <li>
                <strong>Servicio en primer plano</strong> (FOREGROUND_SERVICE /
                FOREGROUND_SERVICE_LOCATION): GPS con pantalla apagada durante
                navegación activa.
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
                <strong>OSRM / OpenStreetMap:</strong> enrutado y mapas.
              </li>
              <li>
                <strong>Open-Meteo:</strong> clima opcional.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">
              6. Retención y eliminación
            </h2>
            <p>
              Datos locales hasta que los elimines en la app (Ajustes →
              Privacidad) o desinstales. Exportar/Eliminar mis datos disponible en
              la app. Ver{" "}
              <Link
                href="/legal/eliminacion-datos"
                className="text-[#FF5A1F] hover:underline"
              >
                política de eliminación de datos
              </Link>
              .
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
