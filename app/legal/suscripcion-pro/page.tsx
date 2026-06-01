import Link from "next/link";
import PageLayout from "@/components/layout/page-layout";

export default function SuscripcionProPage() {
  return (
    <PageLayout>

      <section className="max-w-4xl mx-auto px-8 py-24">

        <Link href="/legal">
          <button className="mb-12 bg-white/[0.04] border border-white/10 px-6 py-3 rounded-2xl text-white hover:bg-white/[0.08] transition">
            ← Volver
          </button>
        </Link>

        <h1 className="text-6xl font-black text-white mb-12">
          Condiciones Suscripción Pro
        </h1>

        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-10 text-zinc-400 text-lg leading-relaxed">

          AQUÍ VAN LAS CONDICIONES DE SUSCRIPCIÓN PRO

        </div>

      </section>

    </PageLayout>
  );
}
