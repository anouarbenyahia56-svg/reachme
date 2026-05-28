import { motion, useScroll, useTransform } from "framer-motion";
import { Wordmark } from "@/components/Wordmark";
import { EASE } from "@/components/motion";

const PRIMARY_LINKS = [
  { label: "How it works", href: "#mechanic" },
  { label: "Who it’s for", href: "#audience" },
  { label: "Pricing", href: "#pricing" },
  { label: "Reach someone", href: "/find" },
] as const;

/**
 * Nav.
 *
 * Links sit at 13.5 px — big enough to feel present, small enough
 * not to compete with the wordmark. No underlines on hover. Color
 * shift only.
 *
 * The frosted backdrop is always on (subtle blur + saturate) and
 * strengthens slightly as the user scrolls past 80 px. Content
 * passing behind the bar always blurs — that is part of the
 * platform's identity.
 */
export function Nav() {
  const { scrollY } = useScroll();
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 0.6]);
  const bgColor = useTransform(
    scrollY,
    [0, 80],
    ["hsl(var(--page) / 0.55)", "hsl(var(--page) / 0.78)"],
  );

  return (
    <motion.header
      initial={{ opacity: 0, y: -8, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.95, ease: EASE }}
      className="fixed inset-x-0 top-0 z-50"
      style={{
        // Always-on frosted backdrop. The 16 px blur + saturate is
        // the platform's signature nav treatment — content blurs
        // behind the bar at every scroll position.
        backdropFilter: "blur(16px) saturate(150%)",
        WebkitBackdropFilter: "blur(16px) saturate(150%)",
      }}
    >
      <motion.div style={{ backgroundColor: bgColor }}>
        <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-6 md:px-10">
          <a
            href="#top"
            aria-label="ReachMe — back to top"
            className="-mx-1 rounded-sm px-1"
          >
            <Wordmark />
          </a>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-9 md:flex"
          >
            {PRIMARY_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-[13.5px] tracking-[-0.005em] text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-5">
            <a
              href="/login"
              className="hidden text-[12.5px] tracking-[0.005em] text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))] sm:block"
            >
              Log in
            </a>
            <a
              href="/claim"
              className="rounded-full bg-[hsl(var(--ink))] px-4 py-2 text-[12.5px] font-medium text-[hsl(var(--page))] transition-colors duration-300 hover:bg-[hsl(var(--ink))]/92"
            >
              Claim handle
            </a>
          </div>
        </div>

        <motion.div
          aria-hidden="true"
          style={{ opacity: borderOpacity, height: "0.5px" }}
          className="w-full bg-[hsl(var(--rule-strong))]"
        />
      </motion.div>
    </motion.header>
  );
}
