export default function SimulatorCamera() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">

      <div className="rounded-[32px] border border-orange-500/20 bg-black/60 backdrop-blur-3xl p-10">

        <div className="text-[#FF5A1F] text-sm tracking-[0.3em] mb-4">
          CAMERA MODE
        </div>

        <div className="text-white text-5xl font-black mb-6">
          Dynamic Camera
        </div>

        <div className="text-zinc-400 text-xl max-w-md">
          Zoom and heading adapt dynamically depending on speed and navigation state.
        </div>

      </div>

    </div>
  );
}
