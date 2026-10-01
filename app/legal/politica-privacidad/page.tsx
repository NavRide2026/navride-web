import Link from "next/link";
import PageLayout from "@/components/layout/page-layout";
import { BRAND } from "@/lib/site/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Política de privacidad de NavRide: datos tratados, finalidades, proveedores, conservación y derechos.",
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
            Privacidad
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
              Responsable
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
              1. Qué datos tratamos
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-white">Ubicación:</strong> posición,
                velocidad y rumbo necesarios para mostrar tu ubicación y prestar
                la navegación. Durante una navegación iniciada por ti, la
                ubicación puede seguir utilizándose con la pantalla apagada o la
                app minimizada mediante una notificación persistente de Android.
              </li>
              <li>
                <strong className="text-white">Cuenta y rutas:</strong> si
                decides iniciar sesión, tratamos los datos de cuenta y las rutas
                que guardes o sincronices.
              </li>
              <li>
                <strong className="text-white">Voz:</strong> si activas
                funciones de voz, el micrófono se utiliza únicamente mientras
                la función lo necesita. El tratamiento puede depender del
                servicio de reconocimiento de voz configurado en Android.
              </li>
              <li>
                <strong className="text-white">Suscripción:</strong> recibimos
                de Google Play la información necesaria para comprobar el estado
                de una compra o suscripción. NavRide no recibe ni almacena los
                datos de tu tarjeta.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">
              2. Para qué usamos los datos
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Prestar la navegación y las funciones que solicites.</li>
              <li>Guardar y sincronizar rutas cuando utilizas una cuenta.</li>
              <li>Gestionar acceso a funciones asociadas a tu plan.</li>
              <li>Atender solicitudes de soporte, privacidad o eliminación.</li>
            </ul>
            <p className="mt-3">
              La base jurídica es la prestación del servicio solicitado y, para
              funciones opcionales que lo requieran, tu consentimiento. Cuando
              exista una obligación legal aplicable, el tratamiento podrá
              realizarse para cumplirla.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">
              3. Servicios externos
            </h2>
            <p className="mb-3">
              NavRide utiliza proveedores únicamente cuando son necesarios para
              prestar una función concreta:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-white">Supabase:</strong> autenticación,
                perfil y sincronización de rutas cuando utilizas una cuenta.
              </li>
              <li>
                <strong className="text-white">Google Play:</strong>
                distribución, compras y suscripciones.
              </li>
              <li>
                <strong className="text-white">OSRM:</strong> cálculo de rutas
                en funciones online del editor web; las coordenadas necesarias
                para calcular la ruta se envían al servicio.
              </li>
              <li>
                <strong className="text-white">
                  OpenFreeMap, OpenMapTiles y proveedores cartográficos:
                </strong>{" "}
                carga de mapas online. Como en cualquier petición web, el
                proveedor puede recibir información técnica de conexión y del
                área de mapa solicitada.
              </li>
              <li>
                <strong className="text-white">Open-Meteo:</strong> solo si
                utilizas una función meteorológica disponible en tu versión.
              </li>
            </ul>
            <p className="mt-3">
              NavRide no vende datos personales ni utiliza la ubicación para
              publicidad.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">
              4. Conservación y eliminación
            </h2>
            <p>
              Los datos almacenados únicamente en tu dispositivo permanecen
              hasta que los eliminas o desinstalas la aplicación. Los datos
              asociados a una cuenta se conservan mientras la cuenta esté
              activa o sean necesarios para prestar el servicio y se eliminan
              cuando solicitas el borrado, salvo la información que deba
              conservarse durante el tiempo exigido por una obligación legal.
            </p>
            <p className="mt-3">
              Puedes solicitar la eliminación desde la app o desde{" "}
              <Link
                href="/delete-account"
                className="text-[#FF5A1F] hover:underline"
              >
                Eliminar cuenta
              </Link>
              . Eliminar la cuenta de NavRide no cancela automáticamente una
              suscripción activa de Google Play.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">
              5. Seguridad
            </h2>
            <p>
              Las comunicaciones con los servicios online se realizan mediante
              conexiones cifradas. El acceso a los datos de cuenta se limita a
              los servicios y usuarios autorizados para prestar las funciones
              correspondientes.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">
              6. Tus derechos
            </h2>
            <p>
              Puedes solicitar acceso, rectificación, supresión, limitación,
              portabilidad u oposición cuando corresponda, así como retirar un
              consentimiento previamente otorgado. Para ejercerlos, escribe a{" "}
              <a
                href={`mailto:${BRAND.supportEmail}`}
                className="text-[#FF5A1F] hover:underline"
              >
                {BRAND.supportEmail}
              </a>
              .
            </p>
            <p className="mt-3">
              También puedes presentar una reclamación ante la{" "}
              <a
                href="https://www.aepd.es"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF5A1F] hover:underline"
              >
                Agencia Española de Protección de Datos
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">
              7. Menores
            </h2>
            <p>NavRide no está dirigida a menores de 14 años.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">
              8. Cambios en esta política
            </h2>
            <p>
              Esta página contiene la versión vigente de la política de
              privacidad. Si realizamos cambios relevantes, actualizaremos la
              fecha indicada al inicio.
            </p>
          </section>
        </div>
      </article>
    </PageLayout>
  );
}
