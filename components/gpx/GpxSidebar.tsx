"use client";

import type { ReactNode } from "react";

export function GpxSidebar({
  collapsed,
  mobileOpen,
  children,
  onCloseMobile,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  children: ReactNode;
  onCloseMobile: () => void;
}) {
  return (
    <>
      {!collapsed && (
        <aside className="hidden md:flex absolute top-0 right-0 bottom-0 w-80 flex-col bg-[#0a0a0a] border-l border-white/8 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
        </aside>
      )}

      {mobileOpen && (
        <div
          className="absolute inset-0 z-10 md:hidden bg-black/40"
          onClick={onCloseMobile}
        />
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 z-20 md:hidden flex flex-col overflow-hidden transition-transform duration-300 ease-out ${
          mobileOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "72dvh" }}
      >
        <div className="bg-[#0a0a0a] border-t border-white/10 rounded-t-2xl overflow-hidden flex flex-col flex-1 min-h-0 max-h-[72dvh]">
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
        </div>
      </div>
    </>
  );
}
