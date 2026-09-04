"use client";

import { useState } from "react";
import SkinHubClient from "@/app/garage/SkinHubClient";
import DiscoverPanel from "./DiscoverPanel";
import LibraryPanel from "./LibraryPanel";
import { useDesignLibrary } from "./useDesignLibrary";

type TabId = "discover" | "library" | "themes";

const TABS: { id: TabId; label: string }[] = [
  { id: "discover", label: "Descubrir" },
  { id: "library", label: "Mi biblioteca" },
  { id: "themes", label: "Temas NavRide" },
];

export default function DesignStudioClient() {
  const [tab, setTab] = useState<TabId>("discover");
  const library = useDesignLibrary();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pt-24 text-zinc-100">
      <header className="mb-8">
        <p className="text-xs tracking-[0.2em] text-orange-400 uppercase">
          NavRide Skin Hub
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Diseño y personalización
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Busca iconos en fuentes oficiales, organízalos en tus propias carpetas
          y llévalos a la app. Solo catálogo real: nada inventado.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Secciones de diseño"
        className="mb-6 flex gap-1 border-b border-zinc-800"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm transition ${
              tab === t.id
                ? "border-orange-500 text-orange-300"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t.label}
            {t.id === "library" && library.items.length > 0 && (
              <span className="ml-1.5 text-xs text-zinc-500">
                {library.items.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "discover" && <DiscoverPanel library={library} />}
      {tab === "library" && <LibraryPanel library={library} />}
      {tab === "themes" && <SkinHubClient hideHeader />}
    </div>
  );
}
