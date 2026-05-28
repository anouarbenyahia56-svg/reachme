import {
  BlurReveal,
  RevealLines,
  SECTION_GRID,
  SECTION_PADDING,
  WordReveal,
} from "@/components/motion";

const STATEMENTS = [
  "Noise scaled faster than filters could. Volume won. Signal disappeared.",
  "Access became effortless. The laziest message reached the same people as the serious one.",
  "The people worth reaching either shut the doors or stayed exhaustingly available. There was no middle ground.",
] as const;

/**
 * Thesis.
 *
 * Headline pair sets up the page's central observation.
 * Three statements land like uncomfortable truths.
 * Closing italic states the platform's role.
 *
 * No section divider — sections breathe through spacing alone.
 */
export function Thesis() {
  const titleStyle = {
    fontSize: "clamp(2.1rem, 4.4vw, 3.8rem)",
    fontWeight: 400,
    lineHeight: 1.05,
    letterSpacing: "-0.03em",
    textWrap: "balance" as const,
  };

  return (
    <section className={`relative ${SECTION_PADDING}`}>
      <div className={SECTION_GRID}>
        <div className="col-span-12 md:col-span-10 md:col-start-2">
          <WordReveal
            as="h2"
            text="The internet made everyone reachable."
            className="font-serif text-[hsl(var(--ink))]"
            style={titleStyle}
            stagger={0.045}
          />
          <WordReveal
            as="h2"
            text="It never built a filter for who deserved to get through."
            className="mt-2 font-serif italic text-[hsl(var(--ink-subtle))]"
            style={titleStyle}
            stagger={0.045}
            delay={0.18}
          />

          <RevealLines
            delay={0.4}
            stagger={0.13}
            className="mt-16 grid gap-10 text-[hsl(var(--ink-muted))] md:grid-cols-3 md:gap-12"
          >
            {STATEMENTS.map((line, i) => (
              <p
                key={i}
                style={{
                  fontSize: "1.04rem",
                  lineHeight: 1.6,
                  textWrap: "balance",
                }}
              >
                {line}
              </p>
            ))}
          </RevealLines>

          <BlurReveal delay={0.5} duration={1}>
            <p
              className="mt-24 max-w-[20ch] font-serif italic text-[hsl(var(--ink))]"
              style={{
                fontSize: "clamp(2rem, 4.6vw, 4rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                fontWeight: 500,
                textWrap: "balance",
              }}
            >
              ReachMe restores friction where friction matters.
            </p>
          </BlurReveal>
        </div>
      </div>
    </section>
  );
}
