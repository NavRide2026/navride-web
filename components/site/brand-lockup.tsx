const SIZES = {
  sm: "h-8 w-[155px]",
  md: "h-10 w-[190px]",
  lg: "h-auto w-[min(82vw,620px)]",
} as const;

export function BrandLockup({
  size = "md",
  className = "",
}: {
  size?: keyof typeof SIZES;
  className?: string;
  showIcon?: boolean;
}) {
  return (
    <span className={`brand-lockup inline-flex min-w-0 shrink-0 items-center ${className}`}>
      <img
        src="/brand/navride-wordmark-clean.svg"
        alt="NavRide"
        width="1200"
        height="280"
        className={`block object-contain ${SIZES[size]}`}
      />
    </span>
  );
}
