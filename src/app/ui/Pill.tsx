import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Pill — the tag/label primitive. Echoes the rounded-full pill
 * of the primary CTA at a smaller, quieter scale. Used for
 * categories, status, metadata.
 */

type Tone = "neutral" | "ink" | "muted";

const tones: Record<Tone, string> = {
  neutral:
    "border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] text-[hsl(var(--ink))]",
  ink: "bg-[hsl(var(--ink))] text-[hsl(var(--page))]",
  muted:
    "border border-[hsl(var(--rule))] bg-transparent text-[hsl(var(--ink-muted))]",
};

export function Pill({
  children,
  tone = "neutral",
  className,
  size = "md",
}: {
  children: ReactNode;
  tone?: Tone;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === "sm"
          ? "px-4 py-[7px] text-[12.5px] tracking-[-0.01em]"
          : "px-[18px] py-2 text-[13px] tracking-[-0.01em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Small, dot + label status indicator. */
export function StatusDot({
  tone = "live",
  children,
  className,
}: {
  tone?: "live" | "paused" | "muted";
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] px-3 py-1 text-[11.5px] font-medium text-[hsl(var(--ink))]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          tone === "live" && "bg-[hsl(var(--ink))]",
          tone === "paused" && "bg-[hsl(var(--ink-subtle))]",
          tone === "muted" && "bg-[hsl(var(--ink-subtle))]",
        )}
      />
      {children}
    </span>
  );
}
