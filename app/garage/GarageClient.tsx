"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type GarageCategory =
  | "all"
  | "puck"
  | "speedometer"
  | "hud"
  | "route_style"
  | "compass"
  | "gpx_icon_pack"
  | "decoration"
  | "pack";

export type GarageItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  status: string;
  preview_path: string | null;
  is_free: boolean;
  version: number;
  metadata: Record<string, unknown> | null;
};

const CATEGORIES: { id: GarageCategory; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "puck", label: "Pucks" },
  { id: "speedometer", label: "Velocímetros" },
  { id: "hud", label: "HUD" },
  { id: "route_style", label: "Ruta" },
  { id: "compass", label: "Brújulas" },
  { id: "gpx_icon_pack", label: "GPX" },
  { id: "decoration", label: "Decoración" },
  { id: "pack", label: "Packs" },
];

const PREVIEW_BASE =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "https://jzididvkdaitdmcoipip.supabase.co") +
  "/storage/v1/object/public/navride-garage-previews/";

function previewUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${PREVIEW_BASE}${path}`;
}

function categoryLabel(cat: string): string {
  return CATEGORIES.find((c) => c.id === cat)?.label ?? cat;
}

export default function GarageClient({
  initialItems = [],
}: {
  initialItems?: GarageItem[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<GarageItem[]>(initialItems);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [cat, setCat] = useState<GarageCategory>("all");
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id ?? null;
    setUserId(uid);

    const { data, error: qErr } = await supabase
      .from("garage_catalog_items")
      .select(
        "id,slug,name,description,category,status,preview_path,is_free,version,metadata",
      )
      .eq("status", "published")
      .order("category")
      .order("name");

    if (qErr) {
      setError(qErr.message);
      setLoading(false);
      return;
    }
    setItems((data as GarageItem[]) ?? []);

    if (uid) {
      const { data: ents } = await supabase
        .from("garage_user_entitlements")
        .select("catalog_item_id")
        .eq("user_id", uid);
      setOwned(new Set((ents ?? []).map((e) => e.catalog_item_id as string)));
    } else {
      setOwned(new Set());
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => (cat === "all" ? items : items.filter((i) => i.category === cat)),
    [items, cat],
  );

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: items.length };
    for (const i of items) m[i.category] = (m[i.category] ?? 0) + 1;
    return m;
  }, [items]);

  async function claim(item: GarageItem) {
    if (!userId) {
      const next = encodeURIComponent(`/garage?claim=${item.slug}`);
      window.location.href = `/login?next=${next}`;
      return;
    }
    setBusyId(item.id);
    setError(null);
    const { error: rpcErr } = await supabase.rpc("navride_garage_claim_item", {
      p_item_id: item.id,
    });
    setBusyId(null);
    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }
    setOwned((prev) => new Set(prev).add(item.id));
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) {
      setToast("Obtenido ✓ — ábrelo en NavRide para descargar y activar.");
    } else {
      setToast(
        "Guardado en tu NavRide. Estará disponible en la app con esta misma cuenta.",
      );
    }
  }

  // Auto-claim after login redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const claimSlug = params.get("claim");
    if (!claimSlug || !userId || items.length === 0) return;
    const item = items.find((i) => i.slug === claimSlug);
    if (!item || owned.has(item.id)) return;
    void claim(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, items]);

  return (
    <main className="min-h-screen bg-[#050608] text-white">
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-10">
        <header className="mb-10">
          <p className="text-sm font-medium tracking-wide text-[#FF5A1F]">
            NAVRIDE
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
            NavRide Garage
          </h1>
          <p className="mt-3 max-w-xl text-lg text-white/70">
            Haz que NavRide sea tuyo.
          </p>
        </header>

        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                cat === c.id
                  ? "bg-[#FF5A1F] text-white"
                  : "bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              {c.label}
              <span className="ml-2 text-white/50">{counts[c.id] ?? 0}</span>
            </button>
          ))}
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}
        {toast && (
          <p className="mb-4 rounded-lg border border-[#35C759]/40 bg-[#35C759]/10 px-4 py-3 text-sm text-[#35C759]">
            {toast}
          </p>
        )}

        {loading ? (
          <p className="text-white/60">Cargando catálogo…</p>
        ) : filtered.length === 0 ? (
          <p className="text-red-300">Sin elementos en esta categoría.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => {
              const has = owned.has(item.id);
              const src = previewUrl(item.preview_path);
              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-[#10141c]"
                >
                  <div className="relative aspect-[16/10] bg-[#0a0c10]">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={src}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-white/30">
                        Sin preview
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-medium">{item.name}</h2>
                        <p className="text-xs uppercase tracking-wide text-white/45">
                          {categoryLabel(item.category)}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#35C759]/15 px-2 py-1 text-xs font-semibold text-[#35C759]">
                        GRATIS
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-white/65">
                      {item.description}
                    </p>
                    {has ? (
                      <div className="flex flex-col gap-2">
                        <div className="rounded-xl bg-white/5 px-4 py-2.5 text-center text-sm font-medium text-[#35C759]">
                          Obtenido ✓
                        </div>
                        <a
                          href={`navride://garage?item=${item.slug}`}
                          className="rounded-xl border border-white/15 px-4 py-2.5 text-center text-sm text-white/90 hover:bg-white/5"
                        >
                          Abrir en NavRide
                        </a>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void claim(item)}
                        className="w-full rounded-xl bg-[#FF5A1F] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
                      >
                        {busyId === item.id
                          ? "Añadiendo…"
                          : userId
                            ? "Añadir a NavRide"
                            : "Inicia sesión para añadir"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
