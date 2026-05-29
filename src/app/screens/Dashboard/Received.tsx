import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Inbox, Search } from "lucide-react";
import { EASE } from "@/components/motion";
import { Card } from "../../ui/Card";
import { Pill } from "../../ui/Pill";
import { Reveal } from "../../ui/Reveal";
import { useReceived } from "../../store/requests";
import { useProfile } from "../../store/session";
import { Avatar } from "../../ui/Avatar";
import { Link } from "../../router";
import { formatMoney, timeAgo, timeUntil } from "../../store/format";
import type { ReceivedRequest, RequestStatus } from "../../types";
import { cn } from "@/lib/utils";

const FILTERS: ReadonlyArray<{ id: RequestStatus | "all"; label: string }> = [
  { id: "pending", label: "Pending" },
  { id: "replied", label: "Replied" },
  { id: "declined", label: "Declined" },
  { id: "expired", label: "Expired" },
  { id: "all", label: "All" },
];

/**
 * Received — the actual inbox. Filters across the top, search
 * inline, list below. Each row is a quiet hairline-separated
 * line of metadata. Clicking opens the request detail.
 */
export function Received() {
  const profile = useProfile();
  const all = useReceived();
  const [filter, setFilter] = useState<RequestStatus | "all">("pending");
  const [query, setQuery] = useState("");

  const inbox = useMemo(() => {
    if (!profile) return [] as ReceivedRequest[];
    return all.filter(
      (r) => r.toHandle.toLowerCase() === profile.handle.toLowerCase(),
    );
  }, [all, profile]);

  const counts = useMemo(() => {
    const out: Record<string, number> = {
      all: inbox.length,
      pending: 0,
      replied: 0,
      declined: 0,
      expired: 0,
    };
    inbox.forEach((r) => (out[r.status] = (out[r.status] ?? 0) + 1));
    return out;
  }, [inbox]);

  const visible = useMemo(() => {
    let list = inbox;
    if (filter !== "all") list = list.filter((r) => r.status === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.subject.toLowerCase().includes(q) ||
          r.from.name.toLowerCase().includes(q) ||
          r.message.toLowerCase().includes(q),
      );
    }
    return list;
  }, [inbox, filter, query]);

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 border-b border-[hsl(var(--rule))] px-7 py-5 md:px-9">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            const c = counts[f.id] ?? 0;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors duration-300",
                  active
                    ? "bg-[hsl(var(--ink))] text-[hsl(var(--page))]"
                    : "border border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--ink))] hover:border-[hsl(var(--ink))]",
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[11px] tabular-nums",
                    active
                      ? "bg-[hsl(var(--page))]/20 text-[hsl(var(--page))]"
                      : "bg-[hsl(var(--rule))] text-[hsl(var(--ink-muted))]",
                  )}
                >
                  {c}
                </span>
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex items-center overflow-hidden rounded-full border border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] focus-within:border-[hsl(var(--ink))]">
          <span className="pl-3 text-[hsl(var(--ink-muted))]">
            <Search size={13} strokeWidth={1.6} />
          </span>
          <input
            type="search"
            placeholder="Search subjects, names, messages"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-[260px] bg-transparent px-3 py-2 text-[13px] text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-subtle))] focus:outline-none"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <Empty filter={filter} />
      ) : (
        <ul>
          {visible.map((r, i) => (
            <Row key={r.id} r={r} i={i} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function Row({ r, i }: { r: ReceivedRequest; i: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 6, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, delay: i * 0.04, ease: EASE }}
      className="border-b border-[hsl(var(--rule))] last:border-b-0"
    >
      <Link
        href={`/dashboard/received/${r.id}`}
        className="group flex items-center gap-4 px-7 py-5 transition-colors duration-300 hover:bg-[hsl(var(--rule))]/30 md:px-9"
      >
        <Avatar size="sm" name={r.from.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p
              className={cn(
                "truncate text-[14px]",
                r.status === "pending"
                  ? "font-semibold text-[hsl(var(--ink))]"
                  : "font-medium text-[hsl(var(--ink))]",
              )}
            >
              {r.from.name}
            </p>
            {r.from.organization && (
              <p className="hidden truncate text-[12px] text-[hsl(var(--ink-subtle))] sm:block">
                · {r.from.organization}
              </p>
            )}
            <span className="ml-auto text-[12px] text-[hsl(var(--ink-subtle))]">
              {timeAgo(r.createdAt)}
            </span>
          </div>
          <p
            className={cn(
              "mt-0.5 truncate text-[14px]",
              r.status === "pending"
                ? "text-[hsl(var(--ink))]"
                : "text-[hsl(var(--ink-muted))]",
            )}
          >
            {r.subject}
          </p>
          <p className="mt-0.5 truncate text-[12.5px] text-[hsl(var(--ink-subtle))]">
            {r.message}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Pill size="sm">{formatMoney(r.amountCents)}</Pill>
          <span className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--ink-subtle))]">
            {r.status === "pending"
              ? `Replies ${timeUntil(r.expiresAt)}`
              : r.status === "replied"
                ? "Replied"
                : r.status}
          </span>
        </div>
      </Link>
    </motion.li>
  );
}

function Empty({ filter }: { filter: string }) {
  const messages: Record<string, { title: string; body: string }> = {
    pending: {
      title: "Nothing waiting on you.",
      body: "When a serious request lands, it'll show up here first. We'll email you the moment it does.",
    },
    replied: {
      title: "No replies yet.",
      body: "Replies you've sent will appear here, with the released amount.",
    },
    declined: {
      title: "Nothing declined.",
      body: "Requests you decline land here. Senders are refunded automatically.",
    },
    expired: {
      title: "Nothing expired.",
      body: "Requests left unattended for 7 days expire — and refund — on their own.",
    },
    all: {
      title: "Nothing in your inbox yet.",
      body: "Share your link. The amount you set filters everything else.",
    },
  };
  const m = messages[filter] ?? messages.all;
  return (
    <Reveal>
      <div className="px-7 py-20 text-center md:px-9">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--page))] text-[hsl(var(--ink-muted))] ring-1 ring-[hsl(var(--rule))]">
          <Inbox size={18} strokeWidth={1.6} aria-hidden="true" />
        </span>
        <h3
          className="mt-5 font-serif text-[hsl(var(--ink))]"
          style={{
            fontSize: "1.6rem",
            fontWeight: 500,
            letterSpacing: "-0.025em",
          }}
        >
          {m.title}
        </h3>
        <p className="mx-auto mt-2 max-w-[44ch] text-[13.5px] text-[hsl(var(--ink-muted))]">
          {m.body}
        </p>
      </div>
    </Reveal>
  );
}
