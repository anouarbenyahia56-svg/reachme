import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { AppHeader } from "../../ui/AppHeader";
import { Link, useRouter } from "../../router";
import { VerifyEmailBanner } from "./VerifyEmailBanner";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Overview", href: "/dashboard" },
  { label: "Received", href: "/dashboard/received" },
  { label: "Sent", href: "/dashboard/sent" },
  { label: "Earnings", href: "/dashboard/earnings" },
  { label: "My page", href: "/dashboard/page" },
  { label: "Settings", href: "/dashboard/settings" },
] as const;

/**
 * Dashboard shell — the chrome the owner lives in. The title
 * sets the tone for each tab (Overview: "Your day, at a
 * glance.", Received: "Your inbox, on your terms.", Sent:
 * "What you've sent.", My page: "Your public page.",
 * Settings: "Settings."), tabs are pill-shaped and the active
 * one inverts to ink.
 *
 * Tab swaps are atomic: when the path changes, React commits
 * the new children in a single pass and they appear immediately.
 * The `layoutId` pill animates between tabs on its own — no
 * content-level fade is layered on top, which is what was making
 * every switch feel like 250ms of artificial lag.
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

      <main className="mx-auto max-w-[1180px] px-5 pb-32 pt-10 md:px-8 md:pt-14">
        <VerifyEmailBanner />

        {/* Title — stable across tab switches */}
        <div>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
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
        </div>

        {/* Tabs */}
        <nav
          aria-label="Dashboard sections"
          className="mt-10 flex flex-wrap items-center gap-2"
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
                  "relative rounded-full px-4 py-2 text-[13px] font-medium transition-colors duration-150",
                  active
                    ? "text-[hsl(var(--page))]"
                    : "text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--ink))]",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="dashboard-tab-pill"
                    className="absolute inset-0 rounded-full bg-[hsl(var(--ink))]"
                    transition={{
                      type: "spring",
                      stiffness: 600,
                      damping: 44,
                      mass: 0.5,
                    }}
                  />
                )}
                <span className="relative">{t.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Content — swaps atomically on path change. The shell
            itself stays mounted so the pill can animate freely. */}
        <div className="mt-10">{children}</div>
      </main>
    </div>
  );
}
