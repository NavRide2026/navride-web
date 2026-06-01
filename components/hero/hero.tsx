"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#050608] flex items-center justify-center">

      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,90,31,0.18),transparent_40%)]" />

      {/* MAIN GLOW */}
      <div className="absolute top-1/2 left-1/2 w-[1100px] h-[1100px] bg-[#FF5A1F]/10 blur-[220px] rounded-full -translate-x-1/2 -translate-y-1/2" />

      {/* GRID */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "90px 90px",
        }}
      />

      {/* CONTENT */}
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4 }}
        className="relative z-10 text-center px-6"
      >

        <div className="mb-6 text-[#FF5A1F] tracking-[0.35em] text-sm">
          ADVANCED GPS NAVIGATION
        </div>

        <h1 className="text-white text-8xl md:text-[11rem] font-black tracking-tight leading-none">
          NAVRIDE
        </h1>

        <div className="mt-6 text-zinc-500 text-2xl md:text-3xl font-light">
          Precision Navigation Ecosystem
        </div>

        <p className="mt-10 text-zinc-400 text-xl max-w-3xl mx-auto leading-relaxed">
          Advanced real-time navigation system with ultra smooth GPS tracking,
          dynamic camera technology and advanced GPX ecosystem integration.
        </p>

        {/* BUTTONS */}
        <div className="flex flex-wrap gap-5 justify-center mt-14">

          <button className="bg-[#FF5A1F] text-white px-10 py-5 rounded-[26px] text-lg font-bold hover:scale-105 transition duration-300 shadow-[0_0_60px_rgba(255,90,31,0.35)]">
            Download APK
          </button>

          <button className="border border-white/10 bg-white/[0.03] backdrop-blur-2xl text-white px-10 py-5 rounded-[26px] text-lg hover:bg-white/10 transition">
            Explore Roadmap
          </button>

        </div>

        {/* STATUS */}
        <div className="mt-20 flex items-center justify-center gap-3 text-[#35C759]">

          <div className="w-3 h-3 rounded-full bg-[#35C759] shadow-[0_0_20px_rgba(53,199,89,0.9)]" />

          <span className="tracking-wide text-sm">
            NAVIGATION SYSTEM ONLINE
          </span>

        </div>

      </motion.div>
    </section>
  );
}
