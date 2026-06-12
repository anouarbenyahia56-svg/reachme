import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { CTA } from "@/components/CTA";
import { BlurReveal, EASE, SECTION_PADDING, WordReveal } from "@/components/motion";

/**
 * Closing — the last word.
 *
 * Renders against the standard tokens. Type matches the hero scale;
 * the page bookends.
 *
 * Subline beneath the CTA contextualises "handle" — the only place
 * on the page that defines the term, placed exactly where the action
 * is asked for.
 */
export function Closing() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5], [0.96, 1]);
  const blur = useTransform(scrollYProgress, [0, 0.5], ["blur(4px)", "blur(0px)"]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0.6, 1]);

  return (
    <section
      ref={ref}
      className={`relative ${SECTION_PADDING.replace(
        "py-32",
        "py-44",
      ).replace("md:py-40", "md:py-56")}`}
    >
      <motion.div
        className="mx-auto max-w-[1100px] text-center"
        style={reduced ? undefined : { scale, filter: blur, opacity }}
      >
        <WordReveal
          as="h2"
          text="Stay reachable."
          className="font-serif text-[hsl(var(--ink))]"
          style={{
            fontSize: "clamp(2.8rem, 8.5vw, 6.4rem)",
            fontWeight: 500,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            textWrap: "balance",
            paddingBottom: "0.06em",
          }}
          stagger={0.06}
        />
        <WordReveal
          as="h2"
          text="Without letting noise reach you."
          className="mt-1 font-serif italic text-[hsl(var(--ink-subtle))]"
          style={{
            fontSize: "clamp(2.8rem, 8.5vw, 6.4rem)",
            fontWeight: 500,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            textWrap: "balance",
            paddingBottom: "0.06em",
          }}
          stagger={0.06}
          delay={0.18}
        />

        <BlurReveal delay={0.5} duration={0.9}>
          <div className="mt-20 flex justify-center">
            <CTA href="/claim" label="Claim your handle" />
          </div>
          <p
            className="mx-auto mt-7 max-w-[44ch] text-[hsl(var(--ink-muted))]"
            style={{
              fontSize: "0.92rem",
              lineHeight: 1.55,
              letterSpacing: "0.005em",
              textWrap: "balance",
            }}
          >
            Your handle is your address on ReachMe — a private page where
            people can send you serious requests. Free to set up. You decide
            who reaches you.
          </p>
        </BlurReveal>
      </motion.div>
    </section>
  );
}
