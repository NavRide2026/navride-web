import PageLayout from "@/components/layout/page-layout";
import { SectionHeading } from "@/components/site/section-heading";
import { BRAND } from "@/lib/site/constants";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contacto", description: `Contacto y soporte oficial de NavRide — ${BRAND.supportEmail}` };

const contacts = [
  ["Soporte técnico", "Ayuda con la aplicación, rutas GPX y funcionamiento de la cuenta."],
  ["Privacidad y datos", "Consultas sobre privacidad, acceso o eliminación de información."],
  ["Colaboraciones", "Propuestas relacionadas con rutas, comunidades y alianzas."],
] as const;

export default function ContactoPage() {
  return <PageLayout><div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
    <SectionHeading eyebrow="Contacto" title="Contacto NavRide" description="Soporte, privacidad y consultas generales." />
    <div className="grid gap-4 md:grid-cols-3">{contacts.map(([title, copy]) => <article key={title} className="rounded-2xl border border-white/10 bg-[#101114] p-6"><h2 className="font-semibold text-white">{title}</h2><p className="mt-3 text-sm leading-relaxed text-white/60">{copy}</p><a href={`mailto:${BRAND.supportEmail}`} className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-[#FF8500] hover:underline">{BRAND.supportEmail}</a></article>)}</div>
  </div></PageLayout>;
}
