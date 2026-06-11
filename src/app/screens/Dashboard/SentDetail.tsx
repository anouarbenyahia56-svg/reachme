import type { ReactNode } from "react";
import { ArrowLeft, Camera, File, Mic, Play } from "lucide-react";
import { Card } from "../../ui/Card";
import { Pill } from "../../ui/Pill";
import { Avatar } from "../../ui/Avatar";
import { Reveal } from "../../ui/Reveal";
import { Link, useRouter } from "../../router";
import { useSent, getConversation, platformFeeCents } from "../../store/requests";
import { useProfile } from "../../store/session";
import { dateLong, formatMoney, timeAgo, timeUntil } from "../../store/format";
import type { RequestRecord } from "../../types";

/**
 * Sent detail — read-only view from the sender's perspective.
 * Shows the full conversation thread with the owner, the escrow
 * card, and a fee breakdown (owner only — they can see what
 * platform fee was deducted).
 */
export function SentDetail({ id }: { id: string }) {
  const all = useSent();
  const profile = useProfile();
  const r = all.find((x) => x.id === id);
  const { navigate } = useRouter();

  if (!r) {
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
            That sent request can't be found.
          </h3>
          <Link
            href="/dashboard/sent"
            className="mt-6 inline-flex rounded-full border border-[hsl(var(--rule-strong))] px-5 py-2.5 text-[13px] text-[hsl(var(--ink))] transition-colors hover:border-[hsl(var(--ink))]"
          >
            Back to sent
          </Link>
        </div>
      </Card>
    );
  }

  // Get full conversation thread
  const thread = getConversation(r.conversationId);
  const isOwner = Boolean(
    profile && profile.handle.toLowerCase() === r.toHandle.toLowerCase(),
  );

  return (
    <Reveal duration={0.4} blur={4}>
      <button
        type="button"
        onClick={() => navigate("/dashboard/sent")}
        className="mb-6 inline-flex items-center gap-2 text-[12.5px] text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
      >
        <ArrowLeft size={14} strokeWidth={1.6} aria-hidden="true" />
        Sent
      </button>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <div className="px-7 pt-7 md:px-9 md:pt-9">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar size="md" src={r.toAvatarUrl} name={r.toDisplayName} />
                <div>
                  <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
                    Sent to
                  </p>
                  <p className="mt-1 text-[14.5px] font-semibold text-[hsl(var(--ink))]">
                    {r.toDisplayName}
                  </p>
                  <Link
                    href={`/${r.toHandle}`}
                    className="text-[12.5px] text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--ink))]"
                  >
                    reachme.com/{r.toHandle}
                  </Link>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
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
            {/* Conversation thread */}
            <div className="space-y-6">
              {thread.map((req) => (
                <ConversationEntry key={req.id} r={req} />
              ))}
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-4">
          <div className="px-7 pt-7 md:px-9 md:pt-9">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
              {r.status === "pending"
                ? "Held"
                : r.status === "replied"
                  ? "Released"
                  : "Refunded"}
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
            <p className="mt-3 text-[12.5px] text-[hsl(var(--ink-muted))]">
              {r.status === "pending"
                ? `Refunds ${timeUntil(r.expiresAt)} if no reply.`
                : r.status === "replied"
                  ? `Released to ${r.toDisplayName} on ${dateLong(r.reply!.repliedAt)}.`
                  : `Refunded after the reply window closed.`}
            </p>

            {/* Fee breakdown — owner only */}
            {isOwner && r.status === "replied" && (
              <div className="mt-5 space-y-2 border-t border-[hsl(var(--rule))] pt-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-[12.5px] text-[hsl(var(--ink-muted))]">You sent</span>
                  <span className="text-[13px] font-medium tabular-nums text-[hsl(var(--ink))]">
                    {formatMoney(r.amountCents)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[12.5px] text-[hsl(var(--ink-muted))]">Platform fee</span>
                  <span className="text-[12.5px] tabular-nums text-[hsl(var(--ink-subtle))]">
                    − {formatMoney(platformFeeCents(r.amountCents))}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[12.5px] text-[hsl(var(--ink-muted))]">Owner received</span>
                  <span className="text-[12.5px] tabular-nums text-[hsl(var(--ink-subtle))]">
                    {formatMoney(r.amountCents - platformFeeCents(r.amountCents))}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="px-7 pb-7 pt-6 md:px-9 md:pb-9">
            <Row label="Submitted" value={dateLong(r.createdAt)} />
            <Row
              label={r.status === "pending" ? "Refunds on" : "Reply window"}
              value={dateLong(r.expiresAt)}
            />
            {r.escrow.releasedAt && (
              <Row label="Released" value={dateLong(r.escrow.releasedAt)} />
            )}
            {r.escrow.refundedAt && (
              <Row label="Refunded" value={dateLong(r.escrow.refundedAt)} />
            )}
          </div>
        </Card>
      </div>
    </Reveal>
  );
}

function ConversationEntry({ r }: { r: RequestRecord }) {
  const fee = r.escrow.feeCents ?? platformFeeCents(r.amountCents);
  const release = r.amountCents - fee;

  return (
    <div className="space-y-4">
      {/* Sender's message */}
      <div className="rounded-2xl border border-[hsl(var(--rule))] bg-[hsl(var(--page))] px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12.5px] text-[hsl(var(--ink-subtle))]">
            {formatMoney(r.amountCents)} · {timeAgo(r.createdAt)}
          </p>
          <StatusPill status={r.status} />
        </div>
        <p
          className="mt-2.5 whitespace-pre-line text-[hsl(var(--ink))]"
          style={{ fontSize: "0.97rem", lineHeight: 1.7 }}
        >
          {r.message}
        </p>
      </div>

      {/* Owner's reply */}
      {r.reply && (
        <div className="ml-6 rounded-2xl border border-[hsl(var(--ink))] bg-[hsl(var(--surface))] px-5 py-4">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
            Reply · {timeAgo(r.reply.repliedAt)}
          </p>
          {r.reply.body && (
            <p
              className="mt-2.5 whitespace-pre-line text-[hsl(var(--ink))]"
              style={{ fontSize: "0.97rem", lineHeight: 1.7 }}
            >
              {r.reply.body}
            </p>
          )}
          {/* Attachments */}
          {r.reply.attachments && r.reply.attachments.length > 0 && (
            <div className={`flex flex-wrap gap-2 ${r.reply.body ? "mt-3" : "mt-2"}`}>
              {r.reply.attachments.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-full bg-[hsl(var(--page))] px-3 py-1.5 ring-1 ring-[hsl(var(--rule))]"
                >
                  {a.type === "image" && <Camera size={12} strokeWidth={1.6} />}
                  {a.type === "voice" && <Mic size={12} strokeWidth={1.6} />}
                  {a.type === "video" && <Play size={12} strokeWidth={1.6} />}
                  {a.type === "file" && <File size={12} strokeWidth={1.6} />}
                  <span className="max-w-[120px] truncate text-[11.5px] text-[hsl(var(--ink))]">
                    {a.name || a.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-[hsl(var(--rule))] py-3 last:border-b-0">
      <span className="text-[12.5px] text-[hsl(var(--ink-muted))]">{label}</span>
      <span className="text-[13px] tabular-nums text-[hsl(var(--ink))]">
        {value}
      </span>
    </div>
  );
}
