import { motion, AnimatePresence, type HTMLMotionProps } from "framer-motion";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Copy, Check } from "lucide-react";
import { EASE } from "@/components/motion";
import { CelebrationBurst } from "@/components/CelebrationBurst";
import { useProfile } from "../../store/session";
import { useReceived } from "../../store/requests";
import { Card } from "../../ui/Card";
import { Link, useRouter } from "../../router";
import { Button } from "../../ui/Button";
import { useToast } from "../../ui/Toast";
import { formatMoney } from "../../store/format";
import { AnimatedStat } from "../../ui/AnimatedStat";
import { CardSkeleton, ScreenError } from "../../ui/ScreenStates";
import { cn } from "@/lib/utils";

/**
 * Overview — the owner's command center.
 *
 * The first question on opening the dashboard is not "what
 * does my page look like?" — it is "what needs me right now?".
 * The only thing that actually costs the owner money if
 * ignored is a pending request (amount held, reply
 * window counting down). So the hero answers that question
 * first, the stats fill in the financial and deadline
 * picture, and the public link sits at the bottom — always
 * one tap away, never the headline.
 *
 * No recent-activity feed: that duplicates the Received tab.
 * No page-status card: the link section implies the page is
 * live; a paused page swaps the hero for a calm "paused"
 * state with a resume action.
 */
const MS_PER_HOUR = 60 * 60 * 1000;

export function Overview() {
  const profile = useProfile();
  const received = useReceived();
  const { path, search, navigate } = useRouter();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  // Welcome overlay — celebrates the first-ever live moment.
  // Runs when we land on /dashboard with ?welcome=1
  useEffect(() => {
    if (path !== "/dashboard") return;
    const params = new URLSearchParams(search);
    if (params.get("welcome") === "1") {
      setShowWelcome(true);
      navigate("/dashboard", { replace: true });
    }
  }, [path, search, navigate]);

  // ─── Loading / error state ─────────────────────────────────────
  // TODO: wire to backend — set `loading` to `true` while the
  // dashboard data fetch is in flight; set `error` to the caught
  // error message if it fails.
  const loading = false;
  const error: string | null = null;

  const inbox = useMemo(
    () =>
      profile
        ? received.filter(
            (r) => r.toHandle.toLowerCase() === profile.handle.toLowerCase(),
          )
        : [],
    [received, profile],
  );
  const pending = useMemo(() => inbox.filter((r) => r.status === "pending"), [inbox]);

  // Held — total amount held across pending requests.
  const inEscrowCents = useMemo(() => pending.reduce((sum, r) => sum + r.amountCents, 0), [pending]);

  // Expiring within 24 hours — the real deadline pressure.
  const expiringSoon = useMemo(() => {
    const now = Date.now();
    return pending.filter((r) => {
      const expiresAt = new Date(r.expiresAt).getTime();
      return expiresAt - now < 24 * MS_PER_HOUR;
    });
  }, [pending]);

  // Released this month — net of the 5% platform fee.
  const releasedThisMonth = useMemo(() => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    return inbox.filter((r) => {
      if (r.status !== "replied" || !r.reply) return false;
      return new Date(r.reply.repliedAt).getTime() >= startOfMonth.getTime();
    });
  }, [inbox]);
  const releasedCents = useMemo(
    () => releasedThisMonth.reduce((sum, r) => sum + r.amountCents - (r.escrow.feeCents ?? 0), 0),
    [releasedThisMonth],
  );

  // Total earned — cumulative net (after fee) of every reply since joining.
  const totalEarnedCents = useMemo(
    () =>
      inbox
        .filter((r) => r.status === "replied" && r.reply)
        .reduce((sum, r) => sum + r.amountCents - (r.escrow.feeCents ?? 0), 0),
    [inbox],
  );

  if (!profile) return null;

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-12">
          <div className="px-7 py-9 md:px-9 md:py-10">
            <CardSkeleton rows={2} />
          </div>
        </Card>
        {[0, 1, 2].map((i) => (
          <Card key={i} className="lg:col-span-4">
            <div className="px-7 py-7 md:px-9 md:py-8">
              <CardSkeleton rows={1} />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <ScreenError
          title="Couldn't load your dashboard."
          message={error}
          onRetry={() => window.location.reload()}
        />
      </Card>
    );
  }

  const link = `reachme.com/${profile.handle}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${link}`);
      setCopied(true);
      toast.show("Link copied.", link);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.show("Couldn't copy. Try again.");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* ── Hero: only when no pending requests ── */}
      {pending.length === 0 && (
        <Card className="lg:col-span-12">
          <div className="px-7 py-9 md:px-9 md:py-10">
            {profile.visibility === "paused" ? (
              <PausedHero onResume={() => navigate("/dashboard/page")} />
            ) : inbox.length > 0 ? (
              <CalmHero />
            ) : (
              <FreshHero />
            )}
          </div>
        </Card>
      )}

      {/* ── People: who's waiting ── */}
      {pending.length > 0 && (
        <>
          <Card className="lg:col-span-6">
            <div className="px-7 py-7 md:px-9 md:py-8">
              <Stat
                label="Pending"
                value={pending.length}
                caption={
                  pending.length === 1
                    ? "1 person awaiting your reply."
                    : `${pending.length} people awaiting your reply.`
                }
                action={
                  <Link href="/dashboard/received">
                    <Button size="md" trailingArrow>
                      Review
                    </Button>
                  </Link>
                }
              />
            </div>
          </Card>
          <Card
            className="lg:col-span-6"
            variant={expiringSoon.length > 0 ? "urgent" : "default"}
          >
            <div className="px-7 py-7 md:px-9 md:py-8">
              <Stat
                label="Expiring soon"
                value={expiringSoon.length}
                caption={
                  expiringSoon.length === 0
                    ? "Nothing within 24 hours."
                    : expiringSoon.length === 1
                      ? "1 request expiring within 24 hours."
                      : `${expiringSoon.length} requests expiring within 24 hours.`
                }
                dark={expiringSoon.length > 0}
                action={
                  expiringSoon.length > 0 ? (
                    <Link href="/dashboard/received">
                      <Button size="md" variant="outline" trailingArrow>
                        Reply now
                      </Button>
                    </Link>
                  ) : undefined
                }
              />
            </div>
          </Card>
        </>
      )}

      {/* ── Money: what's at stake ── */}
      <Card className="lg:col-span-4">
        <div className="px-7 py-7 md:px-9 md:py-8">
          <Stat
            label="In escrow"
            value={formatMoney(inEscrowCents, { withCents: true })}
            caption={
              pending.length === 0
                ? "Nothing in escrow."
                : `${pending.length} ${pending.length === 1 ? "request" : "requests"} in escrow.`
            }
          />
        </div>
      </Card>
      <Card className="lg:col-span-4">
        <div className="px-7 py-7 md:px-9 md:py-8">
          <Stat
            label="Released this month"
            value={formatMoney(releasedCents, { withCents: true })}
            caption={
              releasedThisMonth.length === 0
                ? "No replies yet."
                : `${releasedThisMonth.length} ${releasedThisMonth.length === 1 ? "reply" : "replies"} this month.`
            }
          />
        </div>
      </Card>
      <Card className="lg:col-span-4">
        <div className="px-7 py-7 md:px-9 md:py-8">
          <Stat
            label="Lifetime"
            value={formatMoney(totalEarnedCents, { withCents: true })}
            caption="Net of platform fee."
          />
        </div>
      </Card>

      {/* ── Your link — always one tap away, never the headline ── */}
      <Card className="lg:col-span-12">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-4 px-7 py-6 md:px-9">
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
              Your link
            </p>
            <p className="mt-1.5 truncate text-[15px] text-[hsl(var(--ink))]">
              {link}
            </p>
          </div>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] px-4 py-2 text-[12.5px] font-medium text-[hsl(var(--ink))] transition-colors duration-300 hover:border-[hsl(var(--ink))]"
          >
            {copied ? (
              <Check size={12} strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <Copy size={12} strokeWidth={1.6} aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
          <Link
            href={`/${profile.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full bg-[hsl(var(--ink))] px-4 py-2 text-[12.5px] font-medium text-[hsl(var(--page))] transition-colors duration-300 hover:bg-[hsl(var(--ink))]/92"
          >
            View live
          </Link>
        </div>
      </Card>

      <AnimatePresence>
        {showWelcome && (
          <WelcomeOverlay
            onDismiss={() => setShowWelcome(false)}
            displayName={profile.displayName}
            link={link}
            onView={() => navigate(`/${profile.handle}`)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Hero variants ─────────────────────────────────────────────

function CalmHero() {
  return (
    <div>
      <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
        Inbox clear
      </p>
      <p
        className="mt-5 font-serif text-[hsl(var(--ink))]"
        style={{
          fontSize: "clamp(1.9rem, 3.8vw, 2.8rem)",
          fontWeight: 500,
          letterSpacing: "-0.03em",
          lineHeight: 1.15,
          textWrap: "balance",
        }}
      >
        Nothing needs you right now.
      </p>
      <p className="mt-3 max-w-[52ch] text-[15px] text-[hsl(var(--ink-muted))]">
        Your inbox is clear. When someone serious reaches out,
        you'll know.
      </p>
    </div>
  );
}

function FreshHero() {
  return (
    <div>
      <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
        Ready
      </p>
      <p
        className="mt-5 font-serif text-[hsl(var(--ink))]"
        style={{
          fontSize: "clamp(1.9rem, 3.8vw, 2.8rem)",
          fontWeight: 500,
          letterSpacing: "-0.03em",
          lineHeight: 1.15,
          textWrap: "balance",
        }}
      >
        You're live.
      </p>
      <p className="mt-3 max-w-[52ch] text-[15px] text-[hsl(var(--ink-muted))]">
        Share your link where the right people will find it. The
        first request is always the hardest — after that, momentum.
      </p>
    </div>
  );
}

function PausedHero({ onResume }: { onResume: () => void }) {
  return (
    <div>
      <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
        Page status
      </p>
      <p
        className="mt-5 font-serif text-[hsl(var(--ink))]"
        style={{
          fontSize: "clamp(1.9rem, 3.8vw, 2.8rem)",
          fontWeight: 500,
          letterSpacing: "-0.03em",
          lineHeight: 1.15,
          textWrap: "balance",
        }}
      >
        Your page is paused.
      </p>
      <p className="mt-3 max-w-[52ch] text-[15px] text-[hsl(var(--ink-muted))]">
        No new requests can reach you. Anything already held is
        still waiting on your reply.
      </p>
      <div className="mt-7">
        <Button onClick={onResume} size="md" trailingArrow>
          Resume page
        </Button>
      </div>
    </div>
  );
}

// ─── Stat ──────────────────────────────────────────────────────

function Stat({
  label,
  value,
  caption,
  action,
  dark = false,
}: {
  label: string;
  value: number | string;
  caption: string;
  action?: ReactNode;
  dark?: boolean;
}) {
  const captionClass = cn(
    "text-[12.5px] leading-[1.55]",
    dark ? "text-[hsl(var(--page))]/60" : "text-[hsl(var(--ink-muted))]",
  );
  return (
    <div>
      <p className={cn(
        "text-[10.5px] font-medium uppercase tracking-[0.22em]",
        dark ? "text-[hsl(var(--page))]/50" : "text-[hsl(var(--ink-subtle))]",
      )}>
        {label}
      </p>
      <AnimatedStat
        value={value}
        className={cn(
          "mt-4 font-serif",
          dark ? "text-[hsl(var(--page))]" : "text-[hsl(var(--ink))]",
        )}
        style={{
          fontSize: "clamp(1.9rem, 3.4vw, 2.3rem)",
          fontWeight: 500,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          fontVariantNumeric: "tabular-nums",
        }}
      />
      {action != null ? (
        <div className="mt-3.5 flex items-center justify-between gap-4">
          <p className={captionClass}>{caption}</p>
          {action}
        </div>
      ) : (
        <p className={cn("mt-3.5", captionClass)}>{caption}</p>
      )}
    </div>
  );
}

// ─── Welcome overlay (unchanged) ───────────────────────────────

function WelcomeOverlay({
  onDismiss,
  displayName,
  link,
  onView,
}: {
  onDismiss: () => void;
  displayName: string;
  link: string;
  onView: () => void;
}) {
  return (
    <motion.div
      {...({
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.3, ease: EASE },
      } as HTMLMotionProps<"div">)}
      className="fixed inset-0 z-[80] flex items-center justify-center px-4"
    >
      <div
        className="absolute inset-0 bg-[hsl(var(--page))]/80 backdrop-blur-md"
        onClick={onDismiss}
        aria-hidden="true"
      />
      <motion.div
        {...({
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: 6 },
          transition: { duration: 0.4, ease: EASE },
        } as HTMLMotionProps<"div">)}
        className="relative w-full max-w-[560px] rounded-3xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] px-8 py-10 text-center sm:px-12 sm:py-14"
      >
        <CelebrationBurst autoPlay />
        <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
          You're live
        </p>
        <h2
          className="mt-5 font-serif text-[hsl(var(--ink))]"
          style={{
            fontSize: "clamp(2rem, 5vw, 3.4rem)",
            fontWeight: 500,
            letterSpacing: "-0.04em",
            lineHeight: 1.02,
            textWrap: "balance",
          }}
        >
          Welcome,{" "}
          <span className="italic text-[hsl(var(--ink-subtle))]">
            {displayName.split(" ")[0]}
          </span>
          .
        </h2>
        <p className="mx-auto mt-5 max-w-[44ch] text-[hsl(var(--ink-muted))]">
          Your page is live at{" "}
          <span className="text-[hsl(var(--ink))]">{link}</span>. Share it where
          the right people will find it.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={onView} size="lg" trailingArrow>
            View my public page
          </Button>
          <Button onClick={onDismiss} size="lg" variant="ghost">
            Stay on dashboard
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
