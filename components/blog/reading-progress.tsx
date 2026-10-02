"use client";

import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="fixed inset-x-0 top-16 md:top-20 z-50 h-[3px] bg-white/5 backdrop-blur-sm pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-[#FF8500] via-[#FF9D2E] to-[#8BEA00] transition-[width] duration-150 ease-out shadow-[0_0_12px_rgba(255,133,0,0.8)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
