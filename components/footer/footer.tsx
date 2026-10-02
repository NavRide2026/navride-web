import Link from "next/link";
import { BrandLockup } from "@/components/site/brand-lockup";
import { BRAND } from "@/lib/site/constants";

const exploreLinks = [
  ["/producto", "Producto"],
  ["/funciones", "Funciones"],
  ["/planes", "Planes"],
  ["/roadmap", "Evolución"],
  ["/blog", "Blog"],
  ["/novedades", "Novedades"],
] as const;

const toolLinks = [
  ["/editor-gpx", "Editor de rutas"],
  ["/mis-rutas", "Mis rutas"],
  ["/mi-garaje", "Mi garaje"],
  ["/perfil", "Perfil"],
] as const;

const supportLinks = [
  ["/legal", "Centro legal"],
  ["/legal/politica-privacidad", "Privacidad"],
  ["/legal/licenses.html", "Licencias y atribuciones"],
  ["/soporte", "Soporte"],
  ["/contacto", "Contacto"],
] as const;

const linkClass = "inline-flex min-h-10 items-center text-sm text-white/55 transition hover:text-[#FF9D2E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8BEA00]";

function LinkGroup({ title, links }: { title: string; links: readonly (readonly [string, string])[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">{title}</h2>
      <ul className="space-y-0.5">{links.map(([href, label]) => <li key={href}><Link href={href} target={href === "/editor-gpx" ? "_blank" : undefined} rel={href === "/editor-gpx" ? "noopener noreferrer" : undefined} className={linkClass}>{label}</Link></li>)}</ul>
    </nav>
  );
}

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-[#0d0f12] md:mt-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:grid-cols-2 md:px-8 lg:grid-cols-[1.35fr_1fr_1fr_1fr] lg:py-14">
        <section className="sm:col-span-2 lg:col-span-1">
          <BrandLockup size="md" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">Navegación off-road orientada a rutas GPX para moto, trail y aventura.</p>
          <p className="mt-3 text-xs text-white/35">Beta {BRAND.version}</p>
        </section>
        <LinkGroup title="Explorar" links={exploreLinks} />
        <LinkGroup title="Herramientas" links={toolLinks} />
        <LinkGroup title="Legal y ayuda" links={supportLinks} />
      </div>

      <div className="border-t border-white/5 px-4 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center text-xs text-white/40 sm:flex-row sm:text-left">
          <span>© {new Date().getFullYear()} {BRAND.holderName}</span>
          <Link href="/legal/licenses.html" className="underline underline-offset-4 hover:text-white/70">Atribuciones cartográficas</Link>
        </div>
      </div>
    </footer>
  );
}
