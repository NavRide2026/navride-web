import Link from "next/link";
import PageLayout from "@/components/layout/page-layout";

export default function PoliticaPrivacidadPage() {
  return (
    <PageLayout>

      <section className="max-w-6xl mx-auto px-8 py-24">

        <Link href="/legal">
          <button className="mb-12 bg-white/[0.04] border border-white/10 px-6 py-3 rounded-2xl text-white hover:bg-white/[0.08] transition">
            ← Volver
          </button>
        </Link>

        <div className="mb-14">

          <div className="text-[#FF5A1F] tracking-[0.3em] text-sm mb-5">
            PRIVACY POLICY · RGPD
          </div>

          <h1 className="text-6xl font-black text-white">
            Política de Privacidad
          </h1>

        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] backdrop-blur-3xl p-10">

          <div className="space-y-14 text-zinc-300 leading-relaxed">

            {/* RESPONSABLE */}
            <div>

              <h2 className="text-3xl font-bold text-white mb-6">
                Responsable del tratamiento
              </h2>

              <div className="space-y-3 text-zinc-400 text-lg">

                <p>Daniel Montero Mora (DNI 47704767F)</p>

                <p>navride@outlook.com</p>

                <p>
                  Carrer de Can Mollet, 5 · 08100 Mollet del Vallès
                </p>

                <p>
                  Barcelona · Cataluña · España
                </p>

              </div>

            </div>

            {/* PRODUCTO */}
            <div>

              <h2 className="text-3xl font-bold text-white mb-6">
                Producto
              </h2>

              <p className="text-zinc-400 text-lg leading-relaxed">
                NavRide es una aplicación avanzada de navegación GPS para motocicletas,
                incluyendo rutas GPX, navegación por voz, cuentas de usuario
                y suscripción PRO mensual.
              </p>

            </div>

            {/* DATOS */}
            <div>

              <h2 className="text-3xl font-bold text-white mb-8">
                Datos tratados
              </h2>

              <div className="grid gap-5">

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                  <div className="text-white text-xl font-bold mb-2">
                    Identificadores
                  </div>

                  <div className="text-zinc-400">
                    UID Firebase y correo electrónico cuando exista.
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                  <div className="text-white text-xl font-bold mb-2">
                    Datos de navegación
                  </div>

                  <div className="text-zinc-400">
                    Posición GPS, velocidad, rumbo y precisión procesados principalmente en el dispositivo.
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                  <div className="text-white text-xl font-bold mb-2">
                    Ficheros GPX
                  </div>

                  <div className="text-zinc-400">
                    Rutas importadas y almacenadas localmente.
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                  <div className="text-white text-xl font-bold mb-2">
                    Suscripción PRO
                  </div>

                  <div className="text-zinc-400">
                    Identificadores de cliente y estado de suscripción asociados al UID.
                  </div>
                </div>

              </div>

            </div>

            {/* FINALIDADES */}
            <div>

              <h2 className="text-3xl font-bold text-white mb-8">
                Finalidades
              </h2>

              <div className="space-y-4">

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-zinc-300 text-lg">
                  Navegación GPS y visualización de mapas.
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-zinc-300 text-lg">
                  Gestión de rutas GPX y navegación avanzada.
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-zinc-300 text-lg">
                  Gestión de pagos y suscripción PRO mediante Stripe.
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-zinc-300 text-lg">
                  Seguridad, estabilidad técnica y prevención de fraude.
                </div>

              </div>

            </div>

            {/* BASE LEGAL */}
            <div className="rounded-[28px] border border-orange-500/20 bg-orange-500/[0.05] p-8">

              <h2 className="text-3xl font-bold text-orange-400 mb-6">
                Base legal · Artículo 6 RGPD
              </h2>

              <div className="space-y-5 text-zinc-300 text-lg">

                <p>
                  Ejecución contractual para prestar servicios de navegación y suscripción PRO.
                </p>

                <p>
                  Consentimiento para permisos del sistema y aceptación legal.
                </p>

                <p>
                  Interés legítimo para seguridad, mantenimiento y prevención de abuso.
                </p>

                <p>
                  Obligaciones legales fiscales y contables cuando proceda.
                </p>

              </div>

            </div>

            {/* PERMISOS */}
            <div>

              <h2 className="text-3xl font-bold text-white mb-8">
                Permisos del dispositivo
              </h2>

              <div className="grid gap-5">

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                  <div className="text-white text-xl font-bold mb-2">
                    Ubicación GPS
                  </div>

                  <div className="text-zinc-400">
                    Necesaria para navegación y orientación.
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                  <div className="text-white text-xl font-bold mb-2">
                    Micrófono
                  </div>

                  <div className="text-zinc-400">
                    Utilizado únicamente para funciones de voz habilitadas por el usuario.
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                  <div className="text-white text-xl font-bold mb-2">
                    Almacenamiento
                  </div>

                  <div className="text-zinc-400">
                    Necesario para importar y guardar archivos GPX.
                  </div>
                </div>

              </div>

            </div>

            {/* STRIPE/FIREBASE */}
            <div>

              <h2 className="text-3xl font-bold text-white mb-6">
                Proveedores externos
              </h2>

              <div className="space-y-5">

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">

                  <div className="text-white text-2xl font-bold mb-3">
                    Stripe
                  </div>

                  <div className="text-zinc-400 text-lg">
                    Gestión de pagos y suscripciones.
                  </div>

                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">

                  <div className="text-white text-2xl font-bold mb-3">
                    Firebase
                  </div>

                  <div className="text-zinc-400 text-lg">
                    Backend, autenticación y estado de suscripción.
                  </div>

                </div>

              </div>

            </div>

            {/* DERECHOS */}
            <div>

              <h2 className="text-3xl font-bold text-white mb-6">
                Derechos del usuario
              </h2>

              <p className="text-zinc-400 text-lg leading-relaxed">
                Acceso, rectificación, supresión, oposición, limitación,
                portabilidad y retirada del consentimiento.
              </p>

              <div className="mt-6 inline-flex rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-white text-lg">
                navride@outlook.com
              </div>

            </div>

            {/* SEGURIDAD */}
            <div className="rounded-[28px] border border-green-500/20 bg-green-500/[0.05] p-8">

              <h2 className="text-3xl font-bold text-[#35C759] mb-6">
                Seguridad
              </h2>

              <p className="text-zinc-300 text-lg leading-relaxed">
                NavRide prioriza el tratamiento local en el dispositivo,
                la minimización de datos enviados al servidor y medidas técnicas
                razonables para proteger la información frente a accesos no autorizados.
              </p>

            </div>

            {/* MENORES */}
            <div>

              <h2 className="text-3xl font-bold text-white mb-6">
                Menores
              </h2>

              <p className="text-zinc-400 text-lg leading-relaxed">
                NavRide no está destinada a menores de 14 años sin autorización
                de padres o tutores legales.
              </p>

            </div>

            {/* ACTUALIZACIONES */}
            <div>

              <h2 className="text-3xl font-bold text-white mb-6">
                Actualizaciones
              </h2>

              <p className="text-zinc-400 text-lg leading-relaxed">
                Esta política puede actualizarse periódicamente.
                La versión vigente estará disponible en la aplicación y la web oficial.
              </p>

            </div>

          </div>

        </div>

      </section>

    </PageLayout>
  );
}