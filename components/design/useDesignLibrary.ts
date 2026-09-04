"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type DesignFolder = {
  id: string;
  name: string;
  sort_order: number | null;
};

export type DesignLibraryItem = {
  id: string;
  provider_id: string;
  provider_asset_id: string;
  title: string | null;
  category: string | null;
  folder_id: string | null;
  favorite: boolean;
  license_ref: string | null;
  source_ref: string | null;
  created_at: string | null;
};

const FOLDER_COLUMNS = "id,name,sort_order";
const ITEM_COLUMNS =
  "id,provider_id,provider_asset_id,title,category,folder_id,favorite,license_ref,source_ref,created_at";

type PostgrestLikeError = { code?: string; message?: string };

function isMissingTable(error: PostgrestLikeError | null): boolean {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /schema cache|does not exist/i.test(error.message ?? "")
  );
}

type DesignBlob = {
  folders: Array<Record<string, unknown>>;
  items: Array<Record<string, unknown>>;
};

type LibrarySnapshot = {
  userId: string | null;
  folders: DesignFolder[];
  items: DesignLibraryItem[];
  unavailable: boolean;
  error: string | null;
  mode: "tables" | "settings";
};

type SupabaseBrowserClient = ReturnType<typeof createClient>;

async function readSettingsBlob(
  supabase: SupabaseBrowserClient,
  userId: string,
): Promise<DesignBlob> {
  const { data } = await supabase
    .from("user_profiles")
    .select("settings")
    .eq("id", userId)
    .maybeSingle();
  const settings =
    data?.settings && typeof data.settings === "object"
      ? (data.settings as Record<string, unknown>)
      : {};
  const blob = settings.navride_design_v1;
  if (!blob || typeof blob !== "object") return { folders: [], items: [] };
  const b = blob as Record<string, unknown>;
  return {
    folders: Array.isArray(b.folders) ? (b.folders as Array<Record<string, unknown>>) : [],
    items: Array.isArray(b.items) ? (b.items as Array<Record<string, unknown>>) : [],
  };
}

async function writeSettingsBlob(
  supabase: SupabaseBrowserClient,
  userId: string,
  folders: DesignFolder[],
  items: DesignLibraryItem[],
) {
  const { data } = await supabase
    .from("user_profiles")
    .select("settings")
    .eq("id", userId)
    .maybeSingle();
  const settings =
    data?.settings && typeof data.settings === "object"
      ? { ...(data.settings as Record<string, unknown>) }
      : {};
  settings.navride_design_v1 = {
    folders: folders.map((f) => ({
      id: f.id,
      name: f.name,
      sort_order: f.sort_order ?? 0,
      owner_id: userId,
      updated_at: new Date().toISOString(),
    })),
    items: items.map((i) => ({
      id: i.id,
      provider_id: i.provider_id,
      provider_asset_id: i.provider_asset_id,
      title: i.title,
      category: i.category,
      folder_id: i.folder_id,
      favorite: i.favorite,
      license_ref: i.license_ref,
      source_ref: i.source_ref,
      owner_id: userId,
      updated_at: new Date().toISOString(),
      created_at: i.created_at,
    })),
    updated_at: new Date().toISOString(),
  };
  await supabase.from("user_profiles").upsert({
    id: userId,
    settings,
    updated_at: new Date().toISOString(),
  });
}

function mapFolder(raw: Record<string, unknown>): DesignFolder {
  return {
    id: String(raw.id),
    name: String(raw.name ?? ""),
    sort_order: (raw.sort_order as number | null) ?? 0,
  };
}

function mapItem(raw: Record<string, unknown>): DesignLibraryItem {
  return {
    id: String(raw.id),
    provider_id: String(raw.provider_id ?? ""),
    provider_asset_id: String(raw.provider_asset_id ?? ""),
    title: (raw.title as string | null) ?? null,
    category: (raw.category as string | null) ?? null,
    folder_id: (raw.folder_id as string | null) ?? null,
    favorite: raw.favorite === true,
    license_ref: (raw.license_ref as string | null) ?? null,
    source_ref: (raw.source_ref as string | null) ?? null,
    created_at: (raw.created_at as string | null) ?? null,
  };
}

async function fetchLibrary(
  supabase: SupabaseBrowserClient,
): Promise<LibrarySnapshot> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;
  const empty: LibrarySnapshot = {
    userId,
    folders: [],
    items: [],
    unavailable: false,
    error: null,
    mode: "settings",
  };
  if (!userId) return empty;

  const [foldersRes, itemsRes] = await Promise.all([
    supabase
      .from("design_folders")
      .select(FOLDER_COLUMNS)
      .eq("owner_id", userId)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    supabase
      .from("design_library_items")
      .select(ITEM_COLUMNS)
      .eq("owner_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (!isMissingTable(foldersRes.error) && !isMissingTable(itemsRes.error)) {
    return {
      userId,
      folders: (foldersRes.data as DesignFolder[] | null) ?? [],
      items: (itemsRes.data as DesignLibraryItem[] | null) ?? [],
      unavailable: false,
      error: (foldersRes.error ?? itemsRes.error)?.message ?? null,
      mode: "tables",
    };
  }

  // Fallback: user_profiles.settings.navride_design_v1 (app↔web sync without DDL)
  const blob = await readSettingsBlob(supabase, userId);
  return {
    userId,
    folders: blob.folders.map(mapFolder).filter((f) => f.name),
    items: blob.items.map(mapItem),
    unavailable: false,
    error: null,
    mode: "settings",
  };
}

export type DesignLibrary = ReturnType<typeof useDesignLibrary>;

export function useDesignLibrary() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [folders, setFolders] = useState<DesignFolder[]>([]);
  const [items, setItems] = useState<DesignLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"tables" | "settings">("settings");

  const apply = useCallback((snapshot: LibrarySnapshot) => {
    setUserId(snapshot.userId);
    setFolders(snapshot.folders);
    setItems(snapshot.items);
    setUnavailable(snapshot.unavailable);
    setError(snapshot.error);
    setMode(snapshot.mode);
    setLoading(false);
  }, []);

  const reload = useCallback(async () => {
    apply(await fetchLibrary(supabase));
  }, [apply, supabase]);

  const persistSettings = useCallback(
    async (nextFolders: DesignFolder[], nextItems: DesignLibraryItem[]) => {
      if (!userId) return;
      await writeSettingsBlob(supabase, userId, nextFolders, nextItems);
    },
    [supabase, userId],
  );

  useEffect(() => {
    let active = true;
    void fetchLibrary(supabase).then((snapshot) => {
      if (active) apply(snapshot);
    });
    return () => {
      active = false;
    };
  }, [apply, supabase]);

  const createFolder = useCallback(
    async (name: string): Promise<DesignFolder | null> => {
      const trimmed = name.trim();
      if (!userId || !trimmed) return null;
      setError(null);
      if (mode === "tables") {
        const { data, error: insertError } = await supabase
          .from("design_folders")
          .insert({
            id: crypto.randomUUID(),
            owner_id: userId,
            name: trimmed,
            sort_order: folders.length,
          })
          .select(FOLDER_COLUMNS)
          .single();
        if (insertError) {
          setError(insertError.message);
          return null;
        }
        const folder = data as DesignFolder;
        setFolders((prev) => [...prev, folder]);
        return folder;
      }
      const folder: DesignFolder = {
        id: crypto.randomUUID(),
        name: trimmed,
        sort_order: folders.length,
      };
      const next = [...folders, folder];
      setFolders(next);
      await persistSettings(next, items);
      return folder;
    },
    [folders, items, mode, persistSettings, supabase, userId],
  );

  const renameFolder = useCallback(
    async (folderId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setError(null);
      const next = folders.map((f) =>
        f.id === folderId ? { ...f, name: trimmed } : f,
      );
      setFolders(next);
      if (mode === "tables") {
        const { error: updateError } = await supabase
          .from("design_folders")
          .update({ name: trimmed })
          .eq("id", folderId);
        if (updateError) setError(updateError.message);
        return;
      }
      await persistSettings(next, items);
    },
    [folders, items, mode, persistSettings, supabase],
  );

  const deleteFolder = useCallback(
    async (folderId: string) => {
      setError(null);
      const nextFolders = folders.filter((f) => f.id !== folderId);
      const nextItems = items.map((i) =>
        i.folder_id === folderId ? { ...i, folder_id: null } : i,
      );
      setFolders(nextFolders);
      setItems(nextItems);
      if (mode === "tables") {
        await supabase
          .from("design_library_items")
          .update({ folder_id: null })
          .eq("folder_id", folderId);
        await supabase
          .from("design_folders")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", folderId);
        return;
      }
      await persistSettings(nextFolders, nextItems);
    },
    [folders, items, mode, persistSettings, supabase],
  );

  const saveItem = useCallback(
    async (input: {
      providerId: string;
      providerAssetId: string;
      title: string;
      category: string | null;
      folderId: string | null;
      licenseRef: string | null;
      sourceRef: string | null;
    }): Promise<boolean> => {
      if (!userId) return false;
      setError(null);
      if (mode === "tables") {
        const { data, error: insertError } = await supabase
          .from("design_library_items")
          .insert({
            id: crypto.randomUUID(),
            owner_id: userId,
            provider_id: input.providerId,
            provider_asset_id: input.providerAssetId,
            title: input.title,
            category: input.category,
            folder_id: input.folderId,
            favorite: false,
            license_ref: input.licenseRef,
            source_ref: input.sourceRef,
          })
          .select(ITEM_COLUMNS)
          .single();
        if (insertError) {
          setError(insertError.message);
          return false;
        }
        setItems((prev) => [data as DesignLibraryItem, ...prev]);
        return true;
      }
      const item: DesignLibraryItem = {
        id: crypto.randomUUID(),
        provider_id: input.providerId,
        provider_asset_id: input.providerAssetId,
        title: input.title,
        category: input.category,
        folder_id: input.folderId,
        favorite: false,
        license_ref: input.licenseRef,
        source_ref: input.sourceRef,
        created_at: new Date().toISOString(),
      };
      const next = [item, ...items];
      setItems(next);
      await persistSettings(folders, next);
      return true;
    },
    [folders, items, mode, persistSettings, supabase, userId],
  );

  const toggleFavorite = useCallback(
    async (itemId: string, favorite: boolean) => {
      setError(null);
      const next = items.map((i) => (i.id === itemId ? { ...i, favorite } : i));
      setItems(next);
      if (mode === "tables") {
        const { error: updateError } = await supabase
          .from("design_library_items")
          .update({ favorite })
          .eq("id", itemId);
        if (updateError) {
          setError(updateError.message);
          setItems((prev) =>
            prev.map((i) =>
              i.id === itemId ? { ...i, favorite: !favorite } : i,
            ),
          );
        }
        return;
      }
      await persistSettings(folders, next);
    },
    [folders, items, mode, persistSettings, supabase],
  );

  const moveItem = useCallback(
    async (itemId: string, folderId: string | null) => {
      setError(null);
      const next = items.map((i) =>
        i.id === itemId ? { ...i, folder_id: folderId } : i,
      );
      setItems(next);
      if (mode === "tables") {
        const { error: updateError } = await supabase
          .from("design_library_items")
          .update({ folder_id: folderId })
          .eq("id", itemId);
        if (updateError) setError(updateError.message);
        return;
      }
      await persistSettings(folders, next);
    },
    [folders, items, mode, persistSettings, supabase],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      setError(null);
      const next = items.filter((i) => i.id !== itemId);
      setItems(next);
      if (mode === "tables") {
        const { error: deleteError } = await supabase
          .from("design_library_items")
          .delete()
          .eq("id", itemId);
        if (deleteError) setError(deleteError.message);
        return;
      }
      await persistSettings(folders, next);
    },
    [folders, items, mode, persistSettings, supabase],
  );

  const savedAssetIds = useMemo(
    () => new Set(items.map((i) => `${i.provider_id}:${i.provider_asset_id}`)),
    [items],
  );

  return {
    userId,
    folders,
    items,
    savedAssetIds,
    loading,
    unavailable,
    error,
    reload,
    createFolder,
    renameFolder,
    deleteFolder,
    saveItem,
    toggleFavorite,
    moveItem,
    removeItem,
  };
}
