"use client";

import { useState } from "react";
import TutorialMap from "./tutorial-map";
import TutorialHUD from "./tutorial-hud";
import TutorialGPX from "./tutorial-gpx";
import TutorialCamera from "./tutorial-camera";
import TutorialProgress from "./tutorial-progress";

export default function TutorialEngine() {

  const [step, setStep] = useState(0);

  const nextStep = () => {
    setStep((prev) => prev + 1);
  };

  return (
    <section className="relative min-h-screen bg-[#050608] text-white overflow-hidden">

      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,90,31,0.14),transparent_40%)]" />

      {/* GRID */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-8 py-24">

        <TutorialProgress step={step} />

        {/* STEP 0 */}
        {step === 0 && (
          <div className="text-center py-32">

            <div className="text-[#FF5A1F] tracking-[0.35em] text-sm mb-6">
              NAVRIDE INTERACTIVE EXPERIENCE
            </div>

            <h1 className="text-8xl font-black tracking-tight mb-8">
              Tutorials
            </h1>

            <p className="text-zinc-400 text-2xl max-w-3xl mx-auto leading-relaxed">
              Learn the entire navigation ecosystem through interactive simulation.
            </p>

            <button
              onClick={nextStep}
              className="mt-14 bg-[#FF5A1F] text-white px-10 py-5 rounded-[24px] text-xl font-bold hover:scale-105 transition shadow-[0_0_60px_rgba(255,90,31,0.35)]"
            >
              Start Tutorial
            </button>

          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div className="grid md:grid-cols-2 gap-12 items-center py-20">

            <TutorialMap />

            <div>

              <div className="text-[#FF5A1F] mb-4 tracking-[0.3em] text-sm">
                GPS POSITIONING
              </div>

              <h2 className="text-6xl font-black mb-8">
                Real-Time GPS
              </h2>

              <p className="text-zinc-400 text-xl leading-relaxed mb-10">
                NavRide continuously tracks and smooths GPS position for stable navigation experience.
              </p>

              <button
                onClick={nextStep}
                className="bg-[#FF5A1F] px-8 py-4 rounded-2xl text-lg font-bold"
              >
                Continue
              </button>

            </div>

          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="grid md:grid-cols-2 gap-12 items-center py-20">

            <TutorialCamera />

            <div>

              <div className="text-[#FF5A1F] mb-4 tracking-[0.3em] text-sm">
                DYNAMIC CAMERA
              </div>

              <h2 className="text-6xl font-black mb-8">
                Adaptive Camera
              </h2>

              <p className="text-zinc-400 text-xl leading-relaxed mb-10">
                Camera zoom and heading adapt dynamically depending on speed and movement.
              </p>

              <button
                onClick={nextStep}
                className="bg-[#FF5A1F] px-8 py-4 rounded-2xl text-lg font-bold"
              >
                Continue
              </button>

            </div>

          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="grid md:grid-cols-2 gap-12 items-center py-20">

            <TutorialGPX />

            <div>

              <div className="text-[#FF5A1F] mb-4 tracking-[0.3em] text-sm">
                GPX IMPORT
              </div>

              <h2 className="text-6xl font-black mb-8">
                GPX Ecosystem
              </h2>

              <p className="text-zinc-400 text-xl leading-relaxed mb-10">
                Import, preview and navigate GPX routes with advanced rendering systems.
              </p>

              <button
                onClick={nextStep}
                className="bg-[#FF5A1F] px-8 py-4 rounded-2xl text-lg font-bold"
              >
                Continue
              </button>

            </div>

          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div className="grid md:grid-cols-2 gap-12 items-center py-20">

            <TutorialHUD />

            <div>

              <div className="text-[#35C759] mb-4 tracking-[0.3em] text-sm">
                NAVIGATION HUD
              </div>

              <h2 className="text-6xl font-black mb-8">
                Live Navigation
              </h2>

              <p className="text-zinc-400 text-xl leading-relaxed mb-10">
                Navigation overlays provide speed, heading, ETA and precision systems in real time.
              </p>

              <button
                onClick={nextStep}
                className="bg-[#35C759] text-black px-8 py-4 rounded-2xl text-lg font-bold"
              >
                Finish Tutorial
              </button>

            </div>

          </div>
        )}

        {/* STEP 5 */}
        {step === 5 && (
          <div className="text-center py-32">

            <div className="text-[#35C759] tracking-[0.35em] text-sm mb-6">
              SYSTEM READY
            </div>

            <h2 className="text-7xl font-black mb-8">
              You are ready for NavRide
            </h2>

            <p className="text-zinc-400 text-2xl max-w-3xl mx-auto">
              Explore the ecosystem and experience next-generation navigation.
            </p>

          </div>
        )}

      </div>
    </section>
  );
}
