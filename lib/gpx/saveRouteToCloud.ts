import type { SupabaseClient, User } from "@supabase/supabase-js";

export type SaveRouteInput = {
  title: string;
  gpxXml: string;
  waypointsCount: number;
  distanceM: number;
};

export type SaveRouteResult =
  | { ok: true; routeId: string; storageUrl: string }
  | { ok: false; error: string };

/** Garantiza fila en user_profiles (FK author_id). */
export async function ensureUserProfile(
  supabase: SupabaseClient,
  user: User,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const displayName =
    (user.user_metadata?.display_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Rider";

  const { error } = await supabase.from("user_profiles").upsert(
    { id: user.id, display_name: displayName },
    { onConflict: "id" },
  );

  if (error) {
    return {
      ok: false,
      error: `Error al preparar tu perfil: ${error.message}`,
    };
  }
  return { ok: true };
}

/**
 * Extrae object path del bucket `gpx` (privado) desde:
 * - path relativo
 * - URL histórica public / sign / authenticated
 */
export function objectPathFromStorageRef(ref: string): string | null {
  const trimmed = ref.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return trimmed.replace(/^\/+/, "");
  }
  try {
    const u = new URL(trimmed);
    const markers = [
      "/object/public/gpx/",
      "/object/sign/gpx/",
      "/object/authenticated/gpx/",
    ];
    for (const m of markers) {
      const i = u.pathname.indexOf(m);
      if (i >= 0) {
        return decodeURIComponent(u.pathname.substring(i + m.length));
      }
    }
    const g = u.pathname.indexOf("/gpx/");
    if (g >= 0) {
      return decodeURIComponent(u.pathname.substring(g + "/gpx/".length));
    }
  } catch {
    return null;
  }
  return null;
}

/** @deprecated use objectPathFromStorageRef */
export function storagePathFromPublicUrl(url: string): string | null {
  return objectPathFromStorageRef(url);
}

/** Sube GPX al bucket privado; storage_url = object path (nunca getPublicUrl). */
export async function saveRouteToCloud(
  supabase: SupabaseClient,
  user: User,
  input: SaveRouteInput,
): Promise<SaveRouteResult> {
  const profile = await ensureUserProfile(supabase, user);
  if (!profile.ok) return profile;

  const safeTitle = input.title.trim() || "Mi ruta NavRide";
  const blob = new Blob([input.gpxXml], { type: "application/gpx+xml" });
  const fileName = `${user.id}/${Date.now()}_${safeTitle.replace(/\s+/g, "_")}.gpx`;

  const { error: storageErr } = await supabase.storage
    .from("gpx")
    .upload(fileName, blob, {
      contentType: "application/gpx+xml",
      upsert: false,
    });

  if (storageErr) {
    return { ok: false, error: `Error al subir el archivo: ${storageErr.message}` };
  }

  const { data: row, error: insertErr } = await supabase
    .from("gpx_routes")
    .insert({
      author_id: user.id,
      title: safeTitle,
      storage_url: fileName,
      waypoints_count: input.waypointsCount,
      distance_m: Math.round(input.distanceM),
      is_public: false,
      difficulty: "medium",
    })
    .select("id")
    .single();

  if (insertErr) {
    await supabase.storage.from("gpx").remove([fileName]).catch(() => {});
    return { ok: false, error: `Error al guardar la ruta: ${insertErr.message}` };
  }

  return {
    ok: true,
    routeId: row.id as string,
    storageUrl: fileName,
  };
}

/** Actualiza GPX existente (misma fila — sync Realtime en app GPX Web). */
export async function updateRouteToCloud(
  supabase: SupabaseClient,
  user: User,
  routeId: string,
  input: SaveRouteInput,
): Promise<SaveRouteResult> {
  const profile = await ensureUserProfile(supabase, user);
  if (!profile.ok) return profile;

  const { data: row, error: fetchErr } = await supabase
    .from("gpx_routes")
    .select("storage_url, author_id")
    .eq("id", routeId)
    .single();

  if (fetchErr || !row) {
    return { ok: false, error: "No se encontró la ruta guardada." };
  }
  if (row.author_id !== user.id) {
    return { ok: false, error: "No tienes permiso para editar esta ruta." };
  }

  const path = objectPathFromStorageRef(row.storage_url as string);
  if (!path) {
    return { ok: false, error: "Referencia de almacenamiento inválida." };
  }

  const safeTitle = input.title.trim() || "Mi ruta NavRide";
  const blob = new Blob([input.gpxXml], { type: "application/gpx+xml" });

  const { error: uploadErr } = await supabase.storage.from("gpx").upload(path, blob, {
    contentType: "application/gpx+xml",
    upsert: true,
  });

  if (uploadErr) {
    return { ok: false, error: `Error al actualizar el archivo: ${uploadErr.message}` };
  }

  const { error: updateErr } = await supabase
    .from("gpx_routes")
    .update({
      title: safeTitle,
      storage_url: path,
      waypoints_count: input.waypointsCount,
      distance_m: Math.round(input.distanceM),
      updated_at: new Date().toISOString(),
    })
    .eq("id", routeId);

  if (updateErr) {
    return { ok: false, error: `Error al actualizar la ruta: ${updateErr.message}` };
  }

  return {
    ok: true,
    routeId,
    storageUrl: path,
  };
}

/** Crea o actualiza según si ya hay routeId guardado en el editor. */
export async function saveOrUpdateRouteToCloud(
  supabase: SupabaseClient,
  user: User,
  input: SaveRouteInput,
  existingRouteId?: string | null,
): Promise<SaveRouteResult> {
  if (existingRouteId) {
    return updateRouteToCloud(supabase, user, existingRouteId, input);
  }
  return saveRouteToCloud(supabase, user, input);
}

import { SITE_URL } from "@/lib/site/constants";

export const NAVRIDE_WEB_BASE = SITE_URL;

export function buildRouteDeepLinks(routeId: string) {
  return {
    https: `${NAVRIDE_WEB_BASE}/ruta/${routeId}`,
    appScheme: `navride://gpx/${routeId}`,
    androidIntent: `intent://gpx/${routeId}#Intent;scheme=navride;package=com.navride.app;S.browser_fallback_url=${encodeURIComponent(`${NAVRIDE_WEB_BASE}/ruta/${routeId}`)};end`,
  };
}

/** Abre NavRide en móvil (scheme + intent con fallback HTTPS). */
export function tryOpenNavRideApp(routeId: string): boolean {
  if (typeof window === "undefined") return false;
  const links = buildRouteDeepLinks(routeId);
  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);

  if (!isMobile) return false;

  if (/Android/i.test(ua)) {
    window.location.href = links.androidIntent;
    window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        window.location.href = links.appScheme;
      }
    }, 1200);
    return true;
  }

  window.location.href = links.appScheme;
  window.setTimeout(() => {
    if (document.visibilityState === "visible") {
      window.location.href = links.https;
    }
  }, 1800);
  return true;
}

export async function copyRouteLink(routeId: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(buildRouteDeepLinks(routeId).https);
    return true;
  } catch {
    return false;
  }
}

/** Descarga autenticada del propio GPX (bucket privado + RLS). */
export async function downloadOwnGpx(
  supabase: SupabaseClient,
  storageRef: string,
  filename: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const path = objectPathFromStorageRef(storageRef);
  if (!path) return { ok: false, error: "Referencia de almacenamiento inválida." };
  const { data, error } = await supabase.storage.from("gpx").download(path);
  if (error || !data) {
    return { ok: false, error: error?.message ?? "No se pudo descargar el GPX." };
  }
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".gpx") ? filename : `${filename}.gpx`;
  a.click();
  URL.revokeObjectURL(url);
  return { ok: true };
}

/**
 * GPX autorizado vía Edge `gpx-route-content` (is_public u ownership).
 * No service_role en cliente. No signed URL persistida.
 */
export async function fetchGpxViaEdge(
  supabase: SupabaseClient,
  routeId: string,
): Promise<
  | { ok: true; gpxXml: string; title?: string }
  | { ok: false; error: string; status?: number }
> {
  try {
    const { data, error } = await supabase.functions.invoke("gpx-route-content", {
      body: { route_id: routeId },
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    if (data && typeof data === "object" && "gpx_xml" in data && typeof (data as { gpx_xml: unknown }).gpx_xml === "string") {
      const d = data as { gpx_xml: string; title?: string };
      return { ok: true, gpxXml: d.gpx_xml, title: d.title };
    }
    if (data && typeof data === "object" && "error" in data) {
      return {
        ok: false,
        error: String((data as { error: unknown }).error),
      };
    }
    return { ok: false, error: "Respuesta Edge inválida" };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error Edge",
    };
  }
}
