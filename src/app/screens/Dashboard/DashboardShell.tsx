import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE } from "@/components/motion";
import { AppHeader } from "../../ui/AppHeader";
import { Reveal } from "../../ui/Reveal";
import { Link, useRouter } from "../../router";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Overview", href: "/dashboard" },
  { label: "Received", href: "/dashboard/received" },
  { label: "Sent", href: "/dashboard/sent" },
  { label: "My page", href: "/dashboard/page" },
  { label: "Settings", href: "/dashboard/settings" },
] as const;

/**
 * Dashboard shell — the chrome the owner lives in. Title sets
 * the tone ("Your inbox, on your terms."), tabs are pill-shaped
 * and underlined-on-hover for the active state.
 */
export function DashboardShell({
  title,
  description,
  trailing,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  const { path } = useRouter();

  return (
    <div className="min-h-screen bg-[hsl(var(--page))] text-[hsl(var(--ink))]">
      <AppHeader />

      <main className="mx-auto max-w-[1180px] px-5 pb-32 pt-12 md:px-8 md:pt-16">
        <Reveal>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
                Dashboard
              </p>
              <h1
                className="font-serif text-[hsl(var(--ink))]"
                style={{
                  fontSize: "clamp(2.4rem, 5.4vw, 4rem)",
                  fontWeight: 500,
                  lineHeight: 1.02,
                  letterSpacing: "-0.04em",
                  textWrap: "balance",
                }}
              >
                {title}
              </h1>
              {description && (
                <p
                  className="mt-4 max-w-[58ch] text-[hsl(var(--ink-muted))]"
                  style={{ fontSize: "1rem", lineHeight: 1.6 }}
                >
                  {description}
                </p>
              )}
            </div>
            {trailing && <div className="shrink-0">{trailing}</div>}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <nav
            aria-label="Dashboard sections"
            className="mt-10 flex flex-wrap items-center gap-2 border-b border-[hsl(var(--rule))] pb-1"
          >
            {TABS.map((t) => {
              const active =
                t.href === "/dashboard"
                  ? path === "/dashboard"
                  : path.startsWith(t.href);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-[13px] font-medium transition-colors duration-300",
                    active
                      ? "bg-[hsl(var(--ink))] text-[hsl(var(--page))]"
                      : "text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--ink))]",
                  )}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </Reveal>

        <motion.div
          key={path}
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mt-10"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
