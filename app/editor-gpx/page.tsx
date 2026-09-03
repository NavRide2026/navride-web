export const dynamic = "force-dynamic";

import GpxEditor from "@/components/gpx/GpxEditor";
import type { Metadata } from "next";
import { isNavRideAppEmbed } from "@/lib/route-studio/navride-editor-bridge";

export const metadata: Metadata = {
  title: "NavRide Route Studio",
  description: "Crea rutas GPX con routing por modo, deshacer/rehacer y sync con la app NavRide.",
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditorGpxPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const raw = sp.embed;
  const embedParam = Array.isArray(raw) ? raw[0] : raw;
  const embedNavRideApp = isNavRideAppEmbed(embedParam);

  return (
    <div
      className={
        embedNavRideApp
          ? "fixed inset-0 z-50 bg-[#050608] flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden"
          : "fixed inset-0 z-50 bg-[#050608] flex flex-col"
      }
      data-navride-embed={embedNavRideApp ? "navride-app" : undefined}
    >
      <GpxEditor embedNavRideApp={embedNavRideApp} />
    </div>
  );
}
