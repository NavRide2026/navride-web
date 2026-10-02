"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
  title?: string;
}

export function FaqAccordion({ items, title = "Preguntas Frecuentes (FAQ)" }: FaqAccordionProps) {
  const [openIndices, setOpenIndices] = useState<number[]>([0]);

  const toggle = (index: number) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <section className="my-10 rounded-2xl border border-white/10 bg-[#0d0f12] p-5 sm:p-7">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle size={20} className="text-[#FF8500]" />
        <h3 className="text-lg font-bold text-white sm:text-xl">{title}</h3>
      </div>

      <div className="divide-y divide-white/5 space-y-3">
        {items.map((item, idx) => {
          const isOpen = openIndices.includes(idx);
          return (
            <div key={idx} className="pt-3 first:pt-0">
              <button
                type="button"
                onClick={() => toggle(idx)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 py-3 text-left font-semibold text-white/90 hover:text-[#FF9D2E] transition focus:outline-none"
              >
                <span className="text-sm sm:text-base leading-snug">{item.question}</span>
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 transition-transform duration-200 ${
                    isOpen ? "rotate-180 bg-[#FF8500]/20 text-[#FF8500]" : "text-white/40"
                  }`}
                >
                  <ChevronDown size={16} />
                </span>
              </button>

              {isOpen && (
                <div className="pb-4 pt-1 text-xs sm:text-sm leading-relaxed text-white/65">
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
