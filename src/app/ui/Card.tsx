import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Headline } from "./Headline";
import { headlineCard } from "@/lib/typography";

/**
 * Card — the surface every dashboard module sits on. Quiet,
 * with a hairline border, generous interior padding, and a
 * subtle surface shadow that lifts it from the page.
 */
export function Card({
  children,
  className,
  variant = "default",
  ...rest
}: HTMLAttributes<HTMLDivElement> & { variant?: "default" | "dark" | "urgent" }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border transition-shadow duration-300",
        variant === "dark"
          ? "border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-[hsl(var(--page))]"
          : variant === "urgent"
            ? "border-[hsl(var(--ink))] bg-[hsl(var(--surface))] shadow-glow"
            : "border-[hsl(var(--rule))] bg-[hsl(var(--surface))] shadow-surface",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  eyebrow,
  title,
  description,
  trailing,
  className,
}: {
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-6 px-7 pt-6 md:px-9 md:pt-7",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p
            className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--ink-subtle))]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {eyebrow}
          </p>
        )}
        {title && (
          <Headline preset={headlineCard} as="h2">
            {title}
          </Headline>
        )}
        {description && (
          <p
            className="mt-3 max-w-[60ch] text-[hsl(var(--ink-muted))]"
            style={{ fontSize: "0.97rem", lineHeight: 1.6 }}
          >
            {description}
          </p>
        )}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-7 py-6 md:px-9 md:py-7", className)}>{children}</div>
  );
}

export function CardFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-t border-[hsl(var(--rule))] px-7 py-5 md:px-9",
        className,
      )}
    >
      {children}
    </div>
  );
}
