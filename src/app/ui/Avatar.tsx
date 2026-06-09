import { cn } from "@/lib/utils";

/**
 * Avatar — circular, neutral, with a serif initial when no
 * image is provided.
 */

const sizes = {
  xs: "h-7 w-7 text-[11px]",
  sm: "h-9 w-9 text-[13px]",
  md: "h-12 w-12 text-[16px]",
  lg: "h-16 w-16 text-[20px]",
  xl: "h-24 w-24 text-[28px]",
  "2xl": "h-32 w-32 text-[36px]",
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
          className="h-full w-full border-0 object-cover"
          draggable={false}
        />
      ) : (
        <span style={{ letterSpacing: "-0.02em" }}>
          {name.trim().charAt(0).toUpperCase() || "?"}
        </span>
      )}
    </span>
  );
}
