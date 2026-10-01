import Hero from "@/components/hero/hero";
import Features from "@/components/features/features";
import PageLayout from "@/components/layout/page-layout";
import { BRAND } from "@/lib/site/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inicio",
  description: `${BRAND.taglineEs}. Planifica, importa y sigue rutas GPX desde NavRide.`,
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <PageLayout>
      <Hero />
      <Features />
    </PageLayout>
  );
}
