"use client";

import Link from "next/link";
import {
  NAV_APP_LINKS,
  NAV_LOGIN,
  NAV_PUBLIC_LINKS,
} from "@/lib/site/navigation";

/** Enlaces estáticos SSR — visibles en HTML antes de hidratar (SEO + fallback). */
export function NavbarDesktopLinks() {
  return (
    <>
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
        <Link
          key={link.href}
          href={link.href}
          className="hover:text-[#f97316] transition-colors font-medium text-[#f97316]/90 whitespace-nowrap"
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}

export function NavbarMobileLinks({
  onNavigate,
  loggedIn = false,
}: {
  onNavigate?: () => void;
  loggedIn?: boolean;
}) {
  return (
    <>
      {NAV_PUBLIC_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="py-3.5 text-base text-white/85 hover:text-white border-b border-white/5"
          onClick={onNavigate}
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
          onClick={onNavigate}
        >
          {link.label}
        </Link>
      ))}
      {!loggedIn ? (
        <Link
          href={NAV_LOGIN.href}
          className="mt-2 text-center rounded-full bg-[#f97316] px-4 py-3.5 text-white font-semibold hover:bg-[#f97316]/90"
          onClick={onNavigate}
        >
          {NAV_LOGIN.label}
        </Link>
      ) : null}
    </>
  );
}
