import {
  BlurReveal,
  RevealLines,
  SECTION_GRID,
  SECTION_PADDING,
  WordReveal,
} from "@/components/motion";

const STEPS = [
  {
    title: "Set your floor.",
    body: "You decide the minimum amount someone must attach to reach you. Your floor is your boundary.",
  },
  {
    title: "Every request arrives complete.",
    body: "Category. Context. A clear message. And an amount that signals the sender means it. Nothing arrives half-formed.",
  },
  {
    title: "Reply or let it expire.",
    body: "You stay in control. Replies release the payment. Expired requests are refunded automatically.",
  },
] as const;

/**
 * Mechanic — what the product actually does, framed as a felt truth.
 *
 * Headline ("Every request earns its way in.") names the mechanic from
 * the sender's side: the friction is the proof. No section top rule.
 * Columns separated by vertical hairlines on desktop only — no top
 * ink rule on the cards themselves.
 */
export function Mechanic() {
  return (
    <section id="mechanic" className={`relative ${SECTION_PADDING}`}>
      <div className={SECTION_GRID}>
        <div className="col-span-12 mx-auto max-w-[820px] text-center">
          <WordReveal
            as="h2"
            text="Every request earns its way in."
            className="font-serif text-[hsl(var(--ink))]"
            style={{
              fontSize: "clamp(2.6rem, 5.4vw, 4.6rem)",
              fontWeight: 500,
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
              textWrap: "balance",
            }}
            stagger={0.05}
          />
          <BlurReveal delay={0.25} duration={0.85}>
            <p
              className="mx-auto mt-7 max-w-[52ch] text-[hsl(var(--ink-muted))]"
              style={{
                fontSize: "1.08rem",
                lineHeight: 1.6,
                textWrap: "balance",
              }}
            >
              The amount is not a payment. It is a seriousness signal.
              It forces the sender to decide whether they truly mean it
              before anything reaches you.
            </p>
          </BlurReveal>
        </div>

        <RevealLines
          delay={0.15}
          stagger={0.13}
          className="col-span-12 mt-24 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-0"
        >
          {STEPS.map((step, i) => (
            <article
              key={step.title}
              className={[
                "relative md:pt-9 md:pb-10 md:pr-10",
                "md:[&:not(:first-child)]:border-l md:[&:not(:first-child)]:border-[hsl(var(--rule))]",
                i === 0 ? "md:pl-0" : "md:pl-10",
              ].join(" ")}
            >
              <h3
                className="font-serif text-[hsl(var(--ink))]"
                style={{
                  fontSize: "1.55rem",
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.18,
                  textWrap: "balance",
                  fontOpticalSizing: "auto",
                }}
              >
                {step.title}
              </h3>
              <p
                className="mt-5 max-w-[36ch] text-[hsl(var(--ink-muted))]"
                style={{ fontSize: "0.97rem", lineHeight: 1.65 }}
              >
                {step.body}
              </p>
            </article>
          ))}
        </RevealLines>
      </div>
    </section>
  );
}
