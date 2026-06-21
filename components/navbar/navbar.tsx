"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, LogOut, Gauge } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const PUBLIC_LINKS = [
  { href: "/producto", label: "Producto" },
  { href: "/planes", label: "Planes" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/noticias", label: "Noticias" },
  { href: "/contacto", label: "Contacto" },
];

const APP_LINKS = [
  { href: "/mi-garaje", label: "Mi Garaje" },
  { href: "/editor-gpx", label: "Editor GPX" },
  { href: "/mapa-en-vivo", label: "Mapa en tiempo real" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    import("@/lib/supabase/client")
      .then(({ createClient }) => {
        try {
          const supabase = createClient();
          supabase.auth.getUser().then(({ data }) => setUser(data.user));
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
          });
          unsub = () => subscription.unsubscribe();
        } catch {
          // env vars missing
        }
      })
      .catch(() => {});
    return () => {
      unsub?.();
    };
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
      const { createClient } = await import("@/lib/supabase/client");
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
          {PUBLIC_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-white transition-colors whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}

          <span className="h-4 w-px bg-white/10 shrink-0" aria-hidden />

          {APP_LINKS.map((link) => (
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
              href="/login"
              className="ml-1 rounded-full bg-[#f97316] px-4 py-2 text-white font-medium hover:bg-[#f97316]/90 transition-colors whitespace-nowrap"
            >
              Iniciar Sesión
            </Link>
          )}
        </nav>

        {/* Hamburger — solo móvil */}
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

      {/* Panel móvil */}
      <nav
        id="mobile-nav-panel"
        aria-label="Menú móvil"
        className={`md:hidden border-t border-white/10 bg-[#050608] shadow-2xl ${
          open ? "block" : "hidden"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-0 max-h-[80vh] overflow-y-auto">
          {PUBLIC_LINKS.map((link) => (
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

          {APP_LINKS.map((link) => (
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
              <p className="py-2 text-xs text-white/40 truncate">{user.email}</p>
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
              href="/login"
              className="mt-2 text-center rounded-full bg-[#f97316] px-4 py-3.5 text-white font-semibold hover:bg-[#f97316]/90"
              onClick={() => setOpen(false)}
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
