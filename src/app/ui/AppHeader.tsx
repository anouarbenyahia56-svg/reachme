import { motion, useScroll, useTransform } from "framer-motion";
import { Wordmark } from "@/components/Wordmark";
import { EASE } from "@/components/motion";
import { Link, useRouter } from "../router";
import { useAccount, useProfile, signOut } from "../store/session";
import { Avatar } from "./Avatar";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * App-shell header — the in-app counterpart to the marketing nav.
 * Same wordmark, same frosted-on-scroll backdrop, same easing.
 *
 * Contents shift by mode:
 *   • Marketing  — Log in / Claim handle
 *   • Onboarding — quiet wordmark + step counter (rendered
 *                  inside flow, not here)
 *   • Authed     — wordmark, primary tabs, account menu
 */
export function AppHeader({
  variant = "auto",
}: {
  variant?: "auto" | "marketing" | "minimal";
}) {
  const { scrollY } = useScroll();
  const borderOpacity = useTransform(scrollY, [0, 60], [0, 0.6]);
  const bgColor = useTransform(
    scrollY,
    [0, 60],
    ["hsl(var(--page) / 0.55)", "hsl(var(--page) / 0.85)"],
  );
  const account = useAccount();
  const profile = useProfile();
  const { path } = useRouter();
  // Show "Back to dashboard" instead of "View public page" whenever
  // the link to one's own public page would be a non-sequitur:
  //   • viewing your own public page, or
  //   • anywhere inside a send-a-request flow (/:handle/send), where
  //     you're acting as a sender, not managing your own page.
  const onOwnPublicPage =
    Boolean(profile) && path === `/${profile?.handle}`;
  const inSendFlow = /^\/[^/]+\/send$/.test(path);
  const showDashboardReturn = onOwnPublicPage || inSendFlow;

  // Per-item dropdown context: never offer a link to where the
  // user already is. Each flag hides exactly one menu item when
  // its destination matches the current location.
  const atDashboard = path === "/dashboard";
  const atSettings = path === "/dashboard/settings";
  const atOwnPublicPage = onOwnPublicPage;

  const mode =
    variant === "auto"
      ? account
        ? "authed"
        : "marketing"
      : variant;

  return (
    <motion.header
      initial={{ opacity: 0, y: -6, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.85, ease: EASE }}
      className="sticky inset-x-0 top-0 z-40"
      style={{
        backdropFilter: "blur(16px) saturate(150%)",
        WebkitBackdropFilter: "blur(16px) saturate(150%)",
      }}
    >
      <motion.div style={{ backgroundColor: bgColor }}>
        <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-6 md:px-10">
          <Link
            href="/"
            aria-label="ReachMe — home"
            className="-mx-1 rounded-sm px-1"
          >
            <Wordmark />
          </Link>

          {mode === "marketing" && (
            <div className="flex items-center gap-5">
              <Link
                href="/login"
                className="hidden text-[12.5px] tracking-[0.005em] text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))] sm:block"
              >
                Log in
              </Link>
              <Link
                href="/claim"
                className="rounded-full bg-[hsl(var(--ink))] px-4 py-2 text-[12.5px] font-medium text-[hsl(var(--page))] transition-colors duration-300 hover:bg-[hsl(var(--ink))]/92"
              >
                Claim handle
              </Link>
            </div>
          )}

          {mode === "authed" && account && (
            <AuthedHeaderRight
              email={account.email}
              displayName={profile?.displayName ?? account.displayName}
              avatarUrl={profile?.avatarUrl}
              handle={profile?.handle}
              showDashboardReturn={showDashboardReturn}
              atDashboard={atDashboard}
              atSettings={atSettings}
              atOwnPublicPage={atOwnPublicPage}
            />
          )}

          {mode === "minimal" && <span className="h-1 w-1" aria-hidden="true" />}
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

function AuthedHeaderRight({
  email,
  displayName,
  avatarUrl,
  handle,
  showDashboardReturn,
  atDashboard,
  atSettings,
  atOwnPublicPage,
}: {
  email: string;
  displayName: string;
  avatarUrl?: string;
  handle?: string;
  showDashboardReturn?: boolean;
  atDashboard?: boolean;
  atSettings?: boolean;
  atOwnPublicPage?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="flex items-center gap-3" ref={ref}>
      {handle && (
        showDashboardReturn ? (
          <Link
            href="/dashboard"
            className="hidden text-[12.5px] tracking-[0.005em] text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))] md:block"
          >
            Back to dashboard
          </Link>
        ) : (
          <Link
            href={`/${handle}`}
            className="hidden text-[12.5px] tracking-[0.005em] text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))] md:block"
          >
            View public page
          </Link>
        )
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] py-1 pl-1 pr-3.5 text-[12.5px] text-[hsl(var(--ink))] transition-colors duration-300 hover:border-[hsl(var(--rule-strong))]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar size="xs" src={avatarUrl} name={displayName} />
        <span className="hidden max-w-[14ch] truncate sm:block">
          {displayName}
        </span>
      </button>

      <div
        className={cn(
          "absolute right-6 top-[60px] z-50 w-[260px] origin-top-right rounded-2xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] p-2 transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:right-10",
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100 blur-0"
            : "pointer-events-none -translate-y-1 scale-[0.98] opacity-0 blur-sm",
        )}
        role="menu"
      >
        <div className="px-3 py-2.5">
          <p className="truncate text-[13px] font-medium text-[hsl(var(--ink))]">
            {displayName}
          </p>
          <p className="truncate text-[12px] text-[hsl(var(--ink-subtle))]">
            {email}
          </p>
        </div>
        <div className="mx-2 my-1 h-px bg-[hsl(var(--rule))]" />
        {!atDashboard && (
          <Link
            href="/dashboard"
            className="block rounded-xl px-3 py-2 text-[13px] text-[hsl(var(--ink))] transition-colors duration-200 hover:bg-[hsl(var(--rule))]/40"
          >
            Dashboard
          </Link>
        )}
        {handle && !atOwnPublicPage && (
          <Link
            href={`/${handle}`}
            className="block rounded-xl px-3 py-2 text-[13px] text-[hsl(var(--ink))] transition-colors duration-200 hover:bg-[hsl(var(--rule))]/40"
          >
            View public page
          </Link>
        )}
        {!atSettings && (
          <Link
            href="/dashboard/settings"
            className="block rounded-xl px-3 py-2 text-[13px] text-[hsl(var(--ink))] transition-colors duration-200 hover:bg-[hsl(var(--rule))]/40"
          >
            Settings
          </Link>
        )}
        <div className="mx-2 my-1 h-px bg-[hsl(var(--rule))]" />
        <button
          type="button"
          onClick={() => {
            signOut();
            window.location.href = "/";
          }}
          className="block w-full rounded-xl px-3 py-2 text-left text-[13px] text-[hsl(var(--ink-muted))] transition-colors duration-200 hover:bg-[hsl(var(--rule))]/40 hover:text-[hsl(var(--ink))]"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
