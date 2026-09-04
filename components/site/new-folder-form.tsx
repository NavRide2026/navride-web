"use client";

import { useState } from "react";

/** Alta de carpeta con nombre libre — el usuario elige cómo llamarla. */
export function NewFolderForm({
  onCreate,
  label = "+ Nueva carpeta",
  placeholder = "Nombre de la carpeta",
  disabled = false,
}: {
  onCreate: (name: string) => Promise<unknown>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    await onCreate(trimmed);
    setBusy(false);
    setName("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="rounded-full border border-dashed border-zinc-600 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-orange-500/60 hover:text-orange-300 disabled:opacity-40"
      >
        {label}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={placeholder}
        maxLength={80}
        className="w-44 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-orange-500"
      />
      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="rounded-full bg-orange-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
      >
        Crear
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setName("");
        }}
        className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400"
      >
        Cancelar
      </button>
    </form>
  );
}
