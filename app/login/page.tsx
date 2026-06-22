"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "register";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) {
          setError("Email o contraseña incorrectos.");
        } else {
          // Hard redirect: fuerza al browser a hacer una petición nueva al servidor
          // con las cookies de sesión ya escritas por Supabase. router.push() + refresh()
          // causaba que la página quedara congelada porque el servidor aún no veía la sesión.
          window.location.href = "/mi-garaje";
        }
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
        });
        if (err) {
          if (err.message.includes("already registered")) {
            setError("Este email ya está registrado. Inicia sesión.");
          } else {
            setError(err.message);
          }
        } else {
          setSuccess(
            "Cuenta creada. Revisa tu email para confirmar tu dirección."
          );
        }
      }
    } catch {
      setError("Error de conexión con el servidor. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#050608]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <Image
            src="/navride_logo.png"
            alt="NavRide"
            width={56}
            height={56}
            className="rounded-2xl"
          />
          <h1 className="text-2xl font-bold text-white tracking-tight">
            NavRide
          </h1>
          <p className="text-white/40 text-sm">
            {mode === "login" ? "Accede a tu cuenta" : "Crea tu cuenta"}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-xs text-white/50 uppercase tracking-widest"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#f97316]/60 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-xs text-white/50 uppercase tracking-widest"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 pr-11 text-white placeholder:text-white/20 focus:outline-none focus:border-[#f97316]/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-400 text-sm">
                {error}
              </p>
            )}

            {success && (
              <p className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-green-400 text-sm">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-full bg-[#f97316] px-4 py-3 text-white font-semibold hover:bg-[#f97316]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? "Cargando…"
                : mode === "login"
                  ? "Iniciar sesión"
                  : "Crear cuenta"}
            </button>
          </form>
        </div>

        {/* Toggle */}
        <p className="text-center text-sm text-white/40 mt-5">
          {mode === "login" ? (
            <>
              ¿No tienes cuenta?{" "}
              <button
                onClick={() => {
                  setMode("register");
                  setError(null);
                  setSuccess(null);
                }}
                className="text-[#f97316] hover:underline"
              >
                Crear cuenta
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{" "}
              <button
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setSuccess(null);
                }}
                className="text-[#f97316] hover:underline"
              >
                Iniciar sesión
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
