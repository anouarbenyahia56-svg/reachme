import type { ReactNode } from "react";
import { ArrowLeft, ArrowUp, Check, Clock, Maximize2, Mic, Minimize2, Paperclip, Camera, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE } from "@/components/motion";
import { Card } from "../../ui/Card";
import { Pill } from "../../ui/Pill";
import { Avatar } from "../../ui/Avatar";
import { Button } from "../../ui/Button";
import { Modal } from "../../ui/Modal";
import { Link, useRouter } from "../../router";
import { useReceived, replyToRequest, declineRequest, platformFeeCents } from "../../store/requests";
import {
  dateLong,
  formatMoney,
  timeAgo,
  timeUntil,
} from "../../store/format";
import { useToast } from "../../ui/Toast";
import { useProfile } from "../../store/session";
import { cn } from "@/lib/utils";

/**
 * Request detail — the moment of decision. Sender block at top,
 * full message below, escrow card in the sidebar showing exactly
 * where the money sits. Reply, decline, or do nothing.
 *
 * Reply transforms the page into a conversation view — the
 * sender's message becomes a chat bubble, the reply input
 * appears below it. No modal, no bottom sheet.
 */
export function RequestDetail({ id }: { id: string }) {
  const all = useReceived();
  const profile = useProfile();
  const r = all.find((x) => x.id === id);
  const { navigate } = useRouter();
  const toast = useToast();
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState("");
  const [declineOpen, setDeclineOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!replying) return;
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [replying]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const max = 105; // 5 lines × 21px line-height
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
    el.classList.add("scrollbar-none");
  }, [reply, replying]);

  if (!profile) return null;
  if (!r || r.toHandle.toLowerCase() !== profile.handle.toLowerCase()) {
    return (
      <Card>
        <div className="px-7 py-16 text-center md:px-9">
          <h3
            className="font-serif text-[hsl(var(--ink))]"
            style={{
              fontSize: "1.5rem",
              fontWeight: 500,
              letterSpacing: "-0.025em",
            }}
          >
            That request can't be found.
          </h3>
          <p className="mt-3 text-[hsl(var(--ink-muted))]">
            It may have been removed, or it isn't yours.
          </p>
          <Link
            href="/dashboard/received"
            className="mt-6 inline-flex rounded-full border border-[hsl(var(--rule-strong))] px-5 py-2.5 text-[13px] text-[hsl(var(--ink))] transition-colors hover:border-[hsl(var(--ink))]"
          >
            Back to inbox
          </Link>
        </div>
      </Card>
    );
  }

  const cat = profile.categories.find((c) => c.id === r.category)?.label ?? "—";

  const onSendReply = () => {
    if (!reply.trim()) return;
    if (replyToRequest(r.id, reply.trim())) {
      toast.show(
        "Reply sent.",
        `Released ${formatMoney(r.amountCents - platformFeeCents(r.amountCents))}`,
      );
      setReplying(false);
      setReply("");
    }
  };

  const onDecline = () => {
    if (declineRequest(r.id)) {
      toast.show("Declined.", `Refunded ${formatMoney(r.amountCents)}`);
      setDeclineOpen(false);
    }
  };

  const canSend = reply.trim().length > 0;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => {
            if (replying) {
              setReplying(false);
              setReply("");
            } else {
              navigate("/dashboard/received");
            }
          }}
          className="inline-flex items-center gap-2 text-[12.5px] text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
        >
          <ArrowLeft size={14} strokeWidth={1.6} aria-hidden="true" />
          {replying ? "Back to request" : "Inbox"}
        </button>

        <button
          type="button"
          onClick={() => setFocusMode((v) => !v)}
          aria-pressed={focusMode}
          aria-label={focusMode ? "Exit focus mode" : "Enter focus mode"}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition-colors duration-200",
            focusMode
              ? "border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-[hsl(var(--page))] hover:bg-[hsl(var(--ink))]/90"
              : "border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--ink-muted))] hover:border-[hsl(var(--ink))] hover:text-[hsl(var(--ink))]",
          )}
        >
          {focusMode ? (
            <Minimize2 size={11.5} strokeWidth={1.6} aria-hidden="true" />
          ) : (
            <Maximize2 size={11.5} strokeWidth={1.6} aria-hidden="true" />
          )}
          {focusMode ? "Exit focus" : "Focus mode"}
        </button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <motion.div
          layout
          transition={{ duration: 0.28, ease: EASE }}
          className={cn(
            "flex sticky top-24",
            focusMode ? "lg:col-span-12" : "lg:col-span-8",
            replying ? "h-[calc(100dvh-8rem)]" : "lg:h-[400px]",
          )}
        >
          {replying ? (
            /* ── Conversation view ── */
            <div key="conversation" className="flex min-h-0 flex-1 flex-col">
              {/* Sender's message — scrolls independently */}
              <div className="min-h-0 flex-1 overflow-y-auto scrollbar-none pb-2 pr-2">
                <div className="flex min-h-full flex-col justify-end gap-2.5">
                  <div className="flex items-end gap-2.5">
                    <Avatar size="sm" name={r.from.name} />
                    <div className="max-w-[78%]">
                      <div className="mb-1 flex items-baseline gap-2">
                        <p className="text-[13px] font-medium text-[hsl(var(--ink))]">
                          {r.from.name}
                        </p>
                        {r.from.organization && (
                          <span className="text-[11.5px] text-[hsl(var(--ink-subtle))]">
                            · {r.from.organization}
                          </span>
                        )}
                      </div>
                      <div className="rounded-2xl rounded-tl-md bg-[hsl(var(--page))] px-4 py-3 ring-1 ring-[hsl(var(--rule))]">
                        <p className="text-[13px] font-medium text-[hsl(var(--ink))]">
                          {r.subject}
                        </p>
                        <p
                          className="mt-1.5 whitespace-pre-line text-[hsl(var(--ink))]"
                          style={{ fontSize: "0.92rem", lineHeight: 1.65 }}
                        >
                          {r.message}
                        </p>
                      </div>
                      <p className="mt-1.5 ml-1 text-[10.5px] text-[hsl(var(--ink-subtle))]">
                        {timeAgo(r.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reply input — pinned at bottom */}
              <div className="mt-4 shrink-0">
                <Card>
                  <div className="px-5 py-4">
                    <div className="flex items-end gap-3">
                      {/* Text input — auto-grows with content */}
                      <div className="flex-1 rounded-2xl bg-[hsl(var(--page))] px-4 py-2.5 transition-colors duration-200 focus-within:ring-1 focus-within:ring-[hsl(var(--rule-strong))]">
                        <textarea
                          ref={inputRef}
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              onSendReply();
                            }
                          }}
                          placeholder={`Reply to ${r.from.name.split(" ")[0]}...`}
                          rows={1}
                          className="block w-full resize-none overflow-hidden border-0 bg-transparent text-[14px] leading-[1.5] text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-subtle))] focus:outline-none focus:ring-0"
                        />
                      </div>

                      {/* Action buttons — camera + mic collapse once user starts typing */}
                      <div className="flex items-center gap-0.5 pb-1.5">
                        <ReplyIconBtn icon={<Paperclip size={19} strokeWidth={1.5} />} label="Attach file" />
                        {!reply.trim() && (
                          <>
                            <ReplyIconBtn icon={<Camera size={19} strokeWidth={1.5} />} label="Add photo" />
                            <ReplyIconBtn icon={<Mic size={19} strokeWidth={1.5} />} label="Voice message" />
                          </>
                        )}
                      </div>

                      {/* Send button — appears once the user starts typing */}
                      {reply.trim() && (
                        <div className="pb-1.5">
                          <button
                            type="button"
                            onClick={onSendReply}
                            disabled={!canSend}
                            aria-label="Send reply"
                            className={cn(
                              "inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200",
                              canSend
                                ? "bg-[hsl(var(--ink))] text-[hsl(var(--page))] hover:bg-[hsl(var(--ink))]/90 scale-100"
                                : "bg-[hsl(var(--rule))] text-[hsl(var(--ink-subtle))] cursor-not-allowed scale-95",
                            )}
                          >
                            <ArrowUp size={17} strokeWidth={2.2} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                  <div className="mt-4 flex items-center gap-3">
                    <Button onClick={onSendReply} disabled={!canSend} trailingArrow>
                      Send &amp; release {formatMoney(r.amountCents)}
                    </Button>
                    <Button variant="ghost" onClick={() => { setReplying(false); setReply(""); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Default request view ── */
              <div key="detail" className="flex h-full min-h-0 flex-col">
                <Card className="flex h-full min-h-0 flex-col overflow-hidden">
                  {/* Sender + subject + message — clean, no dividers */}
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-7 pt-7 md:px-9 md:pt-9">
                    {/* Sender header — pinned at top, doesn't scroll */}
                    <div className="shrink-0 pb-8">
                      <div className="flex items-center gap-3">
                        <Avatar size="sm" name={r.from.name} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <p className="text-[14px] font-semibold text-[hsl(var(--ink))]">
                              {r.from.name}
                            </p>
                            {r.from.organization && (
                              <span className="text-[12px] text-[hsl(var(--ink-subtle))]">
                                {r.from.organization}
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] text-[hsl(var(--ink-muted))]">
                            {r.from.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Pill size="sm">{cat}</Pill>
                          <StatusPill status={r.status} />
                        </div>
                      </div>
                    </div>

                    {/* Conversation — scrolls under the pinned header */}
                    <div className="min-h-0 flex-1 overflow-y-auto scrollbar-none pr-2">
                      <div className="space-y-6 pt-1 pb-2">
                        {/* Sender's first message — avatar left, bubble, time below */}
                        <div className="flex items-end gap-2.5">
                          <Avatar size="sm" name={r.from.name} />
                          <div className="max-w-[78%]">
                            <div className="rounded-2xl rounded-tl-md bg-[hsl(var(--page))] px-4 py-3 ring-1 ring-[hsl(var(--rule))]">
                              <p className="text-[13px] font-medium text-[hsl(var(--ink))]">
                                {r.subject}
                              </p>
                              <p
                                className="mt-1.5 whitespace-pre-line text-[hsl(var(--ink))]"
                                style={{ fontSize: "0.95rem", lineHeight: 1.7 }}
                              >
                                {r.message}
                              </p>
                            </div>
                            <p className="mt-1.5 ml-1 text-[10.5px] text-[hsl(var(--ink-subtle))]">
                              {timeAgo(r.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Owner's reply — bubble right, time below */}
                        {r.reply && (
                          <div className="flex items-end justify-end gap-2.5">
                            <div className="max-w-[78%]">
                              <div className="rounded-2xl rounded-tr-md bg-[hsl(var(--ink))] px-4 py-3 text-[hsl(var(--page))]">
                                <p
                                  className="whitespace-pre-line"
                                  style={{ fontSize: "0.95rem", lineHeight: 1.7 }}
                                >
                                  {r.reply.body}
                                </p>
                              </div>
                              <p className="mt-1.5 mr-1 text-right text-[10.5px] text-[hsl(var(--ink-subtle))]">
                                {timeAgo(r.reply.repliedAt)}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Declined — small centered marker, not a bubble */}
                        {r.decline && (
                          <div className="flex justify-center pt-4">
                            <div className="text-center">
                              <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
                                Declined
                              </p>
                              <p className="mt-1 text-[11.5px] text-[hsl(var(--ink-subtle))]">
                                {timeAgo(r.decline.declinedAt)}
                              </p>
                              {r.decline.reason && (
                                <p className="mx-auto mt-3 max-w-[42ch] whitespace-pre-line text-[13.5px] leading-[1.6] text-[hsl(var(--ink-muted))]">
                                  {r.decline.reason}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions — flush, no divider */}
                  {r.status === "pending" && (
                    <div className="px-7 pt-5 pb-7 md:px-9 md:pt-6 md:pb-9">
                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          size="md"
                          onClick={() => setReplying(true)}
                          trailingArrow
                        >
                          Reply &amp; release {formatMoney(r.amountCents)}
                        </Button>
                        <Button
                          size="md"
                          variant="outline"
                          onClick={() => setDeclineOpen(true)}
                        >
                          Decline &amp; refund
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}
        </motion.div>

        <AnimatePresence>
          {!focusMode && (
            <motion.div
              key="sidebar"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.22, ease: EASE }}
              className={cn(
                "flex flex-col gap-6 sticky top-24",
                "lg:col-span-4",
                replying && "h-[calc(100dvh-8rem)] overflow-y-auto scrollbar-none",
              )}
            >
              <EscrowCard r={r} />
              <TimelineCard r={r} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal
        open={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title="Decline this request?"
        description={`The full ${formatMoney(r.amountCents)} will be refunded to ${r.from.name.split(" ")[0]}. We earn nothing.`}
        size="sm"
      >
        <div className="mt-2 flex flex-wrap items-center justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeclineOpen(false)}>
            Keep pending
          </Button>
          <Button variant="danger" onClick={onDecline}>
            Decline &amp; refund
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function ReplyIconBtn({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[hsl(var(--ink-muted))] transition-colors duration-200 hover:bg-[hsl(var(--rule))]/40 hover:text-[hsl(var(--ink))]"
    >
      {icon}
    </button>
  );
}

function StatusPill({
  status,
}: {
  status: "pending" | "replied" | "declined" | "expired";
}) {
  if (status === "pending") return <Pill size="sm" tone="ink">Pending</Pill>;
  if (status === "replied") return <Pill size="sm">Replied</Pill>;
  if (status === "declined") return <Pill size="sm" tone="muted">Declined</Pill>;
  return <Pill size="sm" tone="muted">Expired</Pill>;
}

function EscrowCard({
  r,
  className,
}: {
  r: import("../../types").RequestRecord;
  className?: string;
}) {
  const fee = r.escrow.feeCents ?? platformFeeCents(r.amountCents);
  const release = r.amountCents - fee;

  return (
    <Card className={className}>
      <div className="flex flex-col justify-between px-7 py-6 md:px-9 md:py-7">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
          Amount on hold
        </p>
        <p
          className="mt-1.5 font-serif text-[hsl(var(--ink))]"
          style={{
            fontSize: "2.4rem",
            fontWeight: 500,
            letterSpacing: "-0.025em",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatMoney(r.amountCents)}
        </p>
        <p className="mt-1.5 text-[12px] text-[hsl(var(--ink-muted))]">
          {r.status === "pending"
            ? `Auto-refunds ${timeUntil(r.expiresAt)}`
            : r.status === "replied"
              ? `Released ${dateLong(r.reply!.repliedAt)}`
              : r.status === "declined"
                ? `Refunded ${dateLong(r.decline!.declinedAt)}`
                : "Refunded automatically"}
        </p>

        <div className="pt-5 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[12.5px] text-[hsl(var(--ink-muted))]">If you reply</span>
            <span className="text-[13px] font-medium tabular-nums text-[hsl(var(--ink))]">
              + {formatMoney(release)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[12.5px] text-[hsl(var(--ink-muted))]">Platform fee</span>
            <span className="text-[12.5px] tabular-nums text-[hsl(var(--ink-subtle))]">
              − {formatMoney(fee)}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[12.5px] text-[hsl(var(--ink-muted))]">If you decline</span>
            <span className="text-[12.5px] tabular-nums text-[hsl(var(--ink-subtle))]">
              Refund {formatMoney(r.amountCents)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function TimelineCard({
  r,
  className,
}: {
  r: import("../../types").RequestRecord;
  className?: string;
}) {
  const events: Array<{ icon: ReactNode; label: string; meta: string }> = [
    {
      icon: <Clock size={12} strokeWidth={1.6} />,
      label: "Held on submit",
      meta: dateLong(r.escrow.heldAt),
    },
  ];
  if (r.escrow.releasedAt)
    events.push({
      icon: <Check size={12} strokeWidth={1.6} />,
      label: "Released to you",
      meta: dateLong(r.escrow.releasedAt),
    });
  if (r.escrow.refundedAt && r.status === "declined")
    events.push({
      icon: <X size={12} strokeWidth={1.6} />,
      label: "Refunded to sender",
      meta: dateLong(r.escrow.refundedAt),
    });
  if (r.escrow.refundedAt && r.status === "expired")
    events.push({
      icon: <Clock size={12} strokeWidth={1.6} />,
      label: "Expired and refunded",
      meta: dateLong(r.escrow.refundedAt),
    });
  if (r.status === "pending")
    events.push({
      icon: <Clock size={12} strokeWidth={1.6} />,
      label: "Auto-refunds",
      meta: dateLong(r.expiresAt),
    });

  return (
    <Card className={className}>
      <div className="flex h-full flex-col px-7 py-6 md:px-9 md:py-7">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
          Timeline
        </p>
        <ol className="mt-4 flex-1 space-y-3">
          {events.map((e, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[hsl(var(--ink-subtle))]">
                {e.icon}
              </span>
              <span className="flex-1 text-[12.5px] text-[hsl(var(--ink))]">
                {e.label}
              </span>
              <span className="text-[11.5px] text-[hsl(var(--ink-subtle))]">
                {e.meta}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}
