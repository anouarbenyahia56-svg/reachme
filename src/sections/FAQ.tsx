"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RevealLines, WordReveal } from "@/components/motion";
import { EASE, SECTION_GRID, SECTION_PADDING } from "@/components/layout";

const ITEMS = [
  {
    q: "What’s the amount actually for?",
    a: "It’s a seriousness signal — not a payment for your time. The sender attaches it to demonstrate the request is worth your attention. You can choose to reply and accept it, or decline and refund it. Either way, the sender chose to put something on the line.",
  },
  {
    q: "What happens if I don’t reply?",
    a: "Nothing on your side. The request expires after seven days, the sender is refunded automatically, and we take no fee. The default is friction-free for you.",
  },
  {
    q: "How is this different from a paid DM or a Calendly?",
    a: "A paid DM sells access. A scheduler sells time. ReachMe doesn’t sell either. It filters requests at the door so the only ones that reach you are the ones you’d want to read.",
  },
  {
    q: "Can senders attach more than my floor?",
    a: "Yes. Your floor sets the minimum, not the maximum. Senders can attach more to signal priority — and it’s a signal you’re free to weigh however you choose.",
  },
  {
    q: "Is ReachMe a marketplace?",
    a: "No. ReachMe doesn’t list, rank, or sell access to you. It gives you a private request page and an inbox you control. You stay the gatekeeper.",
  },
] as const;

/**
 * Two perpendicular hairlines — the vertical collapses to zero when
 * the row opens. No icon library shape. Built in CSS, animates on
 * transform only.
 */
function ToggleMark({ open }: { open: boolean }) {
  return (
    <span className="relative inline-block h-3 w-3" aria-hidden="true">
      <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
      <motion.span
        initial={false}
        animate={{ scaleY: open ? 0 : 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        style={{ transformOrigin: "center" }}
        className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current"
      />
    </span>
  );
}

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className={`relative ${SECTION_PADDING}`}>
      <div className={SECTION_GRID}>
        <div className="col-span-12 md:col-span-10 md:col-start-2">
          <WordReveal
            as="h2"
            text="The questions worth asking first."
            className="font-serif text-[hsl(var(--ink))]"
            style={{
              fontSize: "clamp(2.4rem, 4.6vw, 3.8rem)",
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              textWrap: "balance",
            }}
            stagger={0.05}
          />

          <RevealLines
            delay={0.2}
            stagger={0.07}
            className="mt-16 divide-y divide-[hsl(var(--rule))] border-b border-[hsl(var(--rule))]"
          >
            {ITEMS.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="group flex w-full items-center justify-between gap-6 py-7 text-left"
                  >
                    <span
                      className="text-[hsl(var(--ink))] transition-colors duration-300"
                      style={{
                        fontSize: "1.08rem",
                        fontWeight: 500,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {item.q}
                    </span>
                    <span className="shrink-0 text-[hsl(var(--ink-muted))] transition-colors duration-300 group-hover:text-[hsl(var(--ink))]">
                      <ToggleMark open={isOpen} />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: "auto",
                          opacity: 1,
                          transition: {
                            height: { duration: 0.6, ease: EASE },
                            opacity: { duration: 0.6, delay: 0.15, ease: EASE },
                          },
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                          transition: {
                            height: { duration: 0.6, ease: EASE },
                            opacity: { duration: 0.6, ease: EASE },
                          },
                        }}
                        className="overflow-hidden"
                      >
                        <p
                          className="max-w-[60ch] pb-7 text-[hsl(var(--ink-muted))]"
                          style={{
                            fontSize: "1rem",
                            lineHeight: 1.65,
                          }}
                        >
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </RevealLines>
        </div>
      </div>
    </section>
  );
}
