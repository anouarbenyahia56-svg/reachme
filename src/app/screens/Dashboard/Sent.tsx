import { useMemo, useState } from "react";
import { Search, Send } from "lucide-react";
import { Card } from "../../ui/Card";
import { Pill } from "../../ui/Pill";
import { EmptyState } from "../../ui/EmptyState";
import { useSent } from "../../store/requests";
import { Avatar } from "../../ui/Avatar";
import { Link } from "../../router";
import { formatMoney, timeAgo } from "../../store/format";
import type { RequestStatus } from "../../types";
import { cn } from "@/lib/utils";
import { CardSkeleton, ScreenError } from "../../ui/ScreenStates";

const FILTERS: ReadonlyArray<{ id: RequestStatus | "all"; label: string }> = [
  { id: "pending", label: "Pending" },
  { id: "replied", label: "Replied" },
  { id: "expired", label: "Expired" },
  { id: "all", label: "All" },
];

/**
 * Sent — outbox for requests this account has sent. Mirrors the
 * received view in shape, but the framing is different: each row
 * is the owner (not the sender), and the helpful label below
 * the status describes what's happening to the sender's money.
 */
export function Sent() {
  const all = useSent();
  const [filter, setFilter] = useState<RequestStatus | "all">("pending");
  const [query, setQuery] = useState("");

  // TODO: wire to backend — set `loading` to `true` while the
  // sent requests fetch is in flight; set `error` to the caught error.
  const loading = false;
  const error: string | null = null;

  const counts = useMemo(() => {
    const out: Record<string, number> = {
      all: all.length,
      pending: 0,
      replied: 0,
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
          r.toHandle.toLowerCase().includes(q) ||
          r.message.toLowerCase().includes(q),
      );
    }
    return list;
  }, [all, filter, query]);

  if (loading) {
    return (
      <Card>
        <div className="px-7 py-5 md:px-9">
          <CardSkeleton rows={5} />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <ScreenError
          title="Couldn't load sent requests."
          message={error}
          onRetry={() => window.location.reload()}
        />
      </Card>
    );
  }

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
            type="text"
            placeholder="Search by name, subject, or message"
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
          {visible.map((r) => (
            <li
              key={r.id}
              className="border-b border-[hsl(var(--rule))] last:border-b-0"
            >
              <Link
                href={`/dashboard/sent/${r.id}`}
                className="group flex items-center gap-4 px-7 py-5 transition-colors duration-300 hover:bg-[hsl(var(--rule))]/50 md:px-9"
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
                  <StatusPill status={r.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function moneyState(r: import("../../types").RequestRecord): string {
  if (r.status === "pending") return "Held — awaiting reply";
  if (r.status === "replied") return `Released to ${r.toDisplayName}`;
  return "Refunded to you";
}

function Empty({ filter }: { filter: string }) {
  const messages: Record<string, { title: string; body: string }> = {
    pending: {
      title: "No requests waiting on a reply.",
      body: "Requests you send appear here while they wait for a reply.",
    },
    replied: {
      title: "No replies received yet.",
      body: "When an owner replies, their response appears here.",
    },
    expired: {
      title: "Nothing expired.",
      body: "Requests that pass the reply window without a response expire and refund to you automatically.",
    },
    all: {
      title: "No sent requests yet.",
      body: "When you send a request, it'll show up here.",
    },
  };
  const m = messages[filter] ?? messages.all;
  return (
    <EmptyState
      icon={Send}
      title={m.title}
      body={m.body}
    />
  );
}

function StatusPill({
  status,
}: {
  status: "pending" | "replied" | "expired";
}) {
  if (status === "pending") return <Pill size="sm" tone="ink">Pending</Pill>;
  if (status === "replied") return <Pill size="sm">Replied</Pill>;
  return <Pill size="sm" tone="muted">Expired</Pill>;
}
