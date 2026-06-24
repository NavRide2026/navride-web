export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Route, Shield, Zap, AlertTriangle, TrendingUp } from "lucide-react";
import PerfilSignOutButton from "@/components/profile/PerfilSignOutButton";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import SavedRoutesList from "@/components/profile/SavedRoutesList";

// ─── Gamification helpers ────────────────────────────────────────────────────

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const LEVEL_TITLES = [
  "Principiante", "Explorador", "Trail Rider", "Expert",
  "Pro Rider", "Master", "Elite", "Legend", "NavRide Pro", "Hall of Fame",
];

function computeLevel(points: number) {
  let level = 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) { level = i; break; }
  }
  const title       = LEVEL_TITLES[level] ?? "Hall of Fame";
  const current     = LEVEL_THRESHOLDS[level] ?? 0;
  const next        = LEVEL_THRESHOLDS[level + 1] ?? null;
  const progressPct = next
    ? Math.round(((points - current) / (next - current)) * 100)
    : 100;
  return { level, title, progressPct, nextPoints: next };
}

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  if (role === "admin") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#f97316]/15 text-[#f97316] border border-[#f97316]/30">
      <Shield size={10} /> ADMIN
    </span>
  );
  if (role === "police") return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
      <Shield size={10} /> POLICIA
    </span>
  );
  return null;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function PerfilPage() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    redirect("/login");
  }

  let user: { id: string; email?: string } | null = null;
  let profile: {
    display_name: string | null;
    role: string;
    points: number;
    total_alerts: number;
  } | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;

    if (user) {
      const { data: p } = await supabase
        .from("user_profiles")
        .select("display_name, role, points, total_alerts")
        .eq("id", user.id)
        .maybeSingle();
      profile = p ?? null;
    }
  } catch {
    redirect("/login");
  }

  if (!user) redirect("/login");

  const name         = profile?.display_name ?? user.email?.split("@")[0] ?? "Rider";
  const role         = profile?.role ?? "user";
  const points       = profile?.points ?? 0;
  const totalAlerts  = profile?.total_alerts ?? 0;
  const { level, title: levelTitle, progressPct, nextPoints } = computeLevel(points);

  return (
    <main className="min-h-screen bg-[#050608] pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 md:px-8 flex flex-col gap-8">

        {/* ── Header ── */}
        <header className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#f97316]/15 border border-[#f97316]/30 flex items-center justify-center">
                <User size={28} className="text-[#f97316]" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-white">{name}</h1>
                  <RoleBadge role={role} />
                </div>
                <p className="text-sm text-white/40">{user.email}</p>
              </div>
            </div>
            <PerfilSignOutButton />
          </div>
        </header>

        {/* ── Gamification card ── */}
        <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 md:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-[#f97316]" /> Nivel
            </h2>
            <span className="text-xs text-white/30">
              {nextPoints ? `${points} / ${nextPoints} pts` : `${points} pts — nivel máx`}
            </span>
          </div>

          {/* Level badge + title */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#f97316] flex items-center justify-center shrink-0 shadow-lg shadow-[#f97316]/20">
              <span className="text-white font-extrabold text-lg leading-none">{level}</span>
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">{levelTitle}</p>
              <p className="text-white/40 text-xs mt-0.5">
                {nextPoints
                  ? `${nextPoints - points} pts para nivel ${level + 1}`
                  : "¡Nivel máximo alcanzado!"}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex flex-col gap-1.5">
            <div className="h-2 w-full rounded-full bg-white/8 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#f97316] to-[#fb923c] transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-white/25">
              <span>Nivel {level}</span>
              {nextPoints && <span>Nivel {level + 1}</span>}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="rounded-xl bg-white/3 border border-white/8 p-3 flex items-center gap-3">
              <TrendingUp size={18} className="text-[#f97316] shrink-0" />
              <div>
                <p className="text-white font-bold text-base leading-tight">{points}</p>
                <p className="text-white/40 text-xs">Puntos totales</p>
              </div>
            </div>
            <div className="rounded-xl bg-white/3 border border-white/8 p-3 flex items-center gap-3">
              <AlertTriangle size={18} className="text-yellow-400 shrink-0" />
              <div>
                <p className="text-white font-bold text-base leading-tight">{totalAlerts}</p>
                <p className="text-white/40 text-xs">Avisos creados</p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-white/25 leading-relaxed">
            Gana puntos creando avisos de ruta (+2 pts) y confirmando incidencias de otros (+1 pt).
          </p>
        </section>

        {/* ── Saved routes ── */}
        <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 md:p-6">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Route size={14} className="text-[#f97316]" /> Mis rutas GPX
          </h2>
          <SavedRoutesList />
        </section>

        {/* ── Quick links ── */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/editor-gpx"
            className="inline-flex items-center gap-2 rounded-full bg-[#f97316] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#f97316]/90 transition"
          >
            <Route size={16} />
            Editor GPX
          </Link>
          <Link
            href="/mapa-en-vivo"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/70 hover:text-white hover:border-white/30 transition"
          >
            Mapa en vivo
          </Link>
          <Link
            href="/mi-garaje"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/70 hover:text-white hover:border-white/30 transition"
          >
            Mi Garaje
          </Link>
        </div>

      </div>
    </main>
  );
}
