"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search, Star } from "lucide-react";
import {
  DESIGN_CATEGORIES,
  getActiveDesignSources,
  isIconScoutConfigured,
  normalizeSearchQuery,
} from "@/lib/design/catalog";
import { searchIcons, type IconifyResult } from "@/lib/design/iconify";
import { NewFolderForm } from "@/components/site/new-folder-form";
import type { DesignLibrary } from "./useDesignLibrary";

const SEARCH_DEBOUNCE_MS = 400;

export default function DiscoverPanel({ library }: { library: DesignLibrary }) {
  const [rawQuery, setRawQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categoryId, setCategoryId] = useState(DESIGN_CATEGORIES[0].id);
  const [results, setResults] = useState<IconifyResult[]>([]);
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<IconifyResult | null>(null);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedQuery(rawQuery),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [rawQuery]);

  const category =
    DESIGN_CATEGORIES.find((c) => c.id === categoryId) ?? DESIGN_CATEGORIES[0];
  const freeText = normalizeSearchQuery(debouncedQuery);
  const effectiveQuery = freeText || category.query;

  /** Sin estado de carga propio: la petición pendiente es la que aún no se ha resuelto. */
  const loading = loadedQuery !== effectiveQuery;

  useEffect(() => {
    const controller = new AbortController();
    searchIcons(effectiveQuery, { limit: 32, signal: controller.signal })
      .then((icons) => {
        setResults(icons);
        setSearchError(null);
        setLoadedQuery(effectiveQuery);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setResults([]);
        setSearchError(
          err instanceof Error && err.message.startsWith("ICONIFY_")
            ? "Iconify no respondió. Reintenta en unos segundos."
            : "No se pudo conectar con Iconify.",
        );
        setLoadedQuery(effectiveQuery);
      });
    return () => controller.abort();
  }, [effectiveQuery]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-500"
          />
          <input
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            placeholder="Busca en español: flecha, moto, brújula, velocímetro…"
            aria-label="Buscar iconos"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pr-4 pl-9 text-sm text-zinc-100 outline-none focus:border-orange-500"
          />
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {freeText
            ? `Buscando «${freeText}» en Iconify.`
            : "Escribe para buscar o elige una categoría."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {DESIGN_CATEGORIES.map((c) => {
            const active = !freeText && c.id === categoryId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCategoryId(c.id);
                  setRawQuery("");
                }}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  active
                    ? "border-orange-500 bg-orange-500/15 text-orange-300"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {searchError && (
          <p className="mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {searchError}
          </p>
        )}

        <div className="mt-5">
          {loading && (
            <p className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 size={14} className="animate-spin" /> Buscando…
            </p>
          )}
          {!loading && results.length === 0 && !searchError && (
            <p className="text-sm text-zinc-500">
              {category.id === "packs"
                ? "No hay packs compatibles disponibles actualmente. Explora otras categorías para componentes Iconify."
                : `Sin resultados para «${effectiveQuery}».`}
            </p>
          )}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {results.map((icon) => {
              const saved = library.savedAssetIds.has(`iconify:${icon.id}`);
              return (
                <button
                  key={icon.id}
                  type="button"
                  onClick={() => setSelected(icon)}
                  title={icon.id}
                  className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border p-2 transition ${
                    selected?.id === icon.id
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-600"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={icon.thumbnailUrl}
                    alt={icon.name}
                    width={32}
                    height={32}
                    loading="lazy"
                    className="h-8 w-8"
                  />
                  <span className="w-full truncate text-[10px] text-zinc-500">
                    {icon.name}
                  </span>
                  {saved && (
                    <span className="text-[9px] text-orange-400">Guardado</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        {selected ? (
          <IconDetail
            key={selected.id}
            icon={selected}
            categoryId={freeText ? null : category.id}
            library={library}
          />
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-500">
            Selecciona un icono para ver autor, licencia y guardarlo en tu
            biblioteca.
          </div>
        )}

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
          <h3 className="text-sm font-medium text-zinc-200">Fuentes activas</h3>
          <ul className="mt-2 space-y-2">
            {getActiveDesignSources().map((source) => (
              <li key={source.id} className="text-xs text-zinc-500">
                <a
                  href={source.homepage}
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-400 hover:underline"
                >
                  {source.name}
                </a>
                <span className="block">{source.description}</span>
              </li>
            ))}
          </ul>
          {!isIconScoutConfigured() && (
            <p className="mt-3 border-t border-zinc-800 pt-3 text-xs text-zinc-600">
              IconScout no está configurado en esta instancia, así que no se
              ofrece como fuente.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

function IconDetail({
  icon,
  categoryId,
  library,
}: {
  icon: IconifyResult;
  categoryId: string | null;
  library: DesignLibrary;
}) {
  const [folderId, setFolderId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (statusTimer.current) clearTimeout(statusTimer.current);
    },
    [],
  );

  const alreadySaved = library.savedAssetIds.has(`iconify:${icon.id}`);

  async function save() {
    setSaving(true);
    const ok = await library.saveItem({
      providerId: "iconify",
      providerAssetId: icon.id,
      title: icon.name,
      category: categoryId,
      folderId: folderId || null,
      licenseRef: icon.licenseTitle,
      sourceRef: icon.sourceUrl,
    });
    setSaving(false);
    setStatus(ok ? "Guardado en tu biblioteca." : "No se pudo guardar.");
    statusTimer.current = setTimeout(() => setStatus(null), 4000);
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-zinc-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={icon.thumbnailUrl}
            alt={icon.name}
            width={40}
            height={40}
            className="h-10 w-10"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-zinc-100">{icon.name}</p>
          <p className="truncate text-xs text-zinc-500">{icon.id}</p>
        </div>
      </div>

      <dl className="mt-4 space-y-1.5 text-xs">
        <div className="flex justify-between gap-3">
          <dt className="text-zinc-500">Colección</dt>
          <dd className="truncate text-zinc-300">{icon.collectionName}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-zinc-500">Autor</dt>
          <dd className="truncate text-zinc-300">
            {icon.authorUrl ? (
              <a
                href={icon.authorUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                {icon.authorName ?? "Ver autor"}
              </a>
            ) : (
              (icon.authorName ?? "—")
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-zinc-500">Licencia</dt>
          <dd className="truncate text-zinc-300">
            {icon.licenseUrl ? (
              <a
                href={icon.licenseUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                {icon.licenseTitle ?? "Ver licencia"}
              </a>
            ) : (
              (icon.licenseTitle ?? "—")
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-zinc-500">Origen</dt>
          <dd className="truncate">
            <a
              href={icon.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-orange-400 hover:underline"
            >
              iconify.design
            </a>
          </dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-zinc-800 pt-4">
        {!library.userId ? (
          <p className="text-xs text-zinc-500">
            <a href="/login" className="text-orange-400 hover:underline">
              Inicia sesión
            </a>{" "}
            para guardarlo en tu biblioteca.
          </p>
        ) : library.unavailable ? (
          <p className="text-xs text-zinc-500">
            Tu biblioteca aún no está disponible en este entorno.
          </p>
        ) : (
          <>
            <label className="block text-xs text-zinc-500">
              Carpeta
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-orange-500"
              >
                <option value="">Sin carpeta</option>
                {library.folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-full bg-orange-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
              >
                <Star size={13} />
                {alreadySaved ? "Guardar otra copia" : "Guardar en biblioteca"}
              </button>
              <NewFolderForm
                onCreate={async (name) => {
                  const folder = await library.createFolder(name);
                  if (folder) setFolderId(folder.id);
                }}
              />
            </div>
            {status && <p className="mt-2 text-xs text-zinc-400">{status}</p>}
          </>
        )}
      </div>
    </div>
  );
}
