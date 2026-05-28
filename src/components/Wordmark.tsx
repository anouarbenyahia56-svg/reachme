import { cn } from "@/lib/utils";

/**
 * The ReachMe wordmark.
 *
 * LOCKED. From this point forward, this component must not be modified
 * — not weight, not tracking, not the trailing period, not the
 * feature settings. The logo is fixed.
 *
 * Fraunces, weight 600 (bold), tight tracking, with a quieter trailing period.
 */
export function Wordmark({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "text-[1.05rem]",
    md: "text-[1.35rem]",
    lg: "text-[1.6rem]",
  } as const;

  return (
    <span
      translate="no"
      className={cn(
        "font-serif select-none text-[hsl(var(--ink))]",
        sizes[size],
        className,
      )}
      style={{
        fontWeight: 600,
        letterSpacing: "-0.04em",
        fontOpticalSizing: "auto",
        fontFeatureSettings: "'ss01', 'kern'",
      }}
    >
      ReachMe<span aria-hidden="true">.</span>
    </span>
  );
}
