import Footer from "@/components/footer/footer";
import { ImmersiveBackdrop } from "@/components/site/immersive-backdrop";

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="site-page-enter relative isolate flex min-h-dvh min-w-0 flex-col overflow-x-clip bg-[#050608] text-white">
      <ImmersiveBackdrop />
      <div className="site-page-content min-w-0 flex-1 pt-20 md:pt-24">{children}</div>
      <div className="relative z-10"><Footer /></div>
    </main>
  );
}
