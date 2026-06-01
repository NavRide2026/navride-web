import Link from "next/link";
import PageLayout from "@/components/layout/page-layout";

export default function ResponsabilidadPage() {
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
            GPS DISCLAIMER
          </div>

          <h1 className="text-6xl font-black text-orange-400">
            Responsabilidad de Navegación
          </h1>

        </div>

        <div className="rounded-[32px] border border-orange-500/20 bg-orange-500/[0.04] backdrop-blur-3xl p-10">

          <div className="space-y-12 text-zinc-300 leading-relaxed">

            <div>

              <div className="rounded-[24px] border border-orange-500/20 bg-black/30 p-8">

                <h2 className="text-3xl font-bold text-orange-400 mb-5">
                  Descargo de responsabilidad GPS
                </h2>

                <p className="text-zinc-300 text-lg leading-relaxed">
                  NavRide es una ayuda a la navegación. El usuario es responsable
                  de seguir las normas de tráfico y utilizar la aplicación
                  de forma segura.
                </p>

              </div>

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

              <h2 className="text-3xl font-bold text-white mb-6">
                Limitaciones técnicas
              </h2>

              <p className="text-zinc-400 text-lg leading-relaxed">
                La precisión del GPS, la cobertura de datos y los mapas pueden variar
                según el entorno. Las rutas sugeridas pueden no reflejar cierres,
                obras o cambios recientes.
              </p>

            </div>

            <div>

              <h2 className="text-3xl font-bold text-white mb-6">
                Conducta segura
              </h2>

              <div className="space-y-4">

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-zinc-300 text-lg">
                  Mantén la atención en la carretera.
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-zinc-300 text-lg">
                  Ajusta la navegación antes de iniciar la marcha.
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-zinc-300 text-lg">
                  No manipules el teléfono durante la conducción.
                </div>

              </div>

            </div>

            <div>

              <h2 className="text-3xl font-bold text-white mb-6">
                Responsabilidad
              </h2>

              <p className="text-zinc-400 text-lg leading-relaxed">
                El uso de NavRide no sustituye el criterio del conductor ni las
                señales de tráfico. NavRide no se hace responsable de accidentes,
                sanciones o daños derivados del uso de la aplicación.
              </p>

            </div>

            <div className="rounded-[28px] border border-orange-500/20 bg-orange-500/[0.06] p-8">

              <h2 className="text-3xl font-bold text-orange-400 mb-6">
                Uso en moto y condiciones reales
              </h2>

              <p className="text-zinc-300 text-lg leading-relaxed">
                La conducción offroad, vibraciones, temperatura y humedad pueden afectar
                la lectura del GPS y la interacción con la pantalla.
              </p>

              <p className="text-zinc-300 text-lg leading-relaxed mt-5">
                El usuario debe priorizar siempre la seguridad, detenerse en un lugar seguro
                antes de realizar cambios y verificar la ruta con criterio propio.
              </p>

            </div>

            <div className="rounded-[28px] border border-red-500/20 bg-red-500/[0.05] p-8">

              <h2 className="text-3xl font-bold text-red-400 mb-6">
                Servicios públicos de urgencias
              </h2>

              <p className="text-zinc-300 text-lg leading-relaxed">
                Ante una situación grave, contacta con los servicios públicos correspondientes
                (por ejemplo 112 en España).
              </p>

              <p className="text-zinc-300 text-lg leading-relaxed mt-5">
                Esta aplicación es únicamente una ayuda a la navegación.
              </p>

            </div>

          </div>

        </div>

      </section>

    </PageLayout>
  );
}