"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, Gauge, LogOut, Menu, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { BrandLockup } from "@/components/site/brand-lockup";
import { isNavRideAppEmbed } from "@/lib/route-studio/navride-editor-bridge";
import { NAV_APP_LINKS, NAV_PUBLIC_LINKS } from "@/lib/site/navigation";

const mainLinks = NAV_PUBLIC_LINKS.filter((link) => link.href !== "/contacto");
const toolLinks = [
  ...NAV_APP_LINKS,
  { href: "/contacto", label: "Contacto" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const [closedOnPath, setClosedOnPath] = useState(pathname);
  const searchParams = useSearchParams();
  const hideForAppEmbed = pathname.startsWith("/editor-gpx") && isNavRideAppEmbed(searchParams.get("embed"));

  if (closedOnPath !== pathname) {
    setClosedOnPath(pathname);
    setMenuOpen(false);
    setToolsOpen(false);
  }

  useEffect(() => {
    if (hideForAppEmbed) return;
    let unsubscribe: (() => void) | undefined;
    import("@/lib/supabase/client").then(({ createClient, isSupabaseConfigured }) => {
      if (!isSupabaseConfigured) return;
      const supabase = createClient();
      void supabase.auth.getUser().then(({ data }) => setUser(data.user)).catch(() => setUser(null));
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
      unsubscribe = () => subscription.unsubscribe();
    }).catch(() => setUser(null));
    return () => unsubscribe?.();
  }, [hideForAppEmbed]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setToolsOpen(false);
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);

  if (hideForAppEmbed) return null;

  const signOut = async () => {
    try {
      const { createClient, isSupabaseConfigured } = await import("@/lib/supabase/client");
      if (isSupabaseConfigured) await createClient().auth.signOut();
    } catch { /* cierre local */ }
    setUser(null);
    window.location.href = "/";
  };

  const desktopLink = (active: boolean) =>
    `inline-flex min-h-10 items-center rounded-full px-3 text-sm font-medium transition ${
      active
        ? "bg-[#FF8500]/15 text-[#FF9D2E] ring-1 ring-[#FF8500]/35"
        : "text-white/65 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <header className="fixed inset-x-0 top-0 z-[100] border-b border-white/10 bg-[#111318]/96 shadow-[0_8px_32px_rgba(0,0,0,.35)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:h-20 md:px-8">
        <Link href="/" className="inline-flex min-h-11 shrink-0 items-center rounded-xl px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8BEA00]" aria-label="NavRide, inicio">
          <BrandLockup size="sm" />
        </Link>

        <nav className="ml-auto hidden items-center gap-1 xl:flex" aria-label="Secciones principales">
          {mainLinks.map((link) => (
            <Link key={link.href} href={link.href} className={desktopLink(isActive(pathname, link.href))}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="relative hidden xl:block">
          <button
            type="button"
            onClick={() => setToolsOpen((value) => !value)}
            className={`${desktopLink(toolLinks.some((link) => isActive(pathname, link.href)))} gap-1.5`}
            aria-expanded={toolsOpen}
            aria-haspopup="menu"
          >
            Herramientas <ChevronDown size={15} className={`transition ${toolsOpen ? "rotate-180" : ""}`} />
          </button>
          {toolsOpen && (
            <div className="absolute right-0 top-[calc(100%+12px)] w-64 rounded-2xl border border-white/10 bg-[#171A1F] p-2 shadow-2xl" role="menu">
              <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-widest text-white/35">Cuenta y navegación</p>
              {toolLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  target={link.href === "/editor-gpx" ? "_blank" : undefined}
                  rel={link.href === "/editor-gpx" ? "noopener noreferrer" : undefined}
                  role="menuitem"
                  className={`flex min-h-11 items-center rounded-xl px-3 text-sm transition ${isActive(pathname, link.href) ? "bg-[#FF8500]/15 text-[#FF9D2E]" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="hidden xl:block">
          {user ? (
            <button type="button" onClick={() => void signOut()} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-sm text-white/75 hover:border-white/30 hover:bg-white/5 hover:text-white">
              <LogOut size={15} /> Cerrar sesión
            </button>
          ) : (
            <Link href="/login" className="inline-flex min-h-11 items-center rounded-full bg-[#FF8500] px-5 text-sm font-semibold text-[#080808] hover:bg-[#ff9d2e]">Iniciar sesión</Link>
          )}
        </div>

        <button type="button" onClick={() => setMenuOpen((value) => !value)} className="ml-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white xl:hidden" aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}>
          {menuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </div>

      {menuOpen && (
        <nav id="mobile-navigation" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-white/10 bg-[#111318] px-4 py-4 xl:hidden" aria-label="Menú móvil y tableta">
          <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
            <section>
              <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-white/40">Explorar</h2>
              {mainLinks.map((link) => <Link key={link.href} href={link.href} className={`flex min-h-12 items-center rounded-xl px-3 ${isActive(pathname, link.href) ? "bg-[#FF8500]/15 text-[#FF9D2E]" : "text-white/75"}`}>{link.label}</Link>)}
            </section>
            <section>
              <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-white/40">Herramientas</h2>
              {toolLinks.map((link) => <Link key={link.href} href={link.href} target={link.href === "/editor-gpx" ? "_blank" : undefined} rel={link.href === "/editor-gpx" ? "noopener noreferrer" : undefined} className={`flex min-h-12 items-center rounded-xl px-3 ${isActive(pathname, link.href) ? "bg-[#FF8500]/15 text-[#FF9D2E]" : "text-white/75"}`}>{link.label}</Link>)}
              {user ? <button type="button" onClick={() => void signOut()} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-white/15 text-white/80"><Gauge size={16} />Cerrar sesión</button> : <Link href="/login" className="mt-3 flex min-h-12 items-center justify-center rounded-full bg-[#FF8500] font-semibold text-[#080808]">Iniciar sesión</Link>}
            </section>
          </div>
        </nav>
      )}
      <div className="h-px bg-gradient-to-r from-transparent via-[#FF8500]/70 to-transparent" />
    </header>
  );
}
