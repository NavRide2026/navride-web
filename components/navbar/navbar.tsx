export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 border-b border-white/5 bg-black/60 backdrop-blur-2xl">
      
      <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">

        <div className="text-white text-2xl font-bold tracking-tight">
          NAVRIDE
        </div>

        <div className="flex items-center gap-10 text-zinc-400">

          <a href="/roadmap" className="hover:text-white transition">
            Roadmap
          </a>

          <a href="/news" className="hover:text-white transition">
            News
          </a>

          <a href="/tutorials" className="hover:text-white transition">
            Tutorials
          </a>

          <a href="/legal" className="hover:text-white transition">
            Legal
          </a>

        </div>
      </div>
    </nav>
  );
}
