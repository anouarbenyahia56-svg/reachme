import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { Wordmark } from "@/components/Wordmark";
import { EASE } from "@/components/motion";
import { Link, useRouter } from "../../router";
import { ArrowLeft } from "lucide-react";

/**
 * Onboarding chrome.
 *
 * A whisper of a header — wordmark left, step pill right. A bar
 * of progress beneath. The form sits in a wide, centered column
 * with full-page room to breathe; nothing competes with the
 * single decision being made on each step.
 *
 * The progress bar fills smoothly, with the same easing as the
 * blur-reveals. Steps feel like one connected motion, not a
 * sequence of separate screens.
 */
export function OnboardingShell({
  step,
  total,
  back,
  bare = false,
  children,
}: {
  step?: number;
  total?: number;
  /** Top-left Back target — the path to navigate to. */
  back?: string;
  /** Strips the progress bar and reduces top padding. Used for
   *  the final "go live" screen, which is a gateway to the
   *  dashboard rather than a real step in the sequence. */
  bare?: boolean;
  children: ReactNode;
}) {
  const { navigate } = useRouter();

  const pct = step != null && total != null
    ? Math.max(0, Math.min(1, step / total))
    : 1;

  return (
    <div className="min-h-screen bg-[hsl(var(--page))] text-[hsl(var(--ink))]">
      <header className="sticky inset-x-0 top-0 z-40 bg-[hsl(var(--page))]/85 backdrop-blur">
        <div className="mx-auto flex h-[68px] items-center justify-between px-6 md:px-10">
          <Link href="/" aria-label="ReachMe" className="-mx-1 px-1">
            <Wordmark />
          </Link>
          {!bare && step != null && total != null && (
            <span
              className="sr-only"
              aria-label={`Step ${step} of ${total}`}
            >
              Step {step} / {total}
            </span>
          )}
        </div>
        {!bare && (
          <div
            role="progressbar"
            aria-valuenow={Math.round(pct * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Step ${step} of ${total}`}
            className="relative h-[3px] w-full bg-[hsl(var(--rule))]"
          >
            <motion.div
              initial={false}
              animate={{ scaleX: pct }}
              transition={{ duration: 0.4, ease: EASE }}
              style={{ transformOrigin: "left", height: "3px" }}
              className="absolute inset-y-0 left-0 w-full bg-[hsl(var(--ink))]"
            />
          </div>
        )}
      </header>

      <main className="mx-auto max-w-[920px] overflow-x-clip px-6 pb-32 pt-12 md:px-10 md:pb-44 md:pt-16">
        {back && (
          <button
            type="button"
            onClick={() => navigate(back)}
            className="-ml-2 mb-10 inline-flex items-center gap-2 rounded-md px-2 py-3 text-[15px] text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
          >
            <ArrowLeft size={16} strokeWidth={1.6} aria-hidden="true" />
            Back
          </button>
        )}
        {children}
      </main>
    </div>
  );
}

export function OnboardingTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      {eyebrow && (
        <motion.p
          initial={{ opacity: 0, x: 28, filter: "blur(4px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mb-5 text-[11px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]"
        >
          {eyebrow}
        </motion.p>
      )}
      <motion.h1
        initial={{ opacity: 0, x: 36, filter: "blur(5px)" }}
        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.55, delay: 0.05, ease: EASE }}
        className="font-serif text-[hsl(var(--ink))]"
        style={{
          fontSize: "clamp(2.6rem, 6vw, 4.4rem)",
          lineHeight: 1.02,
          letterSpacing: "-0.04em",
          fontWeight: 500,
          textWrap: "balance",
          maxWidth: "16ch",
        }}
      >
        {title}
      </motion.h1>
      {description && (
        <motion.p
          initial={{ opacity: 0, x: 30, filter: "blur(4px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, delay: 0.12, ease: EASE }}
          className="mt-7 max-w-[52ch] text-[hsl(var(--ink-muted))]"
          style={{ fontSize: "1.1rem", lineHeight: 1.55 }}
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}
