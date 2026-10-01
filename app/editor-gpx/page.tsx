export const dynamic = "force-dynamic";

import GpxEditorSafe from "@/components/gpx/GpxEditorSafe";
import RouteStudioIntro from "@/components/route-studio/route-studio-intro";
import RouteStudioCopy from "@/components/route-studio/route-studio-copy";
import type { Metadata } from "next";
import { isNavRideAppEmbed } from "@/lib/route-studio/navride-editor-bridge";
import styles from "./editor.module.css";

export const metadata: Metadata = {
  title: "Editor de rutas GPX",
  description: "Crea rutas GPX por modo de transporte, deshaz o rehace cambios y sincroniza la ruta con la aplicación NavRide.",
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
      className={`${styles.editorPage} fixed inset-0 z-[120] flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[#050608]`}
      data-navride-embed={embedNavRideApp ? "navride-app" : undefined}
      data-route-studio="true"
    >
      <div className="min-h-0 flex-1">
        <GpxEditorSafe embedNavRideApp={embedNavRideApp} />
      </div>
      <RouteStudioIntro enabled={!embedNavRideApp} />
      <RouteStudioCopy />
    </div>
  );
}
