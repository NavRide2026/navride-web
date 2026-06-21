export const dynamic = "force-dynamic";

import GpxEditor from "@/components/gpx/GpxEditor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editor GPX",
  description: "Dibuja una ruta en el mapa y expórtala como GPX para NavRide.",
};

export default function EditorGpxPage() {
  return (
    <main className="h-screen pt-16 md:pt-20 flex flex-col bg-[#050608]">
      <GpxEditor />
    </main>
  );
}
