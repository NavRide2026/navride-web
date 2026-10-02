"use client";

import { useState } from "react";
import { Check, Link as LinkIcon } from "lucide-react";

export function ShareBar({ title: _title }: { title: string }) {
  void _title;
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={copyToClipboard}
        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 hover:border-white/20 hover:text-white transition"
        title="Copiar enlace"
      >
        {copied ? (
          <>
            <Check size={14} className="text-[#8BEA00]" />
            <span className="text-[#8BEA00]">¡Enlace copiado!</span>
          </>
        ) : (
          <>
            <LinkIcon size={14} />
            <span>Compartir</span>
          </>
        )}
      </button>
    </div>
  );
}
