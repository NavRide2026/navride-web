"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SKIN_PROVIDERS_FALLBACK } from "@/lib/skin/providersFallback";

type Provider = {
  id: string;
  name: string;
  homepage: string;
  category_url?: string;
  enabled?: boolean;
  description?: string;
  license_mode?: string;
  import_mode?: string;
  sort_order?: number;
};

type ThemeItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
};

const PREVIEW_BASE =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "https://jzididvkdaitdmcoipip.supabase.co") +
  "/storage/v1/object/public/navride-garage-previews/";

export default function SkinHubClient({
  hideHeader = false,
}: {
  /** El estudio de diseño ya aporta su propia cabecera y contenedor. */
  hideHeader?: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${PREVIEW_BASE}config/providers.txt`, {
        cache: "no-store",
      });
      if (res.ok) {
        const list = (await res.json()) as Provider[];
        setProviders(
          list
            .filter((p) => p.enabled !== false)
            .sort((a, b) => (a.sort_order ?? 100) - (b.sort_order ?? 100)),
        );
      } else {
        setProviders([...SKIN_PROVIDERS_FALLBACK]);
      }
    } catch {
      setProviders([...SKIN_PROVIDERS_FALLBACK]);
    }

    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id ?? null;
    setUid(userId);
    if (!userId) {
      setThemes([]);
      return;
    }
    const { data: ents } = await supabase
      .from("garage_user_entitlements")
      .select("catalog_item_id")
      .eq("user_id", userId);
    const ids = (ents ?? []).map((e) => e.catalog_item_id as string);
    if (!ids.length) {
      setThemes([]);
      return;
    }
    const { data: items } = await supabase
      .from("garage_catalog_items")
      .select("id,slug,name,description,metadata")
      .in("id", ids)
      .eq("status", "published");
    const mine = (items ?? []).filter((it) => {
      const m = (it.metadata ?? {}) as Record<string, unknown>;
      return m.skin_hub === true && m.kind === "theme";
    }) as ThemeItem[];
    setThemes(mine);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  async function activateTheme(item: ThemeItem) {
    if (!uid) return;
    setBusy(item.id);
    setMsg(null);
    try {
      const { data, error } = await supabase.functions.invoke(
        "garage-skin-import",
        {
          body: {
            phase: "activate",
            sha256: "0".repeat(64),
            byteSize: 1,
            catalogItemId: item.id,
            storagePath: `${uid}/noop/bundle.navrideskin`,
          },
        },
      );
      if (error) throw error;
      const payload = data as { ok?: boolean; error?: string };
      if (!payload?.ok) throw new Error(payload?.error ?? "ACTIVATE_FAILED");
      setMsg(
        `Preferencia remota: «${item.name}». La App lo activará al sincronizar.`,
      );
    } catch (e) {
      setMsg(`Error: ${e}`);
    } finally {
      setBusy(null);
    }
  }

  async function deleteTheme(item: ThemeItem) {
    if (!uid) return;
    if (!confirm(`¿Eliminar «${item.name}» de tu biblioteca?`)) return;
    setBusy(item.id);
    try {
      const { data, error } = await supabase.functions.invoke(
        "garage-skin-import",
        {
          body: {
            phase: "delete",
            sha256: "0".repeat(64),
            byteSize: 1,
            catalogItemId: item.id,
            storagePath: `${uid}/noop/bundle.navrideskin`,
          },
        },
      );
      if (error) throw error;
      const payload = data as { ok?: boolean; error?: string };
      if (!payload?.ok) throw new Error(payload?.error ?? "DELETE_FAILED");
      setMsg("Eliminado. La App volverá a NavRide Original en el próximo sync.");
      await load();
    } catch (e) {
      setMsg(`Error al eliminar: ${e}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className={
        hideHeader ? "text-zinc-100" : "mx-auto max-w-5xl px-4 py-8 text-zinc-100"
      }
    >
      {!hideHeader && (
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-orange-400">
            NavRide Skin Hub
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Temas, packs e iconos externos
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            La Web es el cerebro: importa y adapta. La App es el runtime. Misma
            biblioteca de cuenta — sin packs inventados.
          </p>
        </header>
      )}

      {msg && (
        <div className="mb-6 rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm">
          {msg}
        </div>
      )}

      <section className="mb-10">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-medium">Mis temas</h2>
          <button
            type="button"
            onClick={() => void load()}
            className="text-xs text-zinc-400 underline"
          >
            Sincronizar
          </button>
        </div>
        {!uid && (
          <p className="text-sm text-zinc-500">
            Inicia sesión para ver tu biblioteca.
          </p>
        )}
        {uid && themes.length === 0 && (
          <p className="text-sm text-zinc-500">
            Vacío. Importa un .navrideskin o crea uno en Theme Builder.
          </p>
        )}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {themes.map((t) => {
            const prov = (t.metadata?.provenance as { provider?: string } | undefined)
              ?.provider;
            const vis = String(t.metadata?.visibility ?? "private");
            return (
              <article
                key={t.id}
                className="min-w-[220px] rounded-xl border border-zinc-800 bg-zinc-950/80 p-4"
              >
                <h3 className="font-medium">{t.name}</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  {vis} · {prov ?? "import"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy === t.id}
                    onClick={() => void activateTheme(t)}
                    className="rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium"
                  >
                    Usar en NavRide
                  </button>
                  <button
                    type="button"
                    disabled={busy === t.id}
                    onClick={() => void deleteTheme(t)}
                    className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-medium">Explorar fuentes</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => (
            <a
              key={p.id}
              href={p.category_url || p.homepage}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 transition hover:border-orange-500/50"
            >
              <h3 className="font-medium">{p.name}</h3>
              <p className="mt-1 text-xs text-zinc-500">{p.description}</p>
              <p className="mt-3 text-xs text-orange-400">Explorar →</p>
            </a>
          ))}
        </div>
      </section>

      <section className="mb-10 grid gap-3 sm:grid-cols-2">
        <Link
          href="/garage/builder"
          className="rounded-xl border border-orange-700/40 bg-orange-950/30 p-5"
        >
          <h2 className="text-lg font-medium">Theme Builder</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Importa ZIP/PNG/WebP/SVG, asigna slots, preview real, exporta
            .navrideskin.
          </p>
        </Link>
        <Link
          href="/garage/builder?mode=import"
          className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5"
        >
          <h2 className="text-lg font-medium">Importar</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Archivo .navrideskin, ZIP compatible o URL HTTPS validada.
          </p>
        </Link>
      </section>
    </div>
  );
}
