export const dynamic = "force-dynamic";

import GpxEditor from "@/components/gpx/GpxEditor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NavRide Route Studio",
  description: "Crea rutas GPX con routing por modo, deshacer/rehacer y sync con la app NavRide.",
};

export default function EditorGpxPage() {
  return (
    // fixed inset-0 z-50 → cubre la navbar y ocupa exactamente 100vw × 100vh
    <div className="fixed inset-0 z-50 bg-[#050608] flex flex-col">
      <GpxEditor />
    </div>
  );
}
