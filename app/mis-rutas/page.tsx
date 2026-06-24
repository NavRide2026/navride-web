'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
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
}

export default function MisRutas() {
  const [tracks, setTracks] = useState<GpxTrack[]>([]);
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
    const { data, error } = await supabase
      .from('gpx_tracks')
      .select('id,name,description,distance_km,duration_sec,waypoint_count,source,synced_to_app,synced_to_web,created_at,gpx_xml')
      .order('updated_at', { ascending: false });
    if (!error && data) setTracks(data as GpxTrack[]);
    setLoading(false);
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

        <div className="space-y-3">
          {tracks.map(track => (
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
                <div className="flex gap-2 mt-2">
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
