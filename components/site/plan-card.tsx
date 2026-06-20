import { Badge } from "@/components/ui/badge";

export function PlanCard({
  name,
  price,
  summary,
  badge,
  highlighted,
  purchasable,
}: {
  name: string;
  price: string;
  summary: string;
  badge: string;
  highlighted?: boolean;
  purchasable?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-6 md:p-8 flex flex-col gap-4 ${
        highlighted
          ? "border-[#FF5A1F]/40 bg-[#1C1C1E] shadow-[0_0_40px_rgba(255,90,31,0.08)]"
          : "border-white/10 bg-[#101114]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-bold text-white">{name}</h3>
        <Badge
          variant="outline"
          className={
            purchasable
              ? "border-[#35C759]/40 text-[#35C759]"
              : "border-white/20 text-white/60"
          }
        >
          {badge}
        </Badge>
      </div>
      <p className="text-2xl font-semibold text-[#FF5A1F]">{price}</p>
      <p className="text-white/70 text-sm leading-relaxed flex-1">{summary}</p>
    </article>
  );
}
