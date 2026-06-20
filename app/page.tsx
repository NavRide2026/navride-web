import Hero from "@/components/hero/hero";
import Features from "@/components/features/features";
import PageLayout from "@/components/layout/page-layout";
import { BRAND } from "@/lib/site/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inicio",
  description: `${BRAND.taglineEs}. Beta ${BRAND.version}. Trial 7 días. Suscripción NavRide Adventure vía Google Play.`,
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
