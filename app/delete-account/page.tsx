"use client";

import { useState } from "react";
import Link from "next/link";
import PageLayout from "@/components/layout/page-layout";
import { BRAND } from "@/lib/site/constants";
import { createClient } from "@/lib/supabase/client";

/**
 * Ruta externa Google Play Account Deletion.
 * Misma cuenta Supabase que la app. Sin service_role en cliente.
 */
export default function DeleteAccountPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setOk(false);
    if (!email.trim() || !password) {
      setMsg("Completa email y contraseña.");
      return;
    }
    if (!confirm) {
      setMsg("Marca la casilla de confirmación.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    try {
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signErr) {
        setMsg("Credenciales incorrectas.");
        return;
      }
      const { data, error } = await supabase.functions.invoke("delete-account", {
        method: "POST",
      });
      if (error) {
        setMsg(
          `No se pudo completar el borrado técnico (${error.message}). ` +
            `Si la función aún no está desplegada, escribe a ${BRAND.supportEmail} ` +
            `desde el email de la cuenta indicando «Eliminar cuenta NavRide».`,
        );
        try {
          await supabase.auth.signOut();
        } catch {
          /* ignore */
        }
        return;
      }
      if (data && typeof data === "object" && "error" in data && data.error) {
        setMsg(String(data.error));
        try {
          await supabase.auth.signOut();
        } catch {
          /* ignore */
        }
        return;
      }
      try {
        await supabase.auth.signOut();
      } catch {
        /* ignore */
      }
      setOk(true);
      setMsg(
        "Cuenta eliminada. Ya no podrás iniciar sesión con estas credenciales.",
      );
      setPassword("");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
      try {
        await supabase.auth.signOut();
      } catch {
        /* ignore */
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout>
      <article className="max-w-xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <Link
          href="/legal"
          className="inline-block mb-8 text-sm text-white/50 hover:text-white transition"
        >
          ← Centro legal
        </Link>
        <p className="text-[#FF5A1F] text-sm font-semibold tracking-widest uppercase mb-3">
          Google Play · Account deletion
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Eliminar cuenta NavRide
        </h1>
        <p className="text-white/60 text-sm mb-8">
          Ruta externa exigida por Google Play User Data. Misma cuenta que la app
          (Supabase Auth). Accesible sin instalar la app.
        </p>

        <div className="rounded-xl border border-white/10 bg-[#121214] p-5 mb-6 text-sm text-white/70 space-y-2">
          <p className="text-white font-medium">Qué se elimina</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Cuenta de autenticación (email/contraseña)</li>
            <li>Perfil (<code>user_profiles</code>)</li>
            <li>
              GPX / rutas cloud (<code>gpx_tracks</code>, <code>gpx_routes</code>
              , Storage <code>gpx/</code>)
            </li>
            <li>Votos de alertas; alertas propias desactivadas/desvinculadas</li>
          </ul>
          <p>
            La navegación local sin cuenta no se ve afectada. GPX solo-local en
            el dispositivo no se borra desde esta página.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm text-white/50">
            Email de la cuenta
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-white"
              required
            />
          </label>
          <label className="block text-sm text-white/50">
            Contraseña (reautenticación)
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-white"
              required
            />
          </label>
          <label className="flex items-start gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
              className="mt-1"
            />
            Confirmo que quiero eliminar permanentemente mi cuenta y datos
            asociados.
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#e05252] py-3 font-bold text-white disabled:opacity-50"
          >
            {loading ? "Procesando…" : "Eliminar mi cuenta"}
          </button>
        </form>

        {msg && (
          <p
            className={`mt-4 text-sm ${ok ? "text-emerald-400" : "text-[#e05252]"}`}
          >
            {msg}
          </p>
        )}

        <p className="mt-8 text-sm text-white/50">
          Alternativa por email:{" "}
          <a
            href={`mailto:${BRAND.supportEmail}?subject=Eliminar%20cuenta%20NavRide`}
            className="text-[#FF5A1F] hover:underline"
          >
            {BRAND.supportEmail}
          </a>
          . Más detalle:{" "}
          <Link
            href="/legal/data-deletion.html"
            className="text-[#FF5A1F] hover:underline"
          >
            política de eliminación
          </Link>
          .
        </p>
      </article>
    </PageLayout>
  );
}
