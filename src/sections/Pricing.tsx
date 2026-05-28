import {
  BlurReveal,
  CountTo,
  RevealLines,
  RevealScale,
  SECTION_GRID,
  SECTION_PADDING,
  WordReveal,
} from "@/components/motion";

const TERMS = [
  "Free to create your profile.",
  "No subscription. No monthly cost.",
  "Nothing taken on declined or expired requests.",
  "5% only when you choose to reply.",
] as const;

/**
 * Pricing — alignment, not extraction.
 *
 * Type pairing on the display number: the digit is Fraunces (the
 * editorial voice) and the % is Inter (a clean modern construction).
 * Fraunces' own % is drawn in the Cooper Black / Windsor "wonky"
 * tradition with an exaggerated slash that visually breaks the glyph
 * at editorial display size — the foundry's own specimen describes
 * it as "playful, even outright goofy". That voice belongs to the
 * wordmark, not to the number.
 *
 * The countdown runs from 100 → 5 over 1.7 s on viewport entry.
 */
export function Pricing() {
  return (
    <section id="pricing" className={`relative ${SECTION_PADDING}`}>
      <div className={SECTION_GRID}>
        <div className="col-span-12 md:col-span-10 md:col-start-2">
          <div className="grid items-start gap-16 md:grid-cols-12 md:gap-20">
            <div className="md:col-span-5">
              <WordReveal
                as="h2"
                text="We earn only when you reply."
                className="font-serif text-[hsl(var(--ink))]"
                style={{
                  fontSize: "clamp(2.1rem, 3.6vw, 3.1rem)",
                  fontWeight: 500,
                  lineHeight: 1.04,
                  letterSpacing: "-0.03em",
                  textWrap: "balance",
                }}
                stagger={0.05}
              />
              <BlurReveal delay={0.3} duration={0.95}>
                <p
                  className="mt-7 max-w-[36ch] text-[hsl(var(--ink-muted))]"
                  style={{
                    fontSize: "1.05rem",
                    lineHeight: 1.6,
                    textWrap: "balance",
                  }}
                >
                  Our incentives sit alongside yours. If you don’t reply,
                  the sender is refunded — and we earn nothing.
                </p>
              </BlurReveal>
            </div>

            <div className="md:col-span-7">
              <RevealScale duration={1.2}>
                <div className="flex items-start gap-8 md:gap-10">
                  <div
                    className="text-[hsl(var(--ink))]"
                    style={{
                      fontSize: "clamp(6rem, 16vw, 12rem)",
                      lineHeight: 1,
                      fontWeight: 500,
                    }}
                  >
                    {/* The digit — Fraunces. */}
                    <span
                      className="font-serif"
                      style={{
                        letterSpacing: "-0.02em",
                        fontFeatureSettings: "'ss01' 0, 'kern' 1",
                        fontVariantNumeric: "lining-nums tabular-nums",
                        fontOpticalSizing: "auto",
                      }}
                    >
                      <CountTo from={100} to={5} duration={1.7} />
                    </span>
                    {/* The % — Inter. Sized down to match the digit's
                        cap-height visually. Fraunces' own % is drawn
                        in the Cooper Black "wonky" tradition with a
                        slash that visually breaks the glyph at this
                        scale — Inter's % is clean and modern. */}
                    <span
                      className="font-sans"
                      style={{
                        fontSize: "0.7em",
                        fontWeight: 500,
                        letterSpacing: "normal",
                        marginLeft: "0.05em",
                        verticalAlign: "0.18em",
                        display: "inline-block",
                      }}
                    >
                      %
                    </span>
                  </div>
                  <span
                    className="mt-4 font-medium uppercase text-[hsl(var(--ink-subtle))]"
                    style={{
                      fontSize: "0.72rem",
                      letterSpacing: "0.22em",
                      lineHeight: 1.7,
                    }}
                  >
                    per
                    <br />
                    completed
                    <br />
                    reply
                  </span>
                </div>
              </RevealScale>

              <RevealLines
                delay={0.3}
                stagger={0.13}
                className="mt-14 grid gap-5 pt-2"
              >
                {TERMS.map((term) => (
                  <div
                    key={term}
                    className="flex items-baseline gap-4 text-[hsl(var(--ink))]"
                    style={{ fontSize: "1rem", lineHeight: 1.55 }}
                  >
                    <span
                      aria-hidden="true"
                      className="mt-[7px] inline-block h-[5px] w-[5px] shrink-0 rounded-full bg-[hsl(var(--ink))]"
                    />
                    <span>{term}</span>
                  </div>
                ))}
              </RevealLines>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
