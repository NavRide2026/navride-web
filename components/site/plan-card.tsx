import { Badge } from "@/components/ui/badge";

export function PlanCard({
  name,
  price,
  priceSecondary,
  summary,
  badge,
  highlighted,
  purchasable,
}: {
  name: string;
  price: string;
  priceSecondary?: string;
  summary: string;
  badge: string;
  highlighted?: boolean;
  purchasable?: boolean;
}) {
  return (
    <article
      className={`flex flex-col gap-4 rounded-2xl border p-6 md:p-8 ${
        highlighted
          ? "border-[#FF8500]/40 bg-[#171A1F] shadow-[0_0_40px_rgba(255,133,0,.08)]"
          : "border-white/10 bg-[#101114]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-bold text-white">{name}</h2>
        <Badge
          variant="outline"
          className={
            purchasable
              ? "border-[#8BEA00]/40 text-[#8BEA00]"
              : "border-white/20 text-white/60"
          }
        >
          {badge}
        </Badge>
      </div>
      <div>
        <p className="text-2xl font-semibold text-[#FF8500]">{price}</p>
        {priceSecondary ? (
          <p className="mt-1 text-sm text-white/50">{priceSecondary}</p>
        ) : null}
      </div>
      <p className="flex-1 text-sm leading-relaxed text-white/70">{summary}</p>
    </article>
  );
}
