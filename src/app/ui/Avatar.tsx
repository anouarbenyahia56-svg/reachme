import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { initials as makeInitials } from "../store/format";

/**
 * Avatar — circular, neutral, with a serif initial when no
 * image is provided. The verified mark is the same simple
 * filled-check used across the platform.
 */

const sizes = {
  xs: "h-7 w-7 text-[11px]",
  sm: "h-9 w-9 text-[13px]",
  md: "h-12 w-12 text-[16px]",
  lg: "h-16 w-16 text-[20px]",
  xl: "h-24 w-24 text-[28px]",
} as const;

type Size = keyof typeof sizes;

export function Avatar({
  src,
  name,
  size = "md",
  ring = false,
  className,
}: {
  src?: string;
  name: string;
  size?: Size;
  ring?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-[hsl(var(--rule))] font-serif font-medium text-[hsl(var(--ink-muted))]",
        sizes[size],
        ring && "ring-4 ring-[hsl(var(--page))]",
        className,
      )}
      aria-hidden="true"
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <span style={{ letterSpacing: "-0.02em" }}>{makeInitials(name)}</span>
      )}
    </span>
  );
}

export function VerifiedMark({
  className,
  size = 14,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <CheckCircle2
      className={cn("text-[hsl(var(--ink))]", className)}
      size={size}
      strokeWidth={1.6}
      aria-label="Verified"
    />
  );
}
