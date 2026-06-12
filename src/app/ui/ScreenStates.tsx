import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

/**
 * Shared loading / error / empty primitives.
 *
 * Every data-driven screen should declare a `loading` and `error`
 * named variable (both currently stubbed — see TODO comments in each
 * screen) and render the matching state component while data is
 * in-flight or a fetch has failed.
 *
 * Backend integration: replace `const loading = false` with the real
 * fetch state; replace `const error = null` with the caught error.
 */

// ─── Skeleton ──────────────────────────────────────────────────

/**
 * A single shimmer block. Compose several of these inside a container
 * to build a per-screen loading skeleton.
 */
export function Skeleton({
  width = "w-full",
  height = "h-4",
  className,
  radius = "rounded-md",
}: {
  width?: string;
  height?: string;
  className?: string;
  radius?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden bg-[hsl(var(--rule))]/45",
        radius,
        width,
        height,
        className,
      )}
    >
      <div className="absolute inset-0 animate-[shimmer-sweep_1.6s_infinite] bg-gradient-to-r from-transparent via-white/55 to-transparent" />
    </div>
  );
}

// ─── Card skeleton ─────────────────────────────────────────────

/**
 * A card-shaped skeleton with configurable rows.
 * Drop inside a <Card> body for a consistent loading placeholder.
 */
export function CardSkeleton({
  rows = 3,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-5", className)} aria-busy="true" aria-label="Loading content">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height="h-[48px]" />
      ))}
    </div>
  );
}

// ─── Screen error ──────────────────────────────────────────────

/**
 * A calm, centered error state with retry.
 * Use inside a Card when a screen-level fetch fails.
 */
export function ScreenError({
  title = "Something went wrong.",
  message = "We couldn't load this page. Please try again.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="px-7 py-20 text-center md:px-9" role="alert">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--danger))]/8 text-[hsl(var(--danger))] ring-1 ring-[hsl(var(--danger))]/15">
        <AlertTriangle size={18} strokeWidth={1.6} aria-hidden="true" />
      </span>
      <h3
        className="mt-5 font-serif text-[hsl(var(--ink))]"
        style={{
          fontSize: "1.5rem",
          fontWeight: 500,
          letterSpacing: "-0.025em",
        }}
      >
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-[44ch] text-[13.5px] text-[hsl(var(--ink-muted))]">
        {message}
      </p>
      {onRetry && (
        <div className="mt-6">
          <Button
            size="md"
            variant="outline"
            onClick={onRetry}
            leadingIcon={<RefreshCw size={14} strokeWidth={1.6} />}
          >
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
