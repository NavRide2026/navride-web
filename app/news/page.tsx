import PageLayout from "@/components/layout/page-layout";

export default function NewsPage() {
  return (
    <PageLayout>

      <section className="max-w-6xl mx-auto px-8 py-24">

        <div className="mb-20">

          <div className="text-[#FF5A1F] tracking-[0.3em] text-sm mb-6">
            DEVELOPMENT UPDATES
          </div>

          <h1 className="text-7xl font-black tracking-tight">
            News
          </h1>

        </div>

        <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-10">

          <div className="text-zinc-500 mb-6">
            MAY 2026
          </div>

          <h2 className="text-4xl font-bold mb-6">
            Dynamic Camera Improvements
          </h2>

          <p className="text-zinc-500 text-xl leading-relaxed">
            Navigation camera stability and route smoothing improvements are currently under development.
          </p>

        </div>

      </section>

    </PageLayout>
  );
}
