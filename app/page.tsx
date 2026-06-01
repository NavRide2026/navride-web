import Hero from "@/components/hero/hero";
import Features from "@/components/features/features";
import PageLayout from "@/components/layout/page-layout";

export default function Home() {
  return (
    <PageLayout>
      <Hero />
      <Features />
    </PageLayout>
  );
}
