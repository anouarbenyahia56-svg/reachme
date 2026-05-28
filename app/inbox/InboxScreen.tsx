"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Copy, Loader2 } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { GhostButton } from "@/components/Button";
import { EASE } from "@/components/layout";
import { CATEGORY_LABELS, type RequestItem } from "@/lib/domain";
import { useSession, useStore } from "@/lib/session";

/**
 * Inbox — the owner's command surface.
 *
 * Three states, all on the same canvas:
 *   • Loading    — calm spinner, no flicker
 *   • Empty      — quiet "your page is live" card with a copy-link
 *                  affordance; meant to feel like a desk waiting for mail
 *   • Populated  — list of incoming requests with detail-on-select
 *
 * Day one will mostly be the empty state. We design it to feel like
 * a place built for someone serious — not a checklist, not a tour,
 * not a "complete your setup" sidebar.
 */
export function InboxScreen() {
  const router = useRouter();
  const session = useSession();
  const { store } = useStore();
  const reduced = useReducedMotion();

  // Auth gate. If the session is anonymous, route to /login. We do
  // this client-side because the store is local; when the real backend
  // arrives this becomes a server-side redirect via middleware.
  useEffect(() => {
    if (session.status === "anonymous") {
      router.replace("/login");
    }
  }, [session.status, router]);

  const handle =
    session.status === "authenticated" ? session.session.handle : null;

  const [items, setItems] = useState<RequestItem[] | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!handle) return;
    const list = await store.listRequestsFor(handle);
    setItems(list);
    if (list.length > 0 && !selectedId) {
      const firstPending = list.find((r) => r.status === "pending");
      setSelectedId(firstPending?.id ?? list[0]?.id ?? null);
    }
  }, [handle, store, selectedId]);

  useEffect(() => {
    if (handle) void refresh();
  }, [handle, refresh]);

  const selected = useMemo(
    () => items?.find((r) => r.id === selectedId) ?? null,
    [items, selectedId],
  );

  if (session.status !== "authenticated") {
    return (
      <>
        <AppNav />
        <main className="min-h-screen bg-[hsl(var(--page))]">
          <div className="mx-auto flex max-w-[640px] items-center gap-3 px-6 pt-44 text-[hsl(var(--ink-muted))]">
            <Loader2
              size={16}
              strokeWidth={1.6}
              aria-hidden="true"
              className="animate-spin"
            />
            <span style={{ fontSize: "0.95rem", fontStyle: "italic" }}>
              Loading…
            </span>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AppNav />
      <motion.main
        initial={
          reduced
            ? { opacity: 1 }
            : { opacity: 0, y: 8, filter: "blur(6px)" }
        }
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: EASE }}
        className="min-h-screen bg-[hsl(var(--page))] text-[hsl(var(--ink))]"
      >
        <div className="mx-auto w-full max-w-[1180px] px-6 pb-32 pt-32 md:px-10 md:pt-36">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div>
              <p
                className="text-[hsl(var(--ink-muted))]"
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 500,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                }}
              >
                Inbox
              </p>
              <h1
                className="mt-3 font-serif text-[hsl(var(--ink))]"
                style={{
                  fontSize: "clamp(2.4rem, 5vw, 3.8rem)",
                  fontWeight: 500,
                  lineHeight: 1.04,
                  letterSpacing: "-0.035em",
                }}
              >
                What’s reaching you.
              </h1>
            </div>
            <div className="flex items-center gap-5">
              <Link
                href={`/${handle}`}
                className="text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
                style={{ fontSize: "0.92rem" }}
              >
                Edit your page
              </Link>
            </div>
          </div>

          {items === undefined ? (
            <LoadingRow />
          ) : items.length === 0 ? (
            <EmptyState handle={handle!} />
          ) : (
            <div className="grid grid-cols-1 gap-x-12 lg:grid-cols-12">
              <aside className="lg:col-span-5">
                <RequestList
                  items={items}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              </aside>
              <section className="mt-10 lg:col-span-7 lg:mt-0">
                {selected ? (
                  <RequestDetail
                    item={selected}
                    onUpdate={async (id, patch) => {
                      await store.updateRequest(id, patch);
                      await refresh();
                    }}
                  />
                ) : (
                  <p
                    className="text-[hsl(var(--ink-muted))]"
                    style={{
                      fontSize: "0.95rem",
                      fontStyle: "italic",
                      letterSpacing: "-0.005em",
                    }}
                  >
                    Select a request to read it.
                  </p>
                )}
              </section>
            </div>
          )}
        </div>
      </motion.main>
    </>
  );
}

// ─── Loading ──────────────────────────────────────────────────────────────

function LoadingRow() {
  return (
    <div className="flex items-center gap-3 text-[hsl(var(--ink-muted))]">
      <Loader2
        size={14}
        strokeWidth={1.6}
        aria-hidden="true"
        className="animate-spin"
      />
      <span style={{ fontSize: "0.92rem", fontStyle: "italic" }}>
        Loading…
      </span>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────

function EmptyState({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false);
  const reduced = useReducedMotion();
  const url = `https://reachme.com/${handle}`;

  return (
    <motion.div
      initial={
        reduced
          ? { opacity: 1 }
          : { opacity: 0, y: 16, filter: "blur(8px)" }
      }
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.85, ease: EASE }}
      className="max-w-[640px]"
    >
      <p
        className="font-serif italic text-[hsl(var(--ink))]"
        style={{
          fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
          lineHeight: 1.3,
          letterSpacing: "-0.02em",
          fontWeight: 400,
          textWrap: "balance",
        }}
      >
        Nothing yet.
      </p>
      <p
        className="mt-5 max-w-[44ch] text-[hsl(var(--ink-muted))]"
        style={{ fontSize: "1.05rem", lineHeight: 1.55 }}
      >
        Your page is live. The first serious request will arrive when
        someone who matters has something to say.
      </p>

      <div className="mt-12 border-t border-[hsl(var(--rule))] pt-8">
        <p
          className="text-[hsl(var(--ink-muted))]"
          style={{
            fontSize: "0.7rem",
            fontWeight: 500,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
          }}
        >
          Your page
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link
            href={`/${handle}`}
            className="font-serif text-[hsl(var(--ink))] transition-colors duration-300 hover:text-[hsl(var(--ink-muted))]"
            style={{
              fontSize: "1.4rem",
              fontWeight: 500,
              letterSpacing: "-0.02em",
            }}
          >
            reachme.com/{handle}
          </Link>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {
                // Clipboard may be blocked; silently no-op.
              }
            }}
            className="inline-flex items-center gap-2 text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
            style={{ fontSize: "0.85rem", letterSpacing: "-0.005em" }}
            aria-label="Copy page link"
          >
            {copied ? (
              <>
                <Check size={13} strokeWidth={1.8} aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy size={13} strokeWidth={1.6} aria-hidden="true" />
                Copy link
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Request list ─────────────────────────────────────────────────────────

function RequestList({
  items,
  selectedId,
  onSelect,
}: {
  items: RequestItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="divide-y divide-[hsl(var(--rule))] border-y border-[hsl(var(--rule))]">
      {items.map((item) => {
        const active = item.id === selectedId;
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              aria-current={active ? "true" : undefined}
              className={
                "block w-full py-6 text-left transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] " +
                (active
                  ? "text-[hsl(var(--ink))]"
                  : "text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--ink))]")
              }
            >
              <div className="flex items-baseline justify-between gap-4">
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 500,
                    letterSpacing: "0.24em",
                    textTransform: "uppercase",
                  }}
                >
                  {CATEGORY_LABELS[item.category]}
                </span>
                <span
                  className="font-serif text-[hsl(var(--ink))]"
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 500,
                    fontVariantNumeric: "lining-nums tabular-nums",
                    letterSpacing: "-0.01em",
                  }}
                >
                  ${item.amount}
                </span>
              </div>
              <p
                className="mt-2 truncate font-serif"
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.3,
                }}
              >
                {item.subject}
              </p>
              <p
                className="mt-1 truncate text-[hsl(var(--ink-muted))]"
                style={{ fontSize: "0.92rem", letterSpacing: "-0.005em" }}
              >
                {item.senderName}
                <span aria-hidden="true"> · </span>
                <StatusTag status={item.status} />
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function StatusTag({ status }: { status: RequestItem["status"] }) {
  const label = {
    pending: "Awaiting reply",
    replied: "Replied",
    declined: "Declined",
    expired: "Expired",
  }[status];
  return (
    <span
      style={{
        fontSize: "0.78rem",
        fontStyle: "italic",
        letterSpacing: "-0.005em",
      }}
    >
      {label}
    </span>
  );
}

// ─── Request detail ───────────────────────────────────────────────────────

function RequestDetail({
  item,
  onUpdate,
}: {
  item: RequestItem;
  onUpdate: (
    id: string,
    patch: Partial<Pick<RequestItem, "status" | "reply" | "repliedAt">>,
  ) => Promise<void>;
}) {
  const [reply, setReply] = useState(item.reply ?? "");
  const [submitting, setSubmitting] = useState<"reply" | "decline" | null>(
    null,
  );

  // When switching between requests, reset the local reply state.
  useEffect(() => {
    setReply(item.reply ?? "");
  }, [item.id, item.reply]);

  const isPending = item.status === "pending";

  return (
    <article>
      <header className="border-b border-[hsl(var(--rule))] pb-8">
        <p
          className="text-[hsl(var(--ink-muted))]"
          style={{
            fontSize: "0.7rem",
            fontWeight: 500,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
          }}
        >
          {CATEGORY_LABELS[item.category]} · ${item.amount}
        </p>
        <h2
          className="mt-3 font-serif text-[hsl(var(--ink))]"
          style={{
            fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
            fontWeight: 500,
            lineHeight: 1.15,
            letterSpacing: "-0.025em",
            textWrap: "balance",
          }}
        >
          {item.subject}
        </h2>
        <p
          className="mt-3 text-[hsl(var(--ink-muted))]"
          style={{ fontSize: "0.95rem", letterSpacing: "-0.005em" }}
        >
          From{" "}
          <span className="text-[hsl(var(--ink))]">{item.senderName}</span>
          <span aria-hidden="true"> · </span>
          <a
            href={`mailto:${item.senderEmail}`}
            className="underline-offset-2 transition-colors duration-300 hover:text-[hsl(var(--ink))]"
          >
            {item.senderEmail}
          </a>
        </p>
      </header>

      <div className="prose-clean mt-8 max-w-[60ch]">
        <p
          className="whitespace-pre-line text-[hsl(var(--ink))]"
          style={{
            fontSize: "1.05rem",
            lineHeight: 1.65,
            letterSpacing: "-0.005em",
          }}
        >
          {item.message}
        </p>
      </div>

      {isPending ? (
        <div className="mt-12 max-w-[60ch] border-t border-[hsl(var(--rule))] pt-8">
          <p
            className="text-[hsl(var(--ink-muted))]"
            style={{
              fontSize: "0.7rem",
              fontWeight: 500,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
            }}
          >
            Your reply
          </p>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Reply directly. Keep it short — they sent something specific."
            rows={5}
            className="mt-4 block w-full resize-y border-0 border-b border-[hsl(var(--rule-strong))] bg-transparent px-0 py-3 text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-subtle))] outline-none transition-[border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[hsl(var(--ink-muted))] focus:border-[hsl(var(--ink))]"
            style={{
              fontSize: "max(16px, 1.05rem)",
              lineHeight: 1.6,
              letterSpacing: "-0.005em",
            }}
          />
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <button
              type="button"
              disabled={submitting !== null || !reply.trim()}
              onClick={async () => {
                setSubmitting("reply");
                try {
                  await onUpdate(item.id, {
                    status: "replied",
                    reply: reply.trim(),
                    repliedAt: new Date().toISOString(),
                  });
                } finally {
                  setSubmitting(null);
                }
              }}
              className="inline-flex items-center gap-2.5 rounded-full bg-[hsl(var(--ink))] px-7 py-3.5 text-[0.95rem] font-medium text-[hsl(var(--page))] transition-[transform,background-color,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[hsl(var(--ink))]/92 disabled:opacity-50"
            >
              {submitting === "reply"
                ? "Sending…"
                : `Reply & release $${item.amount}`}
            </button>
            <button
              type="button"
              disabled={submitting !== null}
              onClick={async () => {
                setSubmitting("decline");
                try {
                  await onUpdate(item.id, { status: "declined" });
                } finally {
                  setSubmitting(null);
                }
              }}
              className="text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
              style={{ fontSize: "0.92rem", letterSpacing: "-0.005em" }}
            >
              Decline & refund
            </button>
          </div>
          <p
            className="mt-4 text-[hsl(var(--ink-muted))]"
            style={{
              fontSize: "0.78rem",
              fontStyle: "italic",
              letterSpacing: "-0.005em",
            }}
          >
            Replying releases the held funds. Declining refunds them.
          </p>
        </div>
      ) : item.status === "replied" ? (
        <div className="mt-12 max-w-[60ch] border-t border-[hsl(var(--rule))] pt-8">
          <p
            className="text-[hsl(var(--ink-muted))]"
            style={{
              fontSize: "0.7rem",
              fontWeight: 500,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
            }}
          >
            You replied
          </p>
          <p
            className="mt-4 whitespace-pre-line text-[hsl(var(--ink))]"
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.65,
              letterSpacing: "-0.005em",
            }}
          >
            {item.reply}
          </p>
        </div>
      ) : (
        <div className="mt-12 max-w-[60ch] border-t border-[hsl(var(--rule))] pt-8">
          <p
            className="text-[hsl(var(--ink-muted))]"
            style={{
              fontSize: "0.95rem",
              fontStyle: "italic",
              letterSpacing: "-0.005em",
            }}
          >
            {item.status === "declined"
              ? `${item.senderName} was refunded.`
              : `Request expired and was refunded.`}
          </p>
        </div>
      )}

      <div className="mt-10">
        <GhostButton type="button" onClick={() => history.back()}>
          ← Back to all
        </GhostButton>
      </div>
    </article>
  );
}
