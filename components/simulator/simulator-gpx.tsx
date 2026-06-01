export default function SimulatorGPX() {
  return (
    <div className="absolute inset-0 bg-[#0B0C0F] flex items-center justify-center">

      <div className="w-[85%] rounded-[32px] border border-white/10 bg-[#1C1C1E]/80 backdrop-blur-3xl p-8">

        <div className="text-[#FF5A1F] text-sm tracking-[0.3em] mb-4">
          GPX IMPORT
        </div>

        <h2 className="text-white text-4xl font-black mb-6">
          Barcelona Coast Route
        </h2>

        <div className="space-y-4 text-zinc-400">

          <div>Distance: 84km</div>

          <div>Elevation: 920m</div>

          <div>Estimated Time: 2h 10m</div>

        </div>

        <button className="mt-8 w-full bg-[#FF5A1F] py-4 rounded-2xl text-white text-lg font-bold">
          Load Route
        </button>

      </div>

    </div>
  );
}
