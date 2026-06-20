"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, LogOut, Gauge } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  NAV_APP_LINKS,
  NAV_LOGIN,
  NAV_PUBLIC_LINKS,
} from "@/lib/site/navigation";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => setUser(data.user));

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    } catch {
      // Supabase env vars not set — auth state stays null
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    window.location.href = "/";
  };

  const appLinkClass =
    "hover:text-[#f97316] transition-colors font-medium text-[#f97316]/90";

  return (
    <header className="fixed top-0 left-0 w-full z-[100] border-b border-white/5 bg-[#050608]/95 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/navride_logo.png"
            alt="NavRide"
            width={36}
            height={36}
            className="rounded-lg"
            priority
          />
          <span className="text-white text-lg md:text-xl font-bold tracking-tight">
            NavRide
          </span>
        </Link>

        {/* Desktop — visible md+ */}
        <nav
          className="hidden md:flex items-center gap-5 lg:gap-6 text-sm text-white/60 flex-wrap justify-end"
          aria-label="Navegación principal"
        >
          {NAV_PUBLIC_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-white transition-colors whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}

          <span className="h-4 w-px bg-white/10 shrink-0" aria-hidden />

          {NAV_APP_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={appLinkClass}>
              {link.label}
            </Link>
          ))}

          {user ? (
            <div className="flex items-center gap-3 ml-1 shrink-0">
              <span className="flex items-center gap-1.5 text-white/40 text-xs max-w-[8rem] truncate">
                <Gauge size={14} className="text-[#f97316] shrink-0" />
                {user.email?.split("@")[0]}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-white/70 hover:text-white hover:border-white/30 transition-colors whitespace-nowrap"
              >
                <LogOut size={14} />
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <Link
              href={NAV_LOGIN.href}
              className="ml-1 rounded-full bg-[#f97316] px-4 py-2 text-white font-medium hover:bg-[#f97316]/90 transition-colors whitespace-nowrap"
            >
              {NAV_LOGIN.label}
            </Link>
          )}
        </nav>

        {/* Hamburguesa — solo móvil (< md) */}
        <button
          type="button"
          className="md:hidden text-white p-2 -mr-2"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="mobile-nav-panel"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Panel móvil — siempre en DOM; visible con block/hidden (no mount/unmount) */}
      <nav
        id="mobile-nav-panel"
        aria-label="Menú móvil"
        className={`md:hidden border-t border-white/10 bg-[#050608] shadow-2xl ${
          open ? "block" : "hidden"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-0 max-h-[min(80vh,calc(100dvh-4rem))] overflow-y-auto">
          {NAV_PUBLIC_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-3.5 text-base text-white/85 hover:text-white border-b border-white/5"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <p className="mt-3 mb-1 text-xs text-white/40 uppercase tracking-widest px-0.5">
            Cuenta y herramientas
          </p>

          {NAV_APP_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-3.5 text-base text-[#f97316] hover:text-[#fb923c] border-b border-white/5 font-medium"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <>
              <p className="py-2 text-xs text-white/40 truncate">
                {user.email}
              </p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void handleSignOut();
                }}
                className="mt-2 flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-3.5 text-white/80 hover:text-white hover:border-white/30"
              >
                <LogOut size={18} />
                Cerrar Sesión
              </button>
            </>
          ) : (
            <Link
              href={NAV_LOGIN.href}
              className="mt-2 text-center rounded-full bg-[#f97316] px-4 py-3.5 text-white font-semibold hover:bg-[#f97316]/90"
              onClick={() => setOpen(false)}
            >
              {NAV_LOGIN.label}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
