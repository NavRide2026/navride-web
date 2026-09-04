"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Pencil, Star, Trash2 } from "lucide-react";
import { categoryLabel } from "@/lib/design/catalog";
import { iconThumbnailUrl } from "@/lib/design/iconify";
import { NewFolderForm } from "@/components/site/new-folder-form";
import type { DesignLibrary, DesignLibraryItem } from "./useDesignLibrary";

type Filter = { kind: "all" | "favorites" | "unfiled" | "folder"; folderId?: string };

export default function LibraryPanel({ library }: { library: DesignLibrary }) {
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const counts = useMemo(() => {
    const perFolder = new Map<string, number>();
    let unfiled = 0;
    let favorites = 0;
    for (const item of library.items) {
      if (item.favorite) favorites += 1;
      if (item.folder_id) {
        perFolder.set(item.folder_id, (perFolder.get(item.folder_id) ?? 0) + 1);
      } else {
        unfiled += 1;
      }
    }
    return { perFolder, unfiled, favorites };
  }, [library.items]);

  const visible = useMemo(() => {
    switch (filter.kind) {
      case "favorites":
        return library.items.filter((i) => i.favorite);
      case "unfiled":
        return library.items.filter((i) => !i.folder_id);
      case "folder":
        return library.items.filter((i) => i.folder_id === filter.folderId);
      default:
        return library.items;
    }
  }, [filter, library.items]);

  if (!library.userId) {
    return (
      <p className="text-sm text-zinc-500">
        <a href="/login" className="text-orange-400 hover:underline">
          Inicia sesión
        </a>{" "}
        para crear carpetas y guardar diseños en tu biblioteca.
      </p>
    );
  }

  if (library.unavailable) {
    return (
      <p className="text-sm text-zinc-500">
        La biblioteca personal aún no está disponible en este entorno: falta
        aplicar la migración de <code>design_folders</code> y{" "}
        <code>design_library_items</code>.
      </p>
    );
  }

  async function confirmDeleteFolder(folderId: string, name: string) {
    if (
      !confirm(
        `¿Eliminar la carpeta «${name}»?\nSus elementos pasarán a «Sin carpeta».`,
      )
    ) {
      return;
    }
    await library.deleteFolder(folderId);
    setFilter({ kind: "all" });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          active={filter.kind === "all"}
          onClick={() => setFilter({ kind: "all" })}
          label={`Todo (${library.items.length})`}
        />
        <FilterChip
          active={filter.kind === "favorites"}
          onClick={() => setFilter({ kind: "favorites" })}
          label={`Favoritos (${counts.favorites})`}
        />
        <FilterChip
          active={filter.kind === "unfiled"}
          onClick={() => setFilter({ kind: "unfiled" })}
          label={`Sin carpeta (${counts.unfiled})`}
        />
        {library.folders.map((folder) =>
          renaming === folder.id ? (
            <form
              key={folder.id}
              onSubmit={async (e) => {
                e.preventDefault();
                await library.renameFolder(folder.id, renameValue);
                setRenaming(null);
              }}
              className="flex items-center gap-1"
            >
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                maxLength={80}
                className="w-36 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                className="rounded-full bg-orange-600 px-3 py-1.5 text-xs text-white"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setRenaming(null)}
                className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400"
              >
                Cancelar
              </button>
            </form>
          ) : (
            <span
              key={folder.id}
              className={`flex items-center gap-1 rounded-full border pr-1.5 pl-3 transition ${
                filter.folderId === folder.id
                  ? "border-orange-500 bg-orange-500/15"
                  : "border-zinc-800"
              }`}
            >
              <button
                type="button"
                onClick={() => setFilter({ kind: "folder", folderId: folder.id })}
                className={`py-1.5 text-xs ${
                  filter.folderId === folder.id
                    ? "text-orange-300"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {folder.name} ({counts.perFolder.get(folder.id) ?? 0})
              </button>
              <button
                type="button"
                title="Renombrar"
                onClick={() => {
                  setRenaming(folder.id);
                  setRenameValue(folder.name);
                }}
                className="rounded-full p-1 text-zinc-500 hover:text-zinc-200"
              >
                <Pencil size={12} />
              </button>
              <button
                type="button"
                title="Eliminar carpeta"
                onClick={() => void confirmDeleteFolder(folder.id, folder.name)}
                className="rounded-full p-1 text-zinc-500 hover:text-red-400"
              >
                <Trash2 size={12} />
              </button>
            </span>
          ),
        )}
        <NewFolderForm onCreate={(name) => library.createFolder(name)} />
      </div>

      {library.error && (
        <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {library.error}
        </p>
      )}

      {library.loading && <p className="text-sm text-zinc-500">Cargando…</p>}

      {!library.loading && visible.length === 0 && (
        <p className="text-sm text-zinc-500">
          Nada aquí todavía. Guarda elementos desde la pestaña Descubrir.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => (
          <LibraryCard key={item.id} item={item} library={library} />
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition ${
        active
          ? "border-orange-500 bg-orange-500/15 text-orange-300"
          : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
      }`}
    >
      {label}
    </button>
  );
}

function LibraryCard({
  item,
  library,
}: {
  item: DesignLibraryItem;
  library: DesignLibrary;
}) {
  const thumbnail =
    item.provider_id === "iconify"
      ? iconThumbnailUrl(item.provider_asset_id)
      : null;

  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-900">
          {thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnail}
              alt={item.title ?? item.provider_asset_id}
              width={32}
              height={32}
              loading="lazy"
              className="h-8 w-8"
            />
          ) : (
            <span className="text-xs text-zinc-600">SVG</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-zinc-100">
            {item.title ?? item.provider_asset_id}
          </p>
          <p className="truncate text-xs text-zinc-500">
            {categoryLabel(item.category)} · {item.provider_asset_id}
          </p>
          <p className="mt-0.5 truncate text-xs text-zinc-600">
            {item.license_ref ?? "Licencia no registrada"}
          </p>
        </div>
        <button
          type="button"
          title={item.favorite ? "Quitar de favoritos" : "Marcar favorito"}
          onClick={() => void library.toggleFavorite(item.id, !item.favorite)}
          className={`rounded-full p-1.5 transition ${
            item.favorite
              ? "text-orange-400"
              : "text-zinc-600 hover:text-zinc-300"
          }`}
        >
          <Star size={16} fill={item.favorite ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <select
          value={item.folder_id ?? ""}
          onChange={(e) => void library.moveItem(item.id, e.target.value || null)}
          aria-label="Mover a carpeta"
          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 outline-none focus:border-orange-500"
        >
          <option value="">Sin carpeta</option>
          {library.folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        {item.source_ref && (
          <a
            href={item.source_ref}
            target="_blank"
            rel="noreferrer"
            title="Ver origen"
            className="rounded-lg border border-zinc-800 p-1.5 text-zinc-500 hover:text-zinc-200"
          >
            <ExternalLink size={14} />
          </a>
        )}
        <button
          type="button"
          title="Eliminar de la biblioteca"
          onClick={() => {
            if (confirm(`¿Eliminar «${item.title ?? item.provider_asset_id}»?`)) {
              void library.removeItem(item.id);
            }
          }}
          className="rounded-lg border border-zinc-800 p-1.5 text-zinc-500 hover:text-red-400"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </article>
  );
}
