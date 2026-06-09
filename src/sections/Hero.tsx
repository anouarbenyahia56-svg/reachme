import { motion, useReducedMotion } from "framer-motion";
import { CTA } from "@/components/CTA";
import { BlurReveal, EASE, WordReveal } from "@/components/motion";

/**
 * Hero — the first five seconds.
 *
 * Headline weight at 500 — the editorial sweet spot between light
 * and bold. Authoritative without being loud.
 *
 * Cascade: headline → sub-copy → CTA, 150 ms apart, each blur-reveal.
 */
export function Hero() {
  const reduced = useReducedMotion();

  const headlineStyle = {
    fontSize: "clamp(2.7rem, 10vw, 7rem)",
    lineHeight: 1.02,
    letterSpacing: "-0.045em",
    fontWeight: 500,
    fontOpticalSizing: "auto" as const,
    fontFeatureSettings: "'ss01', 'kern'",
    textWrap: "balance" as const,
    paddingTop: "0.06em",
    paddingBottom: "0.04em",
    maxWidth: "min(18ch, 100%)",
  };

  return (
    <section
      id="top"
      className="relative px-6 pb-20 pt-40 md:px-10 md:pb-28 md:pt-44"
    >
      <div className="mx-auto flex max-w-[1180px] flex-col items-center text-center">
        <h1
          className="font-serif text-[hsl(var(--ink))]"
          style={headlineStyle}
        >
          <span className="block">
            <WordReveal
              text="Serious people"
              inView={false}
              delay={0.1}
              stagger={0.05}
              duration={0.7}
              as="span"
            />
          </span>
          <span className="block">
            <WordReveal
              text="can reach you."
              inView={false}
              delay={0.2}
              stagger={0.05}
              duration={0.7}
              as="span"
            />
          </span>
          <motion.span
            initial={
              reduced
                ? { opacity: 1, y: 0, filter: "blur(0px)" }
                : { opacity: 0, y: 16, filter: "blur(8px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
            className="block italic text-[hsl(var(--ink-subtle))]"
            style={{ fontSize: "0.84em", fontWeight: 400 }}
            aria-hidden="true"
          >
            Noise cannot.
          </motion.span>
          <span className="sr-only">Noise cannot.</span>
        </h1>

        <BlurReveal
          delay={0.6}
          duration={0.7}
          inView={false}
          as="p"
          className="mt-12 max-w-[44ch] text-[hsl(var(--ink-muted))]"
        >
          <span
            style={{
              fontSize: "clamp(1.05rem, 1.5vw, 1.25rem)",
              lineHeight: 1.5,
              fontWeight: 400,
              textWrap: "balance",
              display: "inline",
            }}
          >
            Set the floor. Let the requests worth your time through.
            Let everything else disappear.
          </span>
        </BlurReveal>

        <BlurReveal
          delay={0.7}
          duration={0.7}
          inView={false}
          className="mt-12 flex flex-col items-center gap-7"
        >
          <CTA href="/claim" label="Claim your handle" />
          <SeeHowItWorks />
        </BlurReveal>
      </div>
    </section>
  );
}

/**
 * "See how it works" — the entire unit slides as one.
 *
 * Hover: the inner row translates left by 12 px while the arrow's
 * container expands from 0 → 22 px and fades in. All three
 * properties share the same 700 ms duration and the same easing,
 * so the eye reads it as one continuous, settled motion.
 */
function SeeHowItWorks() {
  return (
    <a
      href="#mechanic"
      className="group relative inline-flex items-center text-[11px] font-medium uppercase text-[hsl(var(--ink-muted))] transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[hsl(var(--ink))]"
      style={{ letterSpacing: "0.22em" }}
    >
      <span className="inline-flex items-center transition-transform duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-[12px]">
        <span>See how it works</span>
        <span
          aria-hidden="true"
          className="ml-2 inline-flex w-0 items-center overflow-hidden text-[hsl(var(--ink))] opacity-0 transition-[width,opacity] duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-[22px] group-hover:opacity-100"
        >
          <svg
            viewBox="0 0 18 8"
            width="18"
            height="8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="square"
            strokeLinejoin="miter"
            className="ml-1 shrink-0"
          >
            <path d="M0 4 H16" />
            <path d="M13 1 L16.5 4 L13 7" />
          </svg>
        </span>
      </span>
    </a>
  );
}
