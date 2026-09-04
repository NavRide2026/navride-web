'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { NewFolderForm } from '@/components/site/new-folder-form';
import { Download, Trash2, MapPin, Smartphone, Globe, RefreshCw } from 'lucide-react';

interface GpxTrack {
  id: string;
  name: string;
  description: string | null;
  distance_km: number | null;
  duration_sec: number | null;
  waypoint_count: number | null;
  source: 'app' | 'web' | 'import';
  synced_to_app: boolean;
  synced_to_web: boolean;
  created_at: string;
  gpx_xml: string | null;
  folder_id: string | null;
}

interface GpxFolder {
  id: string;
  name: string;
  sort_order: number | null;
}

type FolderFilter = 'all' | 'unfiled' | string;

export default function MisRutas() {
  const [tracks, setTracks] = useState<GpxTrack[]>([]);
  const [folders, setFolders] = useState<GpxFolder[]>([]);
  const [foldersAvailable, setFoldersAvailable] = useState(true);
  const [folderMode, setFolderMode] = useState<'tables' | 'settings'>('settings');
  const [filter, setFilter] = useState<FolderFilter>('all');
  const [membership, setMembership] = useState<Record<string, string | null>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    loadTracks();
  }, []);

  async function loadTracks() {
    setLoading(true);
    setAuthError(false);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setAuthError(true);
      setLoading(false);
      return;
    }
    setUserId(user.id);

    const [tracksRes, foldersRes] = await Promise.all([
      supabase
        .from('gpx_tracks')
        .select('id,name,description,distance_km,duration_sec,waypoint_count,source,synced_to_app,synced_to_web,created_at,gpx_xml,folder_id')
        .order('updated_at', { ascending: false }),
      supabase
        .from('gpx_folders')
        .select('id,name,sort_order')
        .eq('owner_id', user.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
    ]);

    let canUseFolders = !foldersRes.error;
    let mode: 'tables' | 'settings' = foldersRes.error ? 'settings' : 'tables';
    let nextFolders: GpxFolder[] = foldersRes.error
      ? []
      : ((foldersRes.data as GpxFolder[]) ?? []);
    let nextMembership: Record<string, string | null> = {};

    if (foldersRes.error) {
      // Fallback: user_profiles.settings.navride_gpx_folders_v1
      const profile = await supabase
        .from('user_profiles')
        .select('settings')
        .eq('id', user.id)
        .maybeSingle();
      const settings =
        profile.data?.settings && typeof profile.data.settings === 'object'
          ? (profile.data.settings as Record<string, unknown>)
          : {};
      const blob = settings.navride_gpx_folders_v1;
      if (blob && typeof blob === 'object') {
        const b = blob as Record<string, unknown>;
        if (Array.isArray(b.folders)) {
          nextFolders = (b.folders as Array<Record<string, unknown>>).map(f => ({
            id: String(f.id),
            name: String(f.name ?? ''),
            sort_order: (f.sort_order as number | null) ?? 0,
          }));
          canUseFolders = true;
          mode = 'settings';
        }
        if (b.membership && typeof b.membership === 'object') {
          nextMembership = b.membership as Record<string, string | null>;
        }
      }
    }

    setFolders(nextFolders);
    setFolderMode(mode);
    setMembership(nextMembership);

    if (!tracksRes.error && tracksRes.data) {
      const rows = tracksRes.data as GpxTrack[];
      setTracks(
        mode === 'settings'
          ? rows.map(t => ({
              ...t,
              folder_id: nextMembership[t.id] ?? t.folder_id ?? null,
            }))
          : rows,
      );
    } else if (tracksRes.error) {
      // gpx_tracks.folder_id puede no existir todavía: recargar sin esa columna.
      const legacy = await supabase
        .from('gpx_tracks')
        .select('id,name,description,distance_km,duration_sec,waypoint_count,source,synced_to_app,synced_to_web,created_at,gpx_xml')
        .order('updated_at', { ascending: false });
      if (!legacy.error && legacy.data) {
        setTracks(
          (legacy.data as Omit<GpxTrack, 'folder_id'>[]).map(t => ({
            ...t,
            folder_id: nextMembership[t.id] ?? null,
          })),
        );
        canUseFolders = canUseFolders || Object.keys(nextMembership).length >= 0;
      }
    }

    setFoldersAvailable(canUseFolders);
    setLoading(false);
  }

  async function persistGpxFolderSettings(
    nextFolders: GpxFolder[],
    nextMembership: Record<string, string | null>,
  ) {
    if (!userId) return;
    const supabase = createClient();
    const profile = await supabase
      .from('user_profiles')
      .select('settings')
      .eq('id', userId)
      .maybeSingle();
    const settings =
      profile.data?.settings && typeof profile.data.settings === 'object'
        ? { ...(profile.data.settings as Record<string, unknown>) }
        : {};
    settings.navride_gpx_folders_v1 = {
      folders: nextFolders.map(f => ({
        id: f.id,
        name: f.name,
        sort_order: f.sort_order ?? 0,
        owner_id: userId,
        updated_at: new Date().toISOString(),
      })),
      membership: nextMembership,
      updated_at: new Date().toISOString(),
    };
    await supabase.from('user_profiles').upsert({
      id: userId,
      settings,
      updated_at: new Date().toISOString(),
    });
  }

  async function createFolder(name: string) {
    if (!userId) return;
    const supabase = createClient();
    if (folderMode === 'tables') {
      const { data, error } = await supabase
        .from('gpx_folders')
        .insert({
          id: crypto.randomUUID(),
          owner_id: userId,
          name,
          sort_order: folders.length,
        })
        .select('id,name,sort_order')
        .single();
      if (!error && data) setFolders(f => [...f, data as GpxFolder]);
      return;
    }
    const folder: GpxFolder = {
      id: crypto.randomUUID(),
      name,
      sort_order: folders.length,
    };
    const next = [...folders, folder];
    setFolders(next);
    await persistGpxFolderSettings(next, membership);
  }

  /** Al borrar la carpeta los tracks se conservan y quedan sin carpeta. */
  async function deleteFolder(folder: GpxFolder) {
    if (!confirm(`¿Eliminar la carpeta "${folder.name}"?\nSus rutas quedarán sin carpeta.`)) return;
    const supabase = createClient();
    const nextFolders = folders.filter(x => x.id !== folder.id);
    const nextMembership = { ...membership };
    for (const t of tracks) {
      if (t.folder_id === folder.id) nextMembership[t.id] = null;
    }
    setFolders(nextFolders);
    setMembership(nextMembership);
    setTracks(t => t.map(x => (x.folder_id === folder.id ? { ...x, folder_id: null } : x)));
    setFilter(current => (current === folder.id ? 'all' : current));
    if (folderMode === 'tables') {
      await supabase.from('gpx_tracks').update({ folder_id: null }).eq('folder_id', folder.id);
      await supabase.from('gpx_folders').delete().eq('id', folder.id);
      return;
    }
    await persistGpxFolderSettings(nextFolders, nextMembership);
  }

  async function moveTrack(trackId: string, folderId: string | null) {
    const previous = tracks.find(t => t.id === trackId)?.folder_id ?? null;
    setTracks(t => t.map(x => (x.id === trackId ? { ...x, folder_id: folderId } : x)));
    const nextMembership = { ...membership, [trackId]: folderId };
    setMembership(nextMembership);
    if (folderMode === 'tables') {
      const supabase = createClient();
      const { error } = await supabase
        .from('gpx_tracks')
        .update({ folder_id: folderId })
        .eq('id', trackId);
      if (error) {
        setTracks(t => t.map(x => (x.id === trackId ? { ...x, folder_id: previous } : x)));
      }
      return;
    }
    await persistGpxFolderSettings(folders, nextMembership);
  }

  async function deleteTrack(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}" de la nube?\nNo se borrará del dispositivo.`)) return;
    setDeleting(id);
    const supabase = createClient();
    await supabase.from('gpx_tracks').delete().eq('id', id);
    setTracks(t => t.filter(x => x.id !== id));
    setDeleting(null);
  }

  function downloadGpx(track: GpxTrack) {
    if (!track.gpx_xml) return;
    const blob = new Blob([track.gpx_xml], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${track.name.replace(/[^a-z0-9]/gi, '_')}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatDuration(sec: number | null) {
    if (!sec) return '—';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  const unfiledCount = useMemo(
    () => tracks.filter(t => !t.folder_id).length,
    [tracks],
  );

  const visibleTracks = useMemo(() => {
    if (filter === 'all') return tracks;
    if (filter === 'unfiled') return tracks.filter(t => !t.folder_id);
    return tracks.filter(t => t.folder_id === filter);
  }, [filter, tracks]);

  if (authError) {
    return (
      <main className="min-h-screen bg-[#0F1115] text-white flex items-center justify-center">
        <div className="text-center">
          <MapPin size={40} className="text-[#333] mx-auto mb-4" />
          <p className="text-[#888]">Necesitas iniciar sesión para ver tus rutas.</p>
          <a
            href="/login"
            className="mt-4 inline-block px-6 py-2 rounded-full bg-[#f97316] text-white font-medium hover:bg-[#f97316]/90 transition"
          >
            Iniciar Sesión
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0F1115] text-white pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Mis Rutas</h1>
            <p className="text-[#888] text-sm mt-1">
              Tracks GPX sincronizados desde tu app NavRide
            </p>
          </div>
          <button
            onClick={loadTracks}
            className="p-2 rounded-lg bg-[#1A1D23] hover:bg-[#22252C] transition"
            title="Actualizar"
          >
            <RefreshCw size={18} className="text-[#888]" />
          </button>
        </div>

        {foldersAvailable && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <FolderChip
              active={filter === 'all'}
              onClick={() => setFilter('all')}
              label={`Todas (${tracks.length})`}
            />
            <FolderChip
              active={filter === 'unfiled'}
              onClick={() => setFilter('unfiled')}
              label={`Sin carpeta (${unfiledCount})`}
            />
            {folders.map(folder => {
              const count = tracks.filter(t => t.folder_id === folder.id).length;
              return (
                <span
                  key={folder.id}
                  className={`flex items-center gap-1 rounded-full border pl-3 pr-1.5 transition ${
                    filter === folder.id
                      ? 'border-[#f97316] bg-[#f97316]/15'
                      : 'border-[#22252C]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setFilter(folder.id)}
                    className={`py-1.5 text-xs ${
                      filter === folder.id ? 'text-[#f97316]' : 'text-[#888] hover:text-white'
                    }`}
                  >
                    {folder.name} ({count})
                  </button>
                  <button
                    type="button"
                    title="Eliminar carpeta"
                    onClick={() => void deleteFolder(folder)}
                    className="rounded-full p-1 text-[#666] hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              );
            })}
            <NewFolderForm onCreate={createFolder} />
          </div>
        )}

        {loading && (
          <div className="text-center text-[#888] py-16">Cargando rutas...</div>
        )}

        {!loading && tracks.length === 0 && (
          <div className="text-center py-16">
            <MapPin size={40} className="text-[#333] mx-auto mb-4" />
            <p className="text-[#666]">No hay rutas sincronizadas aún.</p>
            <p className="text-[#444] text-sm mt-2">
              Abre la app NavRide → Tracks GPX → icono nube para sincronizar.
            </p>
          </div>
        )}

        {!loading && tracks.length > 0 && visibleTracks.length === 0 && (
          <div className="text-center py-16 text-[#666]">
            Esta carpeta está vacía. Mueve rutas aquí desde el selector de cada track.
          </div>
        )}

        <div className="space-y-3">
          {visibleTracks.map(track => (
            <div
              key={track.id}
              className="bg-[#1A1D23] rounded-xl p-4 flex items-center gap-4"
            >
              {/* Icono origen */}
              <div className="w-10 h-10 rounded-full bg-[#22252C] flex items-center justify-center flex-shrink-0">
                {track.source === 'app' ? (
                  <Smartphone size={18} className="text-orange-400" />
                ) : (
                  <Globe size={18} className="text-blue-400" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{track.name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-[#666]">
                  {track.distance_km !== null && (
                    <span>{track.distance_km.toFixed(1)} km</span>
                  )}
                  {track.duration_sec !== null && (
                    <span>{formatDuration(track.duration_sec)}</span>
                  )}
                  {track.waypoint_count !== null && (
                    <span>{track.waypoint_count} pts</span>
                  )}
                  <span>{formatDate(track.created_at)}</span>
                </div>

                {/* Badges sync */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {track.synced_to_app && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      📱 En app
                    </span>
                  )}
                  {track.synced_to_web && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      🌐 En web
                    </span>
                  )}
                  {foldersAvailable && (
                    <select
                      value={track.folder_id ?? ''}
                      onChange={e => void moveTrack(track.id, e.target.value || null)}
                      aria-label={`Carpeta de ${track.name}`}
                      className="text-[11px] rounded-full bg-[#22252C] border border-[#2C3038] px-2 py-1 text-[#888] outline-none focus:border-[#f97316]"
                    >
                      <option value="">Sin carpeta</option>
                      {folders.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {track.gpx_xml && (
                  <button
                    onClick={() => downloadGpx(track)}
                    className="p-2 rounded-lg hover:bg-[#22252C] transition text-[#888] hover:text-white"
                    title="Descargar GPX"
                  >
                    <Download size={16} />
                  </button>
                )}
                <button
                  onClick={() => deleteTrack(track.id, track.name)}
                  disabled={deleting === track.id}
                  className="p-2 rounded-lg hover:bg-red-500/10 transition text-[#888] hover:text-red-400 disabled:opacity-40"
                  title="Eliminar de la nube"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function FolderChip({
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
          ? 'border-[#f97316] bg-[#f97316]/15 text-[#f97316]'
          : 'border-[#22252C] text-[#888] hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}
