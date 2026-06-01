export default function SimulatorHUD() {
  return (
    <>
      {/* TOP HUD */}
      <div className="absolute top-16 left-6 right-6 z-30">

        <div className="rounded-[28px] border border-white/10 bg-black/50 backdrop-blur-2xl p-5">

          <div className="flex justify-between items-center">

            <div>
              <div className="text-zinc-500 text-xs">
                NEXT TURN
              </div>

              <div className="text-white text-2xl font-bold">
                Turn right in 240m
              </div>
            </div>

            <div className="text-[#35C759] text-sm">
              GPS HIGH
            </div>

          </div>

        </div>

      </div>

      {/* SPEED HUD */}
      <div className="absolute bottom-40 right-6 z-30">

        <div className="w-28 h-28 rounded-full border border-white/10 bg-black/60 backdrop-blur-2xl flex flex-col items-center justify-center shadow-[0_0_40px_rgba(255,90,31,0.2)]">

          <div className="text-4xl font-black text-white">
            64
          </div>

          <div className="text-zinc-500 text-sm">
            KM/H
          </div>

        </div>

      </div>

      {/* BOTTOM PANEL */}
      <div className="absolute bottom-0 left-0 right-0 z-30">

        <div className="rounded-t-[36px] border-t border-white/10 bg-black/70 backdrop-blur-3xl p-8">

          <div className="w-20 h-1 rounded-full bg-zinc-700 mx-auto mb-6" />

          <div className="flex justify-between items-center">

            <div>

              <div className="text-zinc-500 text-sm">
                ETA
              </div>

              <div className="text-white text-3xl font-bold">
                18 min
              </div>

            </div>

            <button className="bg-[#FF5A1F] px-8 py-4 rounded-2xl text-white font-bold shadow-[0_0_40px_rgba(255,90,31,0.35)]">
              Start
            </button>

          </div>

        </div>

      </div>
    </>
  );
}
