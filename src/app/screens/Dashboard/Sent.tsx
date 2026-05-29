import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Send } from "lucide-react";
import { EASE } from "@/components/motion";
import { Card } from "../../ui/Card";
import { Pill } from "../../ui/Pill";
import { useSent } from "../../store/requests";
import { Avatar } from "../../ui/Avatar";
import { Link } from "../../router";
import { Button } from "../../ui/Button";
import { Reveal } from "../../ui/Reveal";
import { formatMoney, timeAgo, timeUntil } from "../../store/format";
import type { RequestStatus } from "../../types";
import { cn } from "@/lib/utils";

const FILTERS: ReadonlyArray<{ id: RequestStatus | "all"; label: string }> = [
  { id: "pending", label: "Pending" },
  { id: "replied", label: "Replied" },
  { id: "declined", label: "Declined" },
  { id: "expired", label: "Expired" },
  { id: "all", label: "All" },
];

/**
 * Sent — outbox for requests this account has sent. Mirrors the
 * received view in shape, but the framing is different: each row
 * is the recipient (not the sender), and the helpful label below
 * the status describes what's happening to the sender's money.
 */
export function Sent() {
  const all = useSent();
  const [filter, setFilter] = useState<RequestStatus | "all">("pending");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const out: Record<string, number> = {
      all: all.length,
      pending: 0,
      replied: 0,
      declined: 0,
      expired: 0,
    };
    all.forEach((r) => (out[r.status] = (out[r.status] ?? 0) + 1));
    return out;
  }, [all]);

  const visible = useMemo(() => {
    let list = all;
    if (filter !== "all") list = list.filter((r) => r.status === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.subject.toLowerCase().includes(q) ||
          r.toDisplayName.toLowerCase().includes(q) ||
          r.toHandle.toLowerCase().includes(q),
      );
    }
    return list;
  }, [all, filter, query]);

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 border-b border-[hsl(var(--rule))] px-7 py-5 md:px-9">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.id;
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
                  {counts[f.id] ?? 0}
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
            placeholder="Search recipients, subjects"
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
            <motion.li
              key={r.id}
              initial={{ opacity: 0, y: 6, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, delay: i * 0.04, ease: EASE }}
              className="border-b border-[hsl(var(--rule))] last:border-b-0"
            >
              <Link
                href={`/dashboard/sent/${r.id}`}
                className="group flex items-center gap-4 px-7 py-5 transition-colors duration-300 hover:bg-[hsl(var(--rule))]/30 md:px-9"
              >
                <Avatar size="sm" src={r.toAvatarUrl} name={r.toDisplayName} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="truncate text-[14px] font-medium text-[hsl(var(--ink))]">
                      To {r.toDisplayName}
                    </p>
                    <span className="ml-auto text-[12px] text-[hsl(var(--ink-subtle))]">
                      {timeAgo(r.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[14px] text-[hsl(var(--ink-muted))]">
                    {r.subject}
                  </p>
                  <p className="mt-0.5 truncate text-[12.5px] text-[hsl(var(--ink-subtle))]">
                    {moneyState(r)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Pill size="sm">{formatMoney(r.amountCents)}</Pill>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--ink-subtle))]">
                    {r.status === "pending"
                      ? `Refunds ${timeUntil(r.expiresAt)}`
                      : r.status}
                  </span>
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function moneyState(r: import("../../types").RequestRecord): string {
  if (r.status === "pending") return "Held — awaiting reply";
  if (r.status === "replied") return "Released to recipient";
  if (r.status === "declined") return "Refunded to you";
  return "Refunded to you";
}

function Empty({ filter }: { filter: string }) {
  const messages: Record<string, { title: string; body: string }> = {
    pending: {
      title: "No requests waiting on a reply.",
      body: "When you send a request, it'll show up here while it's held.",
    },
    replied: {
      title: "No replies received yet.",
      body: "Replies you receive will appear here, with the recipient's response.",
    },
    declined: {
      title: "Nothing declined.",
      body: "If a recipient declines, the full amount comes back to you here.",
    },
    expired: {
      title: "Nothing expired.",
      body: "If a recipient doesn't reply in 7 days, the request expires and refunds.",
    },
    all: {
      title: "No sent requests yet.",
      body: "Find someone whose attention is worth the effort. Reach out properly.",
    },
  };
  const m = messages[filter] ?? messages.all;
  return (
    <Reveal>
      <div className="px-7 py-20 text-center md:px-9">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--page))] text-[hsl(var(--ink-muted))] ring-1 ring-[hsl(var(--rule))]">
          <Send size={18} strokeWidth={1.6} aria-hidden="true" />
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
        <div className="mt-6">
          <Link
            href="/find"
            className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--ink))] px-5 py-2.5 text-[13.5px] font-medium text-[hsl(var(--page))] transition-colors duration-300 hover:bg-[hsl(var(--ink))]/92"
          >
            Find someone
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
