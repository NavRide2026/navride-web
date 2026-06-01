export default function TutorialMap() {
  return (
    <div className="rounded-[32px] border border-white/10 bg-[#1C1C1E] h-[500px] relative overflow-hidden">

      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="absolute top-1/2 left-1/2 w-8 h-8 rounded-full bg-[#35C759] shadow-[0_0_30px_rgba(53,199,89,1)] -translate-x-1/2 -translate-y-1/2" />

    </div>
  );
}
