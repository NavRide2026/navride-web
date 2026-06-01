import { Navigation, Route, Map } from "lucide-react";

export default function Features() {
  return (
    <section className="bg-black text-white py-40 px-8">

      <div className="max-w-7xl mx-auto">

        <div className="mb-24 text-center">

          <h2 className="text-6xl font-bold tracking-tight">
            Navigation Technology
          </h2>

          <p className="text-zinc-500 text-xl mt-6">
            Designed for precision, stability and advanced route systems.
          </p>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-10 backdrop-blur-xl">

            <Navigation className="w-14 h-14 mb-8 text-white" />

            <h3 className="text-3xl font-bold mb-6">
              Real-Time Navigation
            </h3>

            <p className="text-zinc-500 text-lg leading-relaxed">
              Dynamic camera systems and ultra smooth GPS tracking engine.
            </p>

          </div>

          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-10 backdrop-blur-xl">

            <Route className="w-14 h-14 mb-8 text-white" />

            <h3 className="text-3xl font-bold mb-6">
              GPX Ecosystem
            </h3>

            <p className="text-zinc-500 text-lg leading-relaxed">
              Advanced GPX importing, route visualization and navigation systems.
            </p>

          </div>

          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-10 backdrop-blur-xl">

            <Map className="w-14 h-14 mb-8 text-white" />

            <h3 className="text-3xl font-bold mb-6">
              Mapping Engine
            </h3>

            <p className="text-zinc-500 text-lg leading-relaxed">
              High-performance rendering architecture optimized for navigation.
            </p>

          </div>

        </div>
      </div>
    </section>
  );
}
