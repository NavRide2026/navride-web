import Navbar from "@/components/navbar/navbar";
import Footer from "@/components/footer/footer";

export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#050608] text-white overflow-hidden">
      <Navbar />

      <div className="pt-24">
        {children}
      </div>

      <Footer />
    </main>
  );
}
