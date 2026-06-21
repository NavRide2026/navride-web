export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MapPin, Zap, Clock, TrendingUp } from "lucide-react";
import WeeklyChart from "@/components/garaje/WeeklyChart";

interface RecordedSession {
  id: string;
  created_at: string;
  duration_seconds: number | null;
  distance_meters: number | null;
  max_speed_kmh: number | null;
  avg_speed_kmh: number | null;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getWeekLabel(iso: string): string {
  const d = new Date(iso);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `S${week}`;
}

export default async function MiGarajePage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: sessions } = await supabase
    .from("recorded_sessions")
    .select(
      "id, created_at, duration_seconds, distance_meters, max_speed_kmh, avg_speed_kmh"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const allSessions: RecordedSession[] = sessions ?? [];

  // Calcular stats globales
  const totalKm =
    allSessions.reduce((acc, s) => acc + (s.distance_meters ?? 0), 0) / 1000;
  const maxSpeed = Math.max(
    0,
    ...allSessions.map((s) => s.max_speed_kmh ?? 0)
  );
  const avgSpeed =
    allSessions.length > 0
      ? allSessions.reduce((acc, s) => acc + (s.avg_speed_kmh ?? 0), 0) /
        allSessions.length
      : 0;
  const totalSeconds = allSessions.reduce(
    (acc, s) => acc + (s.duration_seconds ?? 0),
    0
  );
  const totalHours = totalSeconds / 3600;

  // Km por semana (últimas 8 semanas)
  const weekMap: Record<string, number> = {};
  allSessions.forEach((s) => {
    const label = getWeekLabel(s.created_at);
    weekMap[label] = (weekMap[label] ?? 0) + (s.distance_meters ?? 0) / 1000;
  });
  const weeklyData = Object.entries(weekMap)
    .map(([week, km]) => ({ week, km: Math.round(km * 10) / 10 }))
    .slice(-8);

  const stats = [
    {
      icon: <MapPin size={20} className="text-[#f97316]" />,
      label: "Total km",
      value: `${totalKm.toFixed(1)} km`,
    },
    {
      icon: <Zap size={20} className="text-[#f97316]" />,
      label: "Velocidad máx.",
      value: `${maxSpeed.toFixed(0)} km/h`,
    },
    {
      icon: <TrendingUp size={20} className="text-[#f97316]" />,
      label: "Velocidad media",
      value: `${avgSpeed.toFixed(1)} km/h`,
    },
    {
      icon: <Clock size={20} className="text-[#f97316]" />,
      label: "Total horas",
      value: `${totalHours.toFixed(1)} h`,
    },
  ];

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 bg-[#050608]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Mi Garaje
          </h1>
          <p className="text-white/40 mt-1 text-sm">{user.email}</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/8 bg-white/3 p-5 flex flex-col gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-[#f97316]/10 flex items-center justify-center">
                {s.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Weekly chart */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6 mb-8">
          <h2 className="text-base font-semibold text-white mb-4">
            Km por semana
          </h2>
          <WeeklyChart data={weeklyData} />
        </div>

        {/* Sessions table */}
        <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-base font-semibold text-white">
              Últimas sesiones
            </h2>
          </div>

          {allSessions.length === 0 ? (
            <div className="px-6 py-12 text-center text-white/30 text-sm">
              Aún no tienes sesiones grabadas. ¡Sal a rodar!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/30 text-xs uppercase tracking-widest border-b border-white/5">
                    <th className="text-left px-6 py-3">Fecha</th>
                    <th className="text-right px-6 py-3">Duración</th>
                    <th className="text-right px-6 py-3">Distancia</th>
                    <th className="text-right px-6 py-3">Vel. máx.</th>
                    <th className="text-right px-6 py-3">Vel. media</th>
                  </tr>
                </thead>
                <tbody>
                  {allSessions.map((s, i) => (
                    <tr
                      key={s.id}
                      className={`border-b border-white/5 hover:bg-white/3 transition-colors ${
                        i === allSessions.length - 1 ? "border-0" : ""
                      }`}
                    >
                      <td className="px-6 py-4 text-white/70">
                        {formatDate(s.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right text-white/70">
                        {s.duration_seconds != null
                          ? formatDuration(s.duration_seconds)
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-right text-white">
                        {s.distance_meters != null
                          ? `${(s.distance_meters / 1000).toFixed(2)} km`
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-right text-[#f97316]">
                        {s.max_speed_kmh != null
                          ? `${s.max_speed_kmh.toFixed(0)} km/h`
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-right text-white/60">
                        {s.avg_speed_kmh != null
                          ? `${s.avg_speed_kmh.toFixed(1)} km/h`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
