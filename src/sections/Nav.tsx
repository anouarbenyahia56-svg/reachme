import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import { EASE } from "@/components/motion";

const PRIMARY_LINKS = [
  { label: "How it works", href: "#mechanic" },
  { label: "Who it's for", href: "#audience" },
  { label: "Pricing", href: "#pricing" },
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
 *
 * Mobile: a hamburger reveals a full-screen overlay with the same
 * links, a login link, and the CTA. The overlay shares the same
 * frosted-backdrop language as the bar itself.
 */
export function Nav() {
  const { scrollY } = useScroll();
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 0.6]);
  const bgColor = useTransform(
    scrollY,
    [0, 80],
    ["hsl(var(--page) / 0.55)", "hsl(var(--page) / 0.78)"],
  );

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus the first link when the panel opens.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      panelRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    }, 80);
    return () => clearTimeout(timer);
  }, [open]);

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
              className="hidden rounded-full bg-[hsl(var(--ink))] px-4 py-2 text-[12.5px] font-medium text-[hsl(var(--page))] transition-colors duration-300 hover:bg-[hsl(var(--ink))]/92 sm:inline-flex"
            >
              Claim handle
            </a>

            {/* Hamburger — visible below md breakpoint */}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex items-center justify-center md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-nav"
            >
              {open ? (
                <X size={20} strokeWidth={1.5} />
              ) : (
                <Menu size={20} strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>

        <motion.div
          aria-hidden="true"
          style={{ opacity: borderOpacity, height: "0.5px" }}
          className="w-full bg-[hsl(var(--rule-strong))]"
        />
      </motion.div>

      {/* ─── Mobile overlay ─────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            ref={panelRef}
            role="dialog"
            aria-label="Navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="fixed inset-0 top-[68px] z-40 flex flex-col bg-[hsl(var(--page) / 0.96)] md:hidden"
            style={{
              backdropFilter: "blur(24px) saturate(160%)",
              WebkitBackdropFilter: "blur(24px) saturate(160%)",
            }}
          >
            <nav
              aria-label="Mobile"
              className="flex flex-1 flex-col items-center justify-center gap-10 px-6"
            >
              {PRIMARY_LINKS.map(({ label, href }, i) => (
                <motion.a
                  key={label}
                  href={href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.04 + i * 0.04,
                    ease: EASE,
                  }}
                  className="font-serif text-[2rem] tracking-[-0.03em] text-[hsl(var(--ink))] transition-colors duration-300 hover:text-[hsl(var(--ink-muted))]"
                >
                  {label}
                </motion.a>
              ))}
            </nav>

            {/* Bottom actions */}
            <div className="flex flex-col items-center gap-6 pb-16">
              <motion.a
                href="/login"
                onClick={() => setOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.16, ease: EASE }}
                className="text-[13.5px] tracking-[0.005em] text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
              >
                Log in
              </motion.a>
              <motion.a
                href="/claim"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.2, ease: EASE }}
                className="rounded-full bg-[hsl(var(--ink))] px-8 py-3 text-[14px] font-medium text-[hsl(var(--page))] transition-colors duration-300 hover:bg-[hsl(var(--ink))]/92"
              >
                Claim handle
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
