"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PoliciaLoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });

    if (authErr) {
      setError("Credenciales incorrectas.");
      setLoading(false);
      return;
    }

    // Verificar rol
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Error de autenticación."); setLoading(false); return; }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role as string | undefined;
    if (role !== "police" && role !== "admin") {
      await supabase.auth.signOut();
      setError("Acceso denegado. Este portal es exclusivo para autoridades.");
      setLoading(false);
      return;
    }

    router.push("/panel-policial");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#050608" }}
    >
      <div className="w-full max-w-sm px-6">
        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 rounded-full bg-[#1a2a4a] border border-[#2a4a8a]/60 flex items-center justify-center mb-4 shadow-xl">
            <span className="text-2xl">🛡</span>
          </div>
          <h1 className="text-white font-bold text-xl tracking-tight">NavRide</h1>
          <span className="mt-2 text-[11px] font-bold tracking-widest text-[#93c5fd] bg-[#1a2a4a] border border-[#2a4a8a]/50 px-3 py-1 rounded-full">
            PANEL MOSSOS D'ESQUADRA
          </span>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-white/50 text-xs mb-1.5 font-medium">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agente@mossos.cat"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#3b82f6]/60 transition-colors"
            />
          </div>
          <div>
            <label className="block text-white/50 text-xs mb-1.5 font-medium">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#3b82f6]/60 transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#1e3a6e] hover:bg-[#2a4a8a] border border-[#3b82f6]/30 py-3 text-white font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Verificando…" : "Acceder al panel"}
          </button>
        </form>

        <p className="text-white/20 text-[10px] text-center mt-8">
          Acceso restringido. Solo personal autorizado.
        </p>
      </div>
    </div>
  );
}
