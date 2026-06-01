import Link from "next/link";
import PageLayout from "@/components/layout/page-layout";

export default function EliminacionDatosPage() {
  return (
    <PageLayout>

      <section className="max-w-5xl mx-auto px-8 py-24">

        <Link href="/legal">
          <button className="mb-12 bg-white/[0.04] border border-white/10 px-6 py-3 rounded-2xl text-white hover:bg-white/[0.08] transition">
            ← Volver
          </button>
        </Link>

        <div className="mb-14">

          <div className="text-[#FF5A1F] tracking-[0.3em] text-sm mb-5">
            PRIVACIDAD Y DATOS
          </div>

          <h1 className="text-6xl font-black text-white">
            Política de Eliminación de Datos
          </h1>

        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] backdrop-blur-3xl p-10">

          <div className="space-y-12 text-zinc-300 leading-relaxed">

            <div>

              <h2 className="text-3xl font-bold text-white mb-4">
                Ámbito
              </h2>

              <p className="text-zinc-400 text-lg">
                Esta política describe cómo el usuario puede eliminar sus datos en NavRide y qué información se suprime.
              </p>

            </div>

            <div>

              <h2 className="text-3xl font-bold text-white mb-4">
                Última actualización
              </h2>

              <p className="text-zinc-400 text-lg">
                2026-03-08
              </p>

            </div>

            <div>

              <h2 className="text-3xl font-bold text-white mb-4">
                Datos locales
              </h2>

              <p className="text-zinc-400 text-lg leading-relaxed">
                Preferencias y archivos GPX se almacenan localmente en el dispositivo.
                La opción “Eliminar mis datos” borra preferencias y archivos de rutas guardadas,
                excepto mapas offline si el usuario no lo solicita expresamente.
              </p>

            </div>

            <div>

              <h2 className="text-3xl font-bold text-white mb-4">
                Datos en servidor
              </h2>

              <p className="text-zinc-400 text-lg leading-relaxed">
                NavRide utiliza Firebase para estado de suscripción y aceptación legal.
                La opción “Eliminar mis datos” elimina el documento del usuario en Firebase.
                Si existe suscripción activa en Stripe, puede cancelarse en cualquier momento;
                la eliminación de cuenta no genera reembolsos.
              </p>

            </div>

            <div>

              <h2 className="text-3xl font-bold text-white mb-6">
                Qué se elimina
              </h2>

              <div className="space-y-4 text-zinc-400 text-lg">

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  Preferencias de la app (configuración, ajustes y consentimientos locales).
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  Rutas y grabaciones guardadas en el almacenamiento local (archivos GPX).
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  Registros locales asociados al uso cuando proceda.
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  Documento de usuario en Firebase (estado y marcas de consentimiento).
                </div>

              </div>

            </div>

            <div className="rounded-[28px] border border-orange-500/20 bg-orange-500/[0.05] p-8">

              <h2 className="text-3xl font-bold text-orange-400 mb-5">
                Qué puede conservarse
              </h2>

              <p className="text-zinc-300 text-lg leading-relaxed">
                Por obligaciones legales o técnicas, ciertos datos pueden conservarse
                durante el tiempo mínimo necesario, incluyendo información mínima
                de facturación y operaciones relacionadas con pagos gestionados por Stripe.
              </p>

            </div>

            <div>

              <h2 className="text-3xl font-bold text-white mb-6">
                Procedimiento
              </h2>

              <div className="space-y-4 text-zinc-400 text-lg">

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  Ajustes → Privacidad → Eliminar mis datos
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                  Ajustes → Cuenta → Eliminar cuenta
                </div>

              </div>

            </div>

            <div>

              <h2 className="text-3xl font-bold text-white mb-4">
                Efectos
              </h2>

              <p className="text-zinc-400 text-lg leading-relaxed">
                Eliminar datos implica perder configuración, rutas guardadas y estado
                de suscripción en la app. El usuario puede volver a utilizar NavRide
                creando un nuevo estado local.
              </p>

            </div>

            <div>

              <h2 className="text-3xl font-bold text-white mb-4">
                Plazos
              </h2>

              <p className="text-zinc-400 text-lg leading-relaxed">
                La eliminación local es inmediata. La eliminación en Firebase se realiza
                al momento de ejecutar la acción, pudiendo existir demoras técnicas puntuales.
              </p>

            </div>

            <div>

              <h2 className="text-3xl font-bold text-white mb-4">
                Soporte
              </h2>

              <p className="text-zinc-400 text-lg leading-relaxed">
                Para solicitudes adicionales o certificación de borrado:
              </p>

              <div className="mt-5 inline-flex rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-white text-lg">
                navride@outlook.com
              </div>

            </div>

          </div>

        </div>

      </section>

    </PageLayout>
  );
}