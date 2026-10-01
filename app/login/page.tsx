"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { BrandLockup } from "@/components/site/brand-lockup";
import { ImmersiveBackdrop } from "@/components/site/immersive-backdrop";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type Mode = "login" | "register";

const fieldClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-white focus:border-[#FF8500]/70 focus:outline-none";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="text-xs uppercase tracking-widest text-white/50">
      {label}
      {children}
    </label>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  visible,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <Field label={label}>
      <div className="relative mt-2">
        <input
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/45 px-4 py-3 pr-12 text-white focus:border-[#FF8500]/70 focus:outline-none"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 grid min-h-10 min-w-10 -translate-y-1/2 place-items-center text-white/40"
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </Field>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setSuccess(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === "register") {
      const name = firstName.trim();
      const user = username.trim();
      if (!name || !user) {
        setError("Indica tu nombre y tu nombre de usuario.");
        return;
      }
      if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
        setError("Los correos electrónicos no coinciden.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }
    }

    if (!isSupabaseConfigured) {
      setError("El acceso a cuentas no está configurado en este entorno local.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) setError("Correo electrónico o contraseña incorrectos.");
        else window.location.href = "/mi-garaje";
      } else {
        const name = firstName.trim();
        const user = username.trim();
        const { error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              first_name: name,
              username: user,
              display_name: user,
            },
          },
        });
        if (err) {
          setError(
            err.message.toLowerCase().includes("already registered")
              ? "Este correo ya está registrado."
              : "No se pudo crear la cuenta.",
          );
        } else {
          setSuccess("Cuenta creada. Revisa tu correo para confirmar la dirección.");
        }
      }
    } catch {
      setError("No se pudo conectar con el servicio de cuentas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-y-auto bg-[#050608] px-4 py-28">
      <ImmersiveBackdrop />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4">
          <BrandLockup size="lg" showIcon={false} className="scale-75 sm:scale-90" />
          <p className="text-sm uppercase tracking-[.2em] text-[#8BEA00]">
            Tu próxima ruta empieza aquí
          </p>
          <p className="text-sm text-white/45">
            {mode === "login" ? "Accede a tu cuenta" : "Crea tu cuenta"}
          </p>
        </div>
        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-2xl border border-amber-500/25 bg-[#211607]/90 px-5 py-4 text-sm leading-relaxed text-amber-200 backdrop-blur-xl">
            Las cuentas no están conectadas en esta instalación local. Puedes continuar explorando la web y el editor GPX.
          </div>
        )}
        <div className="rounded-3xl border border-white/10 bg-[#101318]/88 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {mode === "register" && (
              <>
                <Field label="Nombre">
                  <input
                    type="text"
                    autoComplete="given-name"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={fieldClass}
                  />
                </Field>
                <Field label="Nombre de usuario">
                  <input
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={fieldClass}
                  />
                </Field>
              </>
            )}
            <Field label="Correo electrónico">
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
              />
            </Field>
            {mode === "register" && (
              <Field label="Confirmar correo electrónico">
                <input
                  type="email"
                  autoComplete="off"
                  required
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  className={fieldClass}
                />
              </Field>
            )}
            <PasswordField
              label="Contraseña"
              value={password}
              onChange={setPassword}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              visible={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
            {mode === "register" && (
              <PasswordField
                label="Confirmar contraseña"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((v) => !v)}
              />
            )}
            {error && (
              <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </p>
            )}
            {success && (
              <p role="status" className="rounded-xl border border-[#8BEA00]/20 bg-[#8BEA00]/10 p-3 text-sm text-[#b8ff69]">
                {success}
              </p>
            )}
            <button
              disabled={loading || !isSupabaseConfigured}
              className="min-h-12 rounded-full bg-[#FF8500] font-semibold text-[#080808] hover:bg-[#ff9d2e] disabled:opacity-45"
            >
              {loading ? "Cargando…" : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-white/45">
          {mode === "login" ? (
            <>
              ¿No tienes cuenta?{" "}
              <button type="button" onClick={() => switchMode("register")} className="text-[#FF8500]">
                Crear cuenta
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{" "}
              <button type="button" onClick={() => switchMode("login")} className="text-[#FF8500]">
                Iniciar sesión
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
