"use client";

import { useState, useRef } from "react";
import { Camera, Save, User } from "lucide-react";

interface Props {
  initialUsername: string | null;
  initialAvatarUrl: string | null;
  initialShowUsername: boolean;
}

export default function PerfilEditForm({
  initialUsername,
  initialAvatarUrl,
  initialShowUsername,
}: Props) {
  const [username, setUsername]         = useState(initialUsername ?? "");
  const [avatarUrl, setAvatarUrl]       = useState(initialAvatarUrl ?? "");
  const [showUsername, setShowUsername] = useState(initialShowUsername);
  const [saving, setSaving]             = useState(false);
  const [msg, setMsg]                   = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef                         = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, show_username_on_reports: showUsername }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
      setMsg({ ok: true, text: "Cambios guardados" });
    } catch (e: unknown) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setMsg(null);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/perfil/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir avatar");
      setAvatarUrl(data.avatar_url as string);
      setMsg({ ok: true, text: "Avatar actualizado" });
    } catch (e: unknown) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setSaving(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 md:p-6 flex flex-col gap-5">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest flex items-center gap-2">
        <User size={14} className="text-[#f97316]" /> Editar perfil
      </h2>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#f97316]/15 border border-[#f97316]/30 flex items-center justify-center">
            {avatarUrl
              ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              : <User size={28} className="text-[#f97316]" />
            }
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#f97316] flex items-center justify-center border-2 border-[#0a0a0a] hover:bg-[#f97316]/80 transition-colors"
          >
            <Camera size={10} className="text-white" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <p className="text-white text-sm font-medium">Foto de perfil</p>
          <p className="text-white/40 text-xs mt-0.5">JPG, PNG o WebP · Máx 2 MB</p>
        </div>
      </div>

      {/* Username */}
      <div className="flex flex-col gap-1.5">
        <label className="text-white/50 text-xs font-medium">Nombre de piloto</label>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Tu nombre en la comunidad NavRide"
          maxLength={32}
          className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors"
        />
        <p className="text-white/25 text-[11px]">{username.length}/32 caracteres</p>
      </div>

      {/* Toggle privacidad */}
      <label className="flex items-center justify-between gap-4 cursor-pointer select-none">
        <div>
          <p className="text-white text-sm">Mostrar mi nombre en reportes</p>
          <p className="text-white/40 text-xs mt-0.5">
            Tu nombre de piloto y avatar aparecerán en los avisos que publiques
          </p>
        </div>
        <button
          role="switch"
          aria-checked={showUsername}
          onClick={() => setShowUsername(v => !v)}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
            showUsername ? "bg-[#f97316]" : "bg-white/15"
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
              showUsername ? "left-6" : "left-1"
            }`}
          />
        </button>
      </label>

      {/* Mensaje de estado */}
      {msg && (
        <p className={`text-xs ${msg.ok ? "text-green-400" : "text-red-400"}`}>{msg.text}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 justify-center w-full rounded-full bg-[#f97316] py-2.5 text-white font-semibold text-sm hover:bg-[#f97316]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Save size={14} />
        {saving ? "Guardando…" : "Guardar cambios"}
      </button>
    </section>
  );
}
