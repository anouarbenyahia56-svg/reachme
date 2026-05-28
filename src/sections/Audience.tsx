import { BlurReveal, RevealLines, WordReveal } from "@/components/motion";
import { SECTION_GRID, SECTION_PADDING } from "@/components/layout";

/**
 * Each role gets the full width of the content column.
 * Title sits alone on its line. Descriptor sits below in a lighter
 * weight, written out as a complete, specific thought — given the
 * room to be generous, not telegraphic.
 */
const ROLES = [
  [
    "Founders",
    "Raising rounds, hiring without putting word out, fielding partnership inbound that almost always arrives unsolicited and rarely arrives at the right moment.",
  ],
  [
    "Investors",
    "Filtering thousands of pitches a year down to the few worth a real reading — without the deal-flow signal collapsing into a single overflowing inbox.",
  ],
  [
    "Operators",
    "Advisors, board members, and fractional executives whose calendar is the product, and who need a way to say yes to the right opportunities without saying yes to all of them.",
  ],
  [
    "Creators",
    "Writers, builders, and public thinkers with audiences who want to reach back. The good messages are real. They’re also rare. ReachMe sorts them at the door.",
  ],
  [
    "Experts",
    "Specialists whose time is the entire scarce resource — researchers, lawyers, designers, engineers — who reply more thoughtfully when reply is the choice they actually made.",
  ],
  [
    "Public figures",
    "People whose presence carries unavoidable cost. ReachMe gives back the right to be reachable on terms set by the person doing the reaching back.",
  ],
] as const;

/**
 * Audience — who this is for.
 *
 * Pure stacked layout: each profile owns the full content column.
 * No row dividers, no column dividers — the section breathes through
 * generous vertical spacing alone.
 */
export function Audience() {
  return (
    <section id="audience" className={`relative ${SECTION_PADDING}`}>
      <div className={SECTION_GRID}>
        <div className="col-span-12 md:col-span-10 md:col-start-2">
          <WordReveal
            as="h2"
            text="Built for people whose time is the scarcest thing they own."
            className="font-serif text-[hsl(var(--ink))]"
            style={{
              fontSize: "clamp(2.2rem, 4.6vw, 3.9rem)",
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              textWrap: "balance",
              maxWidth: "20ch",
            }}
            stagger={0.05}
          />

          <BlurReveal delay={0.3} duration={0.95}>
            <p
              className="mt-7 max-w-[48ch] text-[hsl(var(--ink-muted))]"
              style={{
                fontSize: "1.05rem",
                lineHeight: 1.6,
                textWrap: "balance",
              }}
            >
              ReachMe is not a contact form, not a DM inbox, not a
              scheduler, not a link-in-bio, not a social network.
              It is a door — and you decide who knocks.
            </p>
          </BlurReveal>

          <RevealLines
            delay={0.2}
            stagger={0.13}
            duration={0.9}
            className="mt-24 flex flex-col gap-20 md:gap-24"
          >
            {ROLES.map(([role, body]) => (
              <article key={role}>
                <h3
                  className="font-serif text-[hsl(var(--ink))]"
                  style={{
                    fontSize: "clamp(1.9rem, 3vw, 2.6rem)",
                    fontWeight: 600,
                    lineHeight: 1.05,
                    letterSpacing: "-0.025em",
                    fontOpticalSizing: "auto",
                  }}
                >
                  {role}
                </h3>
                <p
                  className="mt-5 text-[hsl(var(--ink-muted))]"
                  style={{
                    fontSize: "1.05rem",
                    lineHeight: 1.6,
                    fontWeight: 400,
                    textWrap: "balance",
                    maxWidth: "60ch",
                  }}
                >
                  {body}
                </p>
              </article>
            ))}
          </RevealLines>

          <BlurReveal delay={0.25} duration={1}>
            <p
              className="mt-28 max-w-[44ch] font-serif italic text-[hsl(var(--ink))]"
              style={{
                fontSize: "clamp(1.35rem, 2vw, 1.7rem)",
                lineHeight: 1.35,
                letterSpacing: "-0.02em",
                fontWeight: 500,
                textWrap: "balance",
              }}
            >
              If your inbound has weight, ReachMe is for you.
            </p>
          </BlurReveal>
        </div>
      </div>
    </section>
  );
}
