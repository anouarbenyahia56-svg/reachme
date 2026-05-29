import type { ReactNode } from "react";
import { ArrowLeft, Check, Clock, X } from "lucide-react";
import { useState } from "react";
import { Card } from "../../ui/Card";
import { Pill } from "../../ui/Pill";
import { Avatar } from "../../ui/Avatar";
import { Reveal } from "../../ui/Reveal";
import { Button } from "../../ui/Button";
import { TextArea } from "../../ui/Field";
import { Modal } from "../../ui/Modal";
import { Link, useRouter } from "../../router";
import { useReceived, replyToRequest, declineRequest } from "../../store/requests";
import {
  dateLong,
  formatMoney,
  timeAgo,
  timeUntil,
} from "../../store/format";
import { useToast } from "../../ui/Toast";
import { useProfile } from "../../store/session";

/**
 * Request detail — the moment of decision. Sender block at top,
 * full message below, escrow card in the sidebar showing exactly
 * where the money sits. Reply, decline, or do nothing.
 *
 * Reply opens a panel inline. Decline opens a quiet confirmation
 * modal so the action is intentional, not accidental.
 */
export function RequestDetail({ id }: { id: string }) {
  const all = useReceived();
  const profile = useProfile();
  const r = all.find((x) => x.id === id);
  const { navigate } = useRouter();
  const toast = useToast();
  const [replyOpen, setReplyOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

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

  const onReply = () => {
    if (replyToRequest(r.id, reply)) {
      toast.show(
        "Reply sent.",
        `Released ${formatMoney(r.amountCents - Math.round(r.amountCents * 0.05))}`,
      );
      setReplyOpen(false);
      setReply("");
    }
  };

  const onDecline = () => {
    if (declineRequest(r.id, declineReason)) {
      toast.show("Declined.", `Refunded ${formatMoney(r.amountCents)}`);
      setDeclineOpen(false);
      setDeclineReason("");
    }
  };

  return (
    <Reveal>
      <button
        type="button"
        onClick={() => navigate("/dashboard/received")}
        className="mb-6 inline-flex items-center gap-2 text-[12.5px] text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
      >
        <ArrowLeft size={14} strokeWidth={1.6} aria-hidden="true" />
        Inbox
      </button>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <div className="px-7 pt-7 md:px-9 md:pt-9">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar size="md" name={r.from.name} />
                <div>
                  <p className="text-[14.5px] font-semibold text-[hsl(var(--ink))]">
                    {r.from.name}
                  </p>
                  <p className="text-[12.5px] text-[hsl(var(--ink-muted))]">
                    {r.from.email}
                    {r.from.organization && ` · ${r.from.organization}`}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill size="sm">{cat}</Pill>
                <StatusPill status={r.status} />
                <span className="text-[11.5px] text-[hsl(var(--ink-subtle))]">
                  {timeAgo(r.createdAt)}
                </span>
              </div>
            </div>

            <h2
              className="mt-7 font-serif text-[hsl(var(--ink))]"
              style={{
                fontSize: "clamp(1.6rem, 2.6vw, 2.2rem)",
                fontWeight: 500,
                lineHeight: 1.15,
                letterSpacing: "-0.025em",
                fontOpticalSizing: "auto",
                textWrap: "balance",
              }}
            >
              {r.subject}
            </h2>
          </div>

          <div className="px-7 pb-7 pt-6 md:px-9 md:pb-9">
            <p
              className="whitespace-pre-line text-[hsl(var(--ink))]"
              style={{ fontSize: "1rem", lineHeight: 1.7 }}
            >
              {r.message}
            </p>

            {r.reply && (
              <div className="mt-9 rounded-2xl border border-[hsl(var(--rule))] bg-[hsl(var(--page))] px-5 py-5">
                <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
                  Your reply · {timeAgo(r.reply.repliedAt)}
                </p>
                <p
                  className="mt-2.5 whitespace-pre-line text-[hsl(var(--ink))]"
                  style={{ fontSize: "0.97rem", lineHeight: 1.7 }}
                >
                  {r.reply.body}
                </p>
              </div>
            )}

            {r.decline && (
              <div className="mt-9 rounded-2xl border border-[hsl(var(--rule))] bg-[hsl(var(--page))] px-5 py-5">
                <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
                  Declined · {timeAgo(r.decline.declinedAt)}
                </p>
                {r.decline.reason && (
                  <p className="mt-2.5 text-[hsl(var(--ink))]" style={{ fontSize: "0.97rem", lineHeight: 1.7 }}>
                    {r.decline.reason}
                  </p>
                )}
              </div>
            )}

            {r.status === "pending" && (
              <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-[hsl(var(--rule))] pt-7">
                <Button
                  size="md"
                  onClick={() => setReplyOpen(true)}
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
            )}
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-4">
          <EscrowCard r={r} />
          <TimelineCard r={r} />
        </div>
      </div>

      <Modal
        open={replyOpen}
        onClose={() => setReplyOpen(false)}
        title={`Reply to ${r.from.name.split(" ")[0]}`}
        description={`Sending will release ${formatMoney(
          r.amountCents - Math.round(r.amountCents * 0.05),
        )} to you, after our 5% on completed reply.`}
        size="md"
      >
        <TextArea
          label="Your reply"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder={`Be direct. Lead with the answer.`}
          maxChars={3000}
          autoFocus
        />
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <Button variant="ghost" onClick={() => setReplyOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={onReply}
            trailingArrow
            disabled={!reply.trim() || reply.trim().length < 10}
          >
            Send reply
          </Button>
        </div>
      </Modal>

      <Modal
        open={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title="Decline this request?"
        description={`The full ${formatMoney(r.amountCents)} will be refunded to ${r.from.name.split(" ")[0]}. We earn nothing.`}
        size="md"
      >
        <TextArea
          label="Note to sender"
          optional
          value={declineReason}
          onChange={(e) => setDeclineReason(e.target.value)}
          placeholder={`A brief reason — kindness costs nothing.`}
          maxChars={400}
        />
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeclineOpen(false)}>
            Keep pending
          </Button>
          <Button variant="danger" onClick={onDecline}>
            Decline &amp; refund
          </Button>
        </div>
      </Modal>
    </Reveal>
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
}: {
  r: import("../../types").RequestRecord;
}) {
  const fee =
    r.escrow.feeCents ?? Math.round(r.amountCents * 0.05);
  const release = r.amountCents - fee;
  return (
    <Card>
      <div className="px-7 pt-7 md:px-9 md:pt-9">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
          Amount on hold
        </p>
        <p
          className="mt-1.5 font-serif text-[hsl(var(--ink))]"
          style={{
            fontSize: "2.6rem",
            fontWeight: 500,
            letterSpacing: "-0.025em",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatMoney(r.amountCents)}
        </p>
        <p className="mt-2 text-[12.5px] text-[hsl(var(--ink-muted))]">
          {r.status === "pending"
            ? `Auto-refunds ${timeUntil(r.expiresAt)} if no reply.`
            : r.status === "replied"
              ? `Released ${dateLong(r.reply!.repliedAt)}.`
              : r.status === "declined"
                ? `Refunded ${dateLong(r.decline!.declinedAt)}.`
                : `Refunded automatically.`}
        </p>
      </div>

      <div className="mx-7 my-6 h-px bg-[hsl(var(--rule))] md:mx-9" />

      <div className="px-7 pb-7 md:px-9 md:pb-9">
        <Row label="If you reply" value={`+ ${formatMoney(release)}`} />
        <Row label="Platform fee (5%)" value={`− ${formatMoney(fee)}`} muted />
        <div className="mt-3 border-t border-[hsl(var(--rule))] pt-3">
          <Row
            label="If you decline / expire"
            value={`Refund ${formatMoney(r.amountCents)}`}
          />
        </div>
      </div>
    </Card>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between py-1.5">
      <span className="text-[13px] text-[hsl(var(--ink-muted))]">{label}</span>
      <span
        className={
          muted
            ? "text-[13px] tabular-nums text-[hsl(var(--ink-muted))]"
            : "text-[13.5px] font-medium tabular-nums text-[hsl(var(--ink))]"
        }
      >
        {value}
      </span>
    </div>
  );
}

function TimelineCard({
  r,
}: {
  r: import("../../types").RequestRecord;
}) {
  const events: Array<{ icon: ReactNode; label: string; meta: string }> = [
    {
      icon: <Clock size={13} strokeWidth={1.6} />,
      label: "Held on submit",
      meta: dateLong(r.escrow.heldAt),
    },
  ];
  if (r.escrow.releasedAt)
    events.push({
      icon: <Check size={13} strokeWidth={1.6} />,
      label: "Released to you",
      meta: dateLong(r.escrow.releasedAt),
    });
  if (r.escrow.refundedAt && r.status === "declined")
    events.push({
      icon: <X size={13} strokeWidth={1.6} />,
      label: "Refunded to sender",
      meta: dateLong(r.escrow.refundedAt),
    });
  if (r.escrow.refundedAt && r.status === "expired")
    events.push({
      icon: <Clock size={13} strokeWidth={1.6} />,
      label: "Expired and refunded",
      meta: dateLong(r.escrow.refundedAt),
    });
  if (r.status === "pending")
    events.push({
      icon: <Clock size={13} strokeWidth={1.6} />,
      label: "Auto-refunds",
      meta: dateLong(r.expiresAt),
    });

  return (
    <Card>
      <div className="px-7 pt-7 md:px-9 md:pt-9">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
          Timeline
        </p>
      </div>
      <div className="px-7 pb-7 pt-3 md:px-9 md:pb-9">
        <ol className="space-y-3.5">
          {events.map((e, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] text-[hsl(var(--ink-muted))]">
                {e.icon}
              </span>
              <span className="flex-1 text-[13px] text-[hsl(var(--ink))]">
                {e.label}
              </span>
              <span className="text-[12px] text-[hsl(var(--ink-subtle))]">
                {e.meta}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}
