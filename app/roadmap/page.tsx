import PageLayout from "@/components/layout/page-layout";

export default function RoadmapPage() {
  return (
    <PageLayout>

      <section className="max-w-6xl mx-auto px-8 py-24">

        <div className="mb-20">

          <div className="text-[#FF5A1F] tracking-[0.3em] text-sm mb-6">
            DEVELOPMENT STATUS
          </div>

          <h1 className="text-7xl font-black tracking-tight">
            Roadmap
          </h1>

        </div>

        <div className="space-y-8">

          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-10">
            <div className="text-green-500 text-2xl font-bold">
              GPS Navigation
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-10">
            <div className="text-green-500 text-2xl font-bold">
              GPX Import System
            </div>
          </div>

          <div className="rounded-3xl border border-orange-500/20 bg-orange-500/[0.04] p-10">
            <div className="text-orange-400 text-2xl font-bold">
              Dynamic Camera System
            </div>
          </div>

        </div>

      </section>

    </PageLayout>
  );
}
