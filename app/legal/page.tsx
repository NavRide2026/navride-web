import Link from "next/link";
import PageLayout from "@/components/layout/page-layout";

export default function LegalPage() {
  return (
    <PageLayout>

      <section className="max-w-5xl mx-auto px-8 py-24">

        <div className="mb-20">

          <div className="text-[#FF5A1F] tracking-[0.3em] text-sm mb-6">
            LEGAL CENTER
          </div>

          <h1 className="text-7xl font-black tracking-tight text-white">
            Legal
          </h1>

        </div>

        <div className="space-y-6">

          <Link href="/legal/aviso-legal">
            <div className="cursor-pointer rounded-[28px] border border-white/10 bg-white/[0.03] p-8 hover:bg-white/[0.05] transition">
              <h2 className="text-3xl font-bold text-white">
                Aviso Legal
              </h2>
            </div>
          </Link>

          <Link href="/legal/politica-privacidad">
            <div className="cursor-pointer rounded-[28px] border border-white/10 bg-white/[0.03] p-8 hover:bg-white/[0.05] transition">
              <h2 className="text-3xl font-bold text-white">
                Política de Privacidad
              </h2>
            </div>
          </Link>

          <Link href="/legal/terminos-condiciones">
            <div className="cursor-pointer rounded-[28px] border border-white/10 bg-white/[0.03] p-8 hover:bg-white/[0.05] transition">
              <h2 className="text-3xl font-bold text-white">
                Términos y Condiciones
              </h2>
            </div>
          </Link>

          <Link href="/legal/suscripcion-pro">
            <div className="cursor-pointer rounded-[28px] border border-white/10 bg-white/[0.03] p-8 hover:bg-white/[0.05] transition">
              <h2 className="text-3xl font-bold text-white">
                Condiciones Suscripción Pro
              </h2>
            </div>
          </Link>

          <Link href="/legal/responsabilidad-navegacion">
            <div className="cursor-pointer rounded-[28px] border border-orange-500/20 bg-orange-500/[0.04] p-8 hover:bg-orange-500/[0.08] transition">
              <h2 className="text-3xl font-bold text-orange-400">
                Responsabilidad de Navegación
              </h2>
            </div>
          </Link>

          <Link href="/legal/politica-pagos">
            <div className="cursor-pointer rounded-[28px] border border-white/10 bg-white/[0.03] p-8 hover:bg-white/[0.05] transition">
              <h2 className="text-3xl font-bold text-white">
                Política de Pagos
              </h2>
            </div>
          </Link>

          <Link href="/legal/eliminacion-datos">
            <div className="cursor-pointer rounded-[28px] border border-white/10 bg-white/[0.03] p-8 hover:bg-white/[0.05] transition">
              <h2 className="text-3xl font-bold text-white">
                Política de Eliminación de Datos
              </h2>
            </div>
          </Link>

        </div>

      </section>

    </PageLayout>
  );
}
