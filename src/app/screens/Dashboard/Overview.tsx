import { motion, AnimatePresence, type HTMLMotionProps } from "framer-motion";
import { useEffect, useState } from "react";
import { Copy, Check, ArrowUpRight, Inbox } from "lucide-react";
import { EASE } from "@/components/motion";
import { useProfile } from "../../store/session";
import { useReceived, useSent } from "../../store/requests";
import { Card } from "../../ui/Card";
import { Pill, StatusDot } from "../../ui/Pill";
import { Link, useRouter } from "../../router";
import { Button } from "../../ui/Button";
import { useToast } from "../../ui/Toast";
import { formatMoney, timeAgo } from "../../store/format";
import { Avatar } from "../../ui/Avatar";

/**
 * Overview — what greets the owner every visit. Page status,
 * shareable link, and the day's pulse: pending requests, this
 * week's signal, recent activity.
 */
export function Overview() {
  const profile = useProfile();
  const received = useReceived();
  const sent = useSent();
  const { navigate } = useRouter();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  // Welcome overlay — celebrates the first-ever live moment.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("welcome") === "1") {
      setShowWelcome(true);
      // Strip the query so it doesn't re-fire on refresh.
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  if (!profile) return null;

  const inbox = received.filter(
    (r) => r.toHandle.toLowerCase() === profile.handle.toLowerCase(),
  );
  const pending = inbox.filter((r) => r.status === "pending");
  const repliedThisWeek = inbox.filter((r) => {
    if (r.status !== "replied") return false;
    if (!r.reply) return false;
    return Date.now() - new Date(r.reply.repliedAt).getTime() < 7 * 24 * 60 * 60 * 1000;
  });
  const earnings = repliedThisWeek.reduce(
    (sum, r) => sum + r.amountCents - (r.escrow.feeCents ?? 0),
    0,
  );

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
      <Card className="overflow-hidden lg:col-span-8">
        <div className="px-7 pt-7 md:px-9 md:pt-9">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
                Page status
              </p>
              <h2
                className="mt-2 font-serif text-[hsl(var(--ink))]"
                style={{
                  fontSize: "clamp(1.6rem, 2.6vw, 2.2rem)",
                  fontWeight: 500,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  fontOpticalSizing: "auto",
                }}
              >
                {profile.visibility === "paused"
                  ? "Your page is paused."
                  : "Your ReachMe page is live."}
              </h2>
              <p className="mt-3 max-w-[52ch] text-[hsl(var(--ink-muted))]">
                {profile.visibility === "paused"
                  ? "It's still visible, but no one can submit a request right now."
                  : profile.visibility === "link-only"
                    ? "Reachable by anyone who has your link, but not searchable."
                    : "People can reach you when their request meets your rules."}
              </p>
            </div>
            <StatusDot
              tone={profile.visibility === "paused" ? "paused" : "live"}
            >
              {profile.visibility === "paused"
                ? "Paused"
                : profile.visibility === "link-only"
                  ? "Link only"
                  : "Public"}
            </StatusDot>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3 rounded-2xl border border-[hsl(var(--rule))] bg-[hsl(var(--page))] px-5 py-4">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
              Public link
            </p>
            <p className="flex-1 truncate text-[14px] text-[hsl(var(--ink))]">
              {link}
            </p>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] px-3 py-1.5 text-[12px] font-medium text-[hsl(var(--ink))] transition-colors hover:border-[hsl(var(--ink))]"
            >
              {copied ? (
                <Check size={11} strokeWidth={1.8} aria-hidden="true" />
              ) : (
                <Copy size={11} strokeWidth={1.6} aria-hidden="true" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 pb-7 md:pb-9">
            <Link
              href={`/${profile.handle}`}
              className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--ink))] px-5 py-2.5 text-[13.5px] font-medium text-[hsl(var(--page))] transition-colors duration-300 hover:bg-[hsl(var(--ink))]/92"
            >
              View public page
              <ArrowUpRight size={13} strokeWidth={1.6} aria-hidden="true" />
            </Link>
            <Link
              href="/dashboard/page"
              className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] px-5 py-2.5 text-[13.5px] font-medium text-[hsl(var(--ink))] transition-colors duration-300 hover:border-[hsl(var(--ink))]"
            >
              Edit page
            </Link>
          </div>
        </div>
      </Card>

      <Card className="lg:col-span-4">
        <div className="px-7 pt-7 md:px-9 md:pt-9">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
            This week
          </p>

          <div className="mt-6 space-y-7">
            <Stat
              label="Pending"
              value={pending.length}
              caption={
                pending.length === 0
                  ? "Nothing waiting on you."
                  : pending.length === 1
                    ? "One request needs your attention."
                    : `${pending.length} requests need your attention.`
              }
              actionLabel={pending.length ? "Review" : undefined}
              actionHref="/dashboard/received"
            />
            <Stat
              label="Replied"
              value={repliedThisWeek.length}
              caption="Replies in the last 7 days."
            />
            <Stat
              label="Released"
              value={formatMoney(earnings, { withCents: true })}
              caption="Net of platform fee."
            />
          </div>
          <div className="mt-7 pb-7 md:pb-9" />
        </div>
      </Card>

      <Card className="lg:col-span-12">
        <div className="flex items-end justify-between gap-4 px-7 pt-7 md:px-9 md:pt-9">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
              Recent activity
            </p>
            <h3
              className="mt-2 font-serif text-[hsl(var(--ink))]"
              style={{
                fontSize: "1.35rem",
                fontWeight: 500,
                letterSpacing: "-0.025em",
              }}
            >
              The last things that arrived.
            </h3>
          </div>
          <Link
            href="/dashboard/received"
            className="text-[12.5px] text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
          >
            See all
          </Link>
        </div>

        <div className="px-7 pb-7 pt-6 md:px-9 md:pb-9">
          {inbox.length === 0 ? (
            <EmptyInbox onShare={copy} link={link} />
          ) : (
            <ul className="divide-y divide-[hsl(var(--rule))]">
              {inbox.slice(0, 5).map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/dashboard/received/${r.id}`}
                    className="flex items-center gap-4 py-4 transition-colors duration-300 hover:bg-[hsl(var(--rule))]/30"
                  >
                    <Avatar size="sm" name={r.from.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[14px] font-medium text-[hsl(var(--ink))]">
                          {r.from.name}
                        </p>
                        <span className="text-[12px] text-[hsl(var(--ink-subtle))]">
                          ·
                        </span>
                        <p className="truncate text-[12px] text-[hsl(var(--ink-subtle))]">
                          {timeAgo(r.createdAt)}
                        </p>
                      </div>
                      <p className="truncate text-[13.5px] text-[hsl(var(--ink-muted))]">
                        {r.subject}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Pill size="sm">{formatMoney(r.amountCents)}</Pill>
                      <StatusBadge status={r.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
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

function Stat({
  label,
  value,
  caption,
  actionLabel,
  actionHref,
}: {
  label: string;
  value: number | string;
  caption: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div>
      <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
        {label}
      </p>
      <p
        className="mt-1.5 font-serif text-[hsl(var(--ink))]"
        style={{
          fontSize: "2.1rem",
          fontWeight: 500,
          letterSpacing: "-0.025em",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </p>
      <p className="mt-1.5 text-[12.5px] text-[hsl(var(--ink-muted))]">
        {caption}
      </p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-[hsl(var(--ink))] transition-colors duration-300 hover:text-[hsl(var(--ink))]/80"
        >
          {actionLabel}
          <ArrowUpRight size={11} strokeWidth={1.6} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "pending" | "replied" | "declined" | "expired";
}) {
  const map = {
    pending: { label: "Pending", tone: "ink" as const },
    replied: { label: "Replied", tone: "neutral" as const },
    declined: { label: "Declined", tone: "muted" as const },
    expired: { label: "Expired", tone: "muted" as const },
  };
  const cfg = map[status];
  return (
    <Pill size="sm" tone={cfg.tone}>
      {cfg.label}
    </Pill>
  );
}

function EmptyInbox({
  onShare,
  link,
}: {
  onShare: () => void;
  link: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[hsl(var(--rule-strong))] bg-[hsl(var(--page))] px-6 py-12 text-center">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--surface))] text-[hsl(var(--ink-muted))] ring-1 ring-[hsl(var(--rule))]">
        <Inbox size={18} strokeWidth={1.6} aria-hidden="true" />
      </span>
      <h4
        className="mt-5 font-serif text-[hsl(var(--ink))]"
        style={{
          fontSize: "1.5rem",
          fontWeight: 500,
          letterSpacing: "-0.025em",
        }}
      >
        Nothing yet.
      </h4>
      <p className="mx-auto mt-2 max-w-[44ch] text-[13.5px] text-[hsl(var(--ink-muted))]">
        Share your page where the right people will find it. The amount
        you set filters out the rest.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={onShare} variant="outline" size="sm">
          Copy {link}
        </Button>
      </div>
    </div>
  );
}

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
        transition: { duration: 0.5, ease: EASE },
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
          initial: { opacity: 0, y: 16, filter: "blur(10px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          exit: { opacity: 0, y: 8, filter: "blur(8px)" },
          transition: { duration: 0.85, ease: EASE },
        } as HTMLMotionProps<"div">)}
        className="relative w-full max-w-[560px] rounded-3xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] px-8 py-10 text-center sm:px-12 sm:py-14"
      >
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
