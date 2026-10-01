export function SectionHeading({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <header className="mb-10 md:mb-14">
      {eyebrow ? <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#FF8500]">{eyebrow}</p> : null}
      <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">{title}</h1>
      {description ? <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/60 md:text-lg">{description}</p> : null}
    </header>
  );
}
