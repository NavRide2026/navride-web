export default function TutorialHUD() {
  return (
    <div className="rounded-[32px] border border-white/10 bg-[#1C1C1E] h-[500px] p-10">

      <div className="flex justify-between items-start">

        <div>
          <div className="text-zinc-500 text-sm">
            SPEED
          </div>

          <div className="text-6xl font-black text-[#35C759]">
            64
          </div>
        </div>

        <div className="text-right">
          <div className="text-zinc-500 text-sm">
            GPS
          </div>

          <div className="text-2xl text-[#35C759]">
            HIGH
          </div>
        </div>

      </div>

    </div>
  );
}
