export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-10 md:mb-14">
      {eyebrow ? (
        <p className="text-[#FF5A1F] text-sm font-semibold tracking-widest uppercase mb-3">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-white/60 text-lg max-w-2xl">{description}</p>
      ) : null}
    </div>
  );
}
