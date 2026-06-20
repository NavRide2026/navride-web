import Link from "next/link";
import { BRAND, LEGAL_DOCS } from "@/lib/site/constants";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#050608] mt-20">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 grid gap-10 md:grid-cols-3">
        <div>
          <p className="text-white font-bold text-lg mb-2">{BRAND.name}</p>
          <p className="text-white/50 text-sm leading-relaxed">
            {BRAND.taglineEs}. Beta {BRAND.version}.
          </p>
        </div>

        <div>
          <p className="text-white/80 font-semibold text-sm mb-3 uppercase tracking-wider">
            Producto
          </p>
          <ul className="space-y-2 text-sm text-white/50">
            <li>
              <Link href="/producto" className="hover:text-white transition">
                Qué es NavRide
              </Link>
            </li>
            <li>
              <Link href="/planes" className="hover:text-white transition">
                Planes
              </Link>
            </li>
            <li>
              <Link href="/roadmap" className="hover:text-white transition">
                Roadmap
              </Link>
            </li>
            <li>
              <Link href="/noticias" className="hover:text-white transition">
                Noticias
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-white/80 font-semibold text-sm mb-3 uppercase tracking-wider">
            Legal y soporte
          </p>
          <ul className="space-y-2 text-sm text-white/50">
            <li>
              <Link href="/legal" className="hover:text-white transition">
                Centro legal
              </Link>
            </li>
            <li>
              <Link
                href="/legal/politica-privacidad"
                className="hover:text-white transition"
              >
                Política de privacidad
              </Link>
            </li>
            <li>
              <Link href="/contacto" className="hover:text-white transition">
                Contacto
              </Link>
            </li>
            <li>
              <Link href="/soporte" className="hover:text-white transition">
                Soporte
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5 py-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} {BRAND.holderName}. {LEGAL_DOCS.length}{" "}
        documentos legales ·{" "}
        <Link href="/legal/licenses.html" className="hover:text-white/60">
          Atribuciones
        </Link>
      </div>
    </footer>
  );
}
