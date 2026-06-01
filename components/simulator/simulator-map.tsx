export default function SimulatorMap() {
  return (
    <div className="absolute inset-0 bg-[#0B0C0F] overflow-hidden">

      {/* GRID */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* GPS ROUTE */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 800"
      >
        <path
          d="M120 700 C180 600 220 500 260 400 C300 300 240 180 180 100"
          stroke="#FF5A1F"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      {/* USER POSITION */}
      <div className="absolute bottom-40 left-1/2 -translate-x-1/2">

        <div className="relative">

          <div className="absolute inset-0 rounded-full bg-[#35C759] blur-xl opacity-80 scale-150" />

          <div className="relative w-8 h-8 rounded-full bg-[#35C759] border-4 border-white shadow-[0_0_30px_rgba(53,199,89,1)]" />

        </div>

      </div>

    </div>
  );
}
