"use client";

export default function EditorError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="fixed inset-0 z-50 grid place-items-center bg-[#050608] p-6 text-white">
      <section className="w-full max-w-md rounded-2xl border border-red-400/25 bg-[#111318] p-6 text-center shadow-2xl">
        <h1 className="text-xl font-bold">No se pudo abrir el editor</h1>
        <p className="mt-3 text-sm text-white/70">La ruta permanece segura. Comprueba la conexión e inténtalo de nuevo.</p>
        <button type="button" onClick={reset} className="mt-5 min-h-11 rounded-full bg-[#FF8500] px-5 py-2 font-semibold text-white hover:bg-[#e97700] focus:outline-none focus:ring-2 focus:ring-[#8BEA00]">
          Reintentar
        </button>
      </section>
    </main>
  );
}
