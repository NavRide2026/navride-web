"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function PerfilSignOutButton() {
  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    window.location.href = "/";
  };

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition px-3 py-2 rounded-lg border border-white/10"
    >
      <LogOut size={14} />
      Salir
    </button>
  );
}
