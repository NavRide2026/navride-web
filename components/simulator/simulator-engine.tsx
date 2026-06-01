"use client";

import { useState } from "react";

import AndroidFrame from "./android-frame";
import SimulatorMap from "./simulator-map";
import SimulatorHUD from "./simulator-hud";
import SimulatorGPX from "./simulator-gpx";
import SimulatorCamera from "./simulator-camera";

export default function SimulatorEngine() {

  const [screen, setScreen] = useState("map");

  return (
    <section className="min-h-screen bg-[#050608] flex flex-col items-center justify-center px-8 py-20 overflow-hidden">

      {/* TITLE */}
      <div className="text-center mb-16">

        <div className="text-[#FF5A1F] tracking-[0.35em] text-sm mb-6">
          INTERACTIVE NAVIGATION SIMULATOR
        </div>

        <h1 className="text-white text-7xl font-black tracking-tight">
          Try NavRide
        </h1>

      </div>

      {/* PHONE */}
      <AndroidFrame>

        {screen === "map" && (
          <>
            <SimulatorMap />
            <SimulatorHUD />
          </>
        )}

        {screen === "gpx" && (
          <SimulatorGPX />
        )}

        {screen === "camera" && (
          <SimulatorCamera />
        )}

      </AndroidFrame>

      {/* CONTROLS */}
      <div className="flex flex-wrap gap-4 justify-center mt-12">

        <button
          onClick={() => setScreen("map")}
          className="bg-[#FF5A1F] px-6 py-3 rounded-2xl text-white font-bold"
        >
          Navigation
        </button>

        <button
          onClick={() => setScreen("gpx")}
          className="border border-white/10 bg-white/[0.03] px-6 py-3 rounded-2xl text-white"
        >
          GPX
        </button>

        <button
          onClick={() => setScreen("camera")}
          className="border border-white/10 bg-white/[0.03] px-6 py-3 rounded-2xl text-white"
        >
          Camera
        </button>

      </div>

    </section>
  );
}
