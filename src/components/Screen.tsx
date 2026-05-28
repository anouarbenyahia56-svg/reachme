import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Screen shell — the canvas every non-landing surface lives on.
 *
 * Centers a single column. Generous breathing top and bottom. Carries
 * the same off-white register as the landing page so the visual world
 * never breaks across screens.
 *
 * Auth, claim, dashboard, settings, public profile — all sit inside
 * <Screen>. The page's own content sets its rhythm; the shell only
 * owns the surrounding silence.
 */
export function Screen({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-[hsl(var(--page))] text-[hsl(var(--ink))]">
      <main
        className={cn(
          "mx-auto w-full max-w-[640px]",
          "px-6 pb-32 pt-32 md:pt-44",
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}

/**
 * Tracked-out, all-caps section label. Used above each screen's
 * primary heading as a quiet editorial mark — the same visual
 * register as the landing page's chapter cues.
 */
export function ScreenEyebrow({ children }: { children: ReactNode }) {
  return (
    <p
      className="text-[hsl(var(--ink-muted))]"
      style={{
        fontSize: "0.7rem",
        fontWeight: 500,
        letterSpacing: "0.24em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </p>
  );
}

/** Display heading on a screen. Matches landing typographic voice. */
export function ScreenTitle({ children }: { children: ReactNode }) {
  return (
    <h1
      className="font-serif text-[hsl(var(--ink))]"
      style={{
        fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
        lineHeight: 1.04,
        letterSpacing: "-0.035em",
        fontWeight: 500,
        textWrap: "balance",
      }}
    >
      {children}
    </h1>
  );
}

/** Quiet supporting line beneath the heading. */
export function ScreenLede({ children }: { children: ReactNode }) {
  return (
    <p
      className="max-w-[42ch] text-[hsl(var(--ink-muted))]"
      style={{
        fontSize: "1.05rem",
        lineHeight: 1.55,
        textWrap: "balance",
      }}
    >
      {children}
    </p>
  );
}
