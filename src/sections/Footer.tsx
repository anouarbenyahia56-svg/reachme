import { Wordmark } from "@/components/Wordmark";
import { BlurReveal, RevealLines } from "@/components/motion";

const COLUMNS = [
  {
    label: "Product",
    items: [
      ["How it works", "#mechanic"],
      ["Who it's for", "#audience"],
      ["Pricing", "#pricing"],
    ],
  },
  {
    label: "Company",
    items: [
      ["Manifesto", "#"],
      ["Contact", "mailto:hello@reachme.com"],
    ],
  },
  {
    label: "Legal",
    items: [
      ["Terms", "/terms"],
      ["Privacy", "/privacy"],
    ],
  },
] as const;

/**
 * Footer.
 *
 * Lives inside the dark-world wrapper alongside the closing.
 * Renders against the same standard tokens — which the wrapper has
 * remapped — so the section does not know it is dark.
 */
export function Footer() {
  return (
    <footer className="px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto grid max-w-[1240px] grid-cols-12 gap-10">
        <BlurReveal className="col-span-12 md:col-span-5">
          <Wordmark size="lg" />
          <p
            className="mt-6 max-w-[36ch] text-[hsl(var(--ink-muted))]"
            style={{ fontSize: "0.98rem", lineHeight: 1.6 }}
          >
            Your attention is yours. ReachMe keeps it that way.
          </p>
        </BlurReveal>

        <RevealLines
          delay={0.1}
          stagger={0.1}
          className="col-span-12 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8 md:col-span-7 md:gap-12"
        >
          {COLUMNS.map((col) => (
            <div key={col.label}>
              <p
                className="mb-5 uppercase text-[hsl(var(--ink-subtle))]"
                style={{
                  fontSize: "0.66rem",
                  fontWeight: 500,
                  letterSpacing: "0.22em",
                }}
              >
                {col.label}
              </p>
              <ul className="space-y-3">
                {col.items.map(([label, href]) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-[hsl(var(--ink))] transition-colors duration-300 hover:text-[hsl(var(--ink-muted))]"
                      style={{ fontSize: "0.94rem" }}
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </RevealLines>

        <BlurReveal
          delay={0.2}
          className="col-span-12 mt-8 flex flex-col items-start justify-between gap-3 border-t border-[hsl(var(--rule))] pt-8 text-[hsl(var(--ink-subtle))] md:flex-row md:items-center"
        >
          <span style={{ fontSize: "0.78rem", letterSpacing: "0.02em" }}>
            © {new Date().getFullYear()} ReachMe. All rights reserved.
          </span>
        </BlurReveal>
      </div>
    </footer>
  );
}
