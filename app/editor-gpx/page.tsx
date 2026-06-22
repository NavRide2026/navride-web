export const dynamic = "force-dynamic";

import GpxEditor from "@/components/gpx/GpxEditor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editor GPX",
  description: "Dibuja una ruta en el mapa y expórtala como GPX para NavRide.",
};

export default function EditorGpxPage() {
  return (
    // fixed inset-0 z-50 → cubre la navbar y ocupa exactamente 100vw × 100vh
    <div className="fixed inset-0 z-50 bg-[#050608] flex flex-col">
      <GpxEditor />
    </div>
  );
}
