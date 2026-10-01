export default function EditorLoading() {
  return (
    <main className="fixed inset-0 z-50 grid place-items-center bg-[#050608] text-white">
      <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-[#FF8500]" />
        <p className="text-sm text-white/75">Cargando el editor de rutas…</p>
      </div>
    </main>
  );
}
