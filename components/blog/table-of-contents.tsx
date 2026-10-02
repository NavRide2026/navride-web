"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Bookmark } from "lucide-react";

export interface TocItem {
  id: string;
  heading: string;
}

interface TableOfContentsProps {
  items: TocItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id || "");
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-90px 0px -65% 0px",
        threshold: 0,
      }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  const handleScrollTo = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.scrollY - 85;
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
      setActiveId(id);
      setIsOpenMobile(false);
      window.history.pushState(null, "", `#${id}`);
    }
  };

  const activeItem = items.find((i) => i.id === activeId) || items[0];

  return (
    <>
      {/* Mobile / Tablet Compact Index Bar */}
      <div className="lg:hidden mb-8 rounded-2xl border border-white/10 bg-[#101216] p-4 shadow-lg">
        <button
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          className="flex w-full items-center justify-between text-left text-xs font-semibold text-white/90"
        >
          <div className="flex items-center gap-2 overflow-hidden pr-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#FF8500]/20 text-[10px] font-bold text-[#FF8500]">
              <Bookmark size={11} />
            </span>
            <span className="text-white/40 uppercase tracking-wider text-[10px]">
              Índice:
            </span>
            <span className="truncate text-[#FF9D2E]">
              {activeItem?.heading.replace(/^\d+\.\s*/, "")}
            </span>
          </div>
          <span className="flex items-center gap-1 shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70">
            <span>{isOpenMobile ? "Cerrar" : "Ver todo"}</span>
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${isOpenMobile ? "rotate-180" : ""}`}
            />
          </span>
        </button>

        {isOpenMobile && (
          <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5 animate-in fade-in duration-200">
            {items.map((item, idx) => {
              const isActive = activeId === item.id;
              const num = (idx + 1).toString().padStart(2, "0");

              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => handleScrollTo(item.id, e)}
                  className={`flex items-center justify-between rounded-xl p-2.5 text-xs transition ${
                    isActive
                      ? "bg-[#FF8500]/15 text-[#FF9D2E] font-semibold"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="font-mono text-[10px] text-white/30">{num}</span>
                    <span className="truncate">{item.heading.replace(/^\d+\.\s*/, "")}</span>
                  </span>
                  <ChevronRight size={13} className="shrink-0 text-white/30" />
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Sticky Sidebar Index */}
      <nav
        aria-label="Índice de la guía"
        className="sticky top-24 hidden lg:block rounded-2xl border border-white/10 bg-[#0d0f12]/95 p-5 backdrop-blur-md shadow-xl"
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#FF8500] animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Índice del Artículo
            </h3>
          </div>
          <span className="text-[10px] text-white/40 font-mono">
            {items.length} secciones
          </span>
        </div>

        <ul className="space-y-1.5 text-xs">
          {items.map((item, idx) => {
            const isActive = activeId === item.id;
            const num = (idx + 1).toString().padStart(2, "0");

            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleScrollTo(item.id, e)}
                  className={`group flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-all duration-200 ${
                    isActive
                      ? "bg-[#FF8500]/15 text-[#FF9D2E] font-semibold border-l-2 border-[#FF8500]"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] shrink-0 pt-0.5 ${
                      isActive ? "text-[#FF8500] font-bold" : "text-white/30"
                    }`}
                  >
                    {num}
                  </span>
                  <span className="leading-snug line-clamp-2">
                    {item.heading.replace(/^\d+\.\s*/, "")}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
