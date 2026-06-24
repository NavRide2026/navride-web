"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Smartphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { tryOpenNavRideApp } from "@/lib/gpx/saveRouteToCloud";

type Props = {
  params: Promise<{ id: string }>;
};

export default function RutaDeepLinkPage({ params }: Props) {
  const [routeId, setRouteId] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void params.then((p) => setRouteId(p.id));
  }, [params]);

  useEffect(() => {
    if (!routeId) return;
    const supabase = createClient();
    void supabase
      .from("gpx_routes")
      .select("title")
      .eq("id", routeId)
      .maybeSingle()
      .then(({ data }) => {
        setTitle((data?.title as string) ?? null);
        setLoading(false);
        tryOpenNavRideApp(routeId);
      });
  }, [routeId]);

  if (!routeId || loading) {
    return (
      <main className="min-h-screen bg-[#050608] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#f97316]" size={32} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050608] flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#0a0a0a] p-8 text-center flex flex-col gap-4">
        <Smartphone size={40} className="mx-auto text-[#f97316]" />
        <h1 className="text-xl font-bold text-white">
          {title ?? "Ruta NavRide"}
        </h1>
        <p className="text-sm text-white/50">
          Si tienes NavRide instalada, la ruta debería abrirse automáticamente.
        </p>
        <button
          type="button"
          onClick={() => tryOpenNavRideApp(routeId)}
          className="rounded-full bg-[#f97316] py-3 text-sm font-semibold text-white hover:bg-[#f97316]/90 transition"
        >
          Abrir en NavRide
        </button>
        <Link href="/perfil" className="text-xs text-white/40 hover:text-white/70">
          Ver mis rutas guardadas
        </Link>
      </div>
    </main>
  );
}
