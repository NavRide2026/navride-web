export default function AndroidFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative w-[420px] h-[860px] rounded-[48px] border-[10px] border-[#1C1C1E] bg-black shadow-[0_0_120px_rgba(255,90,31,0.18)] overflow-hidden">

      {/* TOP BAR */}
      <div className="absolute top-0 left-0 right-0 h-10 bg-black z-50 flex items-center justify-center">
        <div className="w-32 h-6 rounded-full bg-[#111]" />
      </div>

      {children}

    </div>
  );
}
