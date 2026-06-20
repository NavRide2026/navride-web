"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, LogOut, Gauge } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const PUBLIC_LINKS = [
  { href: "/producto", label: "Producto" },
  { href: "/planes", label: "Planes" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/noticias", label: "Noticias" },
  { href: "/contacto", label: "Contacto" },
];

const APP_LINKS = [
  { href: "/editor-gpx", label: "Editor GPX" },
  { href: "/mi-garaje", label: "Mi Garaje" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 border-b border-white/5 bg-[#050608]/90 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/navride_logo.png"
            alt="NavRide"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="text-white text-lg md:text-xl font-bold tracking-tight">
            NavRide
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-6 text-sm text-white/60">
          {PUBLIC_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {/* Separator */}
          <span className="h-4 w-px bg-white/10" />

          {APP_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-[#f97316] transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <div className="flex items-center gap-3 ml-2">
              <span className="flex items-center gap-1.5 text-white/40 text-xs">
                <Gauge size={14} className="text-[#f97316]" />
                {user.email?.split("@")[0]}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-white/60 hover:text-white hover:border-white/30 transition-colors"
              >
                <LogOut size={14} />
                Salir
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-2 rounded-full bg-[#f97316] px-4 py-2 text-white font-medium hover:bg-[#f97316]/90 transition-colors"
            >
              Entrar
            </Link>
          )}
        </nav>

        <button
          type="button"
          className="lg:hidden text-white p-2"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile nav */}
      {open ? (
        <nav className="lg:hidden border-t border-white/5 bg-[#050608] px-4 py-4 flex flex-col gap-1">
          {PUBLIC_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-3 text-white/80 hover:text-white border-b border-white/5"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className="mt-2 mb-1 text-xs text-white/30 uppercase tracking-widest px-1">
            App
          </div>

          {APP_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-3 text-[#f97316]/80 hover:text-[#f97316] border-b border-white/5"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <button
              onClick={() => {
                setOpen(false);
                handleSignOut();
              }}
              className="mt-3 text-center rounded-full border border-white/10 px-4 py-3 text-white/60"
            >
              Cerrar sesión ({user.email?.split("@")[0]})
            </button>
          ) : (
            <Link
              href="/login"
              className="mt-3 text-center rounded-full bg-[#f97316] px-4 py-3 text-white font-medium"
              onClick={() => setOpen(false)}
            >
              Entrar
            </Link>
          )}
        </nav>
      ) : null}
    </header>
  );
}
