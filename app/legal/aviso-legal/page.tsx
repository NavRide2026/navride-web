import Link from "next/link";
import PageLayout from "@/components/layout/page-layout";

export default function AvisoLegalPage() {
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
            LEGAL CENTER
          </div>

          <h1 className="text-6xl font-black text-white">
            Aviso Legal
          </h1>

        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] backdrop-blur-3xl p-10">

          <div className="space-y-10 text-zinc-300 leading-relaxed">

            <div>

              <h2 className="text-2xl font-bold text-white mb-4">
                Titular
              </h2>

              <div className="space-y-2 text-zinc-400">

                <p>
                  Daniel Montero Mora
                </p>

                <p>
                  DNI 47704767F
                </p>

                <p>
                  Carrer de Can Mollet, 5
                </p>

                <p>
                  08100 Mollet del Vallès
                </p>

                <p>
                  Barcelona, Cataluña, España
                </p>

                <p>
                  navride@outlook.com
                </p>

              </div>

            </div>

            <div>

              <h2 className="text-2xl font-bold text-white mb-4">
                Información General
              </h2>

              <p className="text-zinc-400">
                NavRide es una plataforma avanzada de navegación GPS orientada
                a motocicletas, incluyendo funcionalidades de rutas GPX,
                navegación en tiempo real y sistema de suscripción PRO.
              </p>

            </div>

            <div>

              <h2 className="text-2xl font-bold text-white mb-4">
                Normativa Aplicable
              </h2>

              <p className="text-zinc-400">
                Este Aviso Legal se publica conforme a la Ley 34/2002 de
                Servicios de la Sociedad de la Información y Comercio
                Electrónico (LSSI-CE) y normativa complementaria aplicable.
              </p>

            </div>

            <div>

              <h2 className="text-2xl font-bold text-white mb-4">
                Condición de Usuario
              </h2>

              <p className="text-zinc-400">
                El acceso y uso de NavRide implica la aceptación íntegra de las
                condiciones legales, políticas y responsabilidades de navegación.
              </p>

            </div>

            <div className="rounded-[28px] border border-orange-500/20 bg-orange-500/[0.05] p-8">

              <h2 className="text-2xl font-bold text-orange-400 mb-4">
                Importante
              </h2>

              <p className="text-zinc-300">
                NavRide actúa como sistema de asistencia a la navegación. El
                usuario sigue siendo el único responsable de respetar las normas
                de tráfico y mantener una conducción segura.
              </p>

            </div>

          </div>

        </div>

      </section>

    </PageLayout>
  );
}