import { ArrowLeft } from "lucide-react";
import { Card } from "../../ui/Card";
import { Pill } from "../../ui/Pill";
import { Avatar } from "../../ui/Avatar";
import { Reveal } from "../../ui/Reveal";
import { Link, useRouter } from "../../router";
import { useSent } from "../../store/requests";
import { dateLong, formatMoney, timeAgo, timeUntil } from "../../store/format";

/**
 * Sent detail — read-only view from the sender's perspective.
 * The owner stays at the top, the message they sent and the
 * reply (if any) sit below, and the escrow card spells out
 * exactly where the money is.
 */
export function SentDetail({ id }: { id: string }) {
  const all = useSent();
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
            <p
              className="whitespace-pre-line text-[hsl(var(--ink))]"
              style={{ fontSize: "1rem", lineHeight: 1.7 }}
            >
              {r.message}
            </p>

            {r.reply && (
              <div className="mt-9 rounded-2xl border border-[hsl(var(--ink))] bg-[hsl(var(--surface))] px-5 py-5">
                <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
                  Reply from {r.toDisplayName.split(" ")[0]} ·{" "}
                  {timeAgo(r.reply.repliedAt)}
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
                {r.decline.reason ? (
                  <p
                    className="mt-2.5 text-[hsl(var(--ink))]"
                    style={{ fontSize: "0.97rem", lineHeight: 1.7 }}
                  >
                    {r.decline.reason}
                  </p>
                ) : (
                  <p className="mt-2.5 text-[hsl(var(--ink-muted))]">
                    No reason was given. Your full amount is back with you.
                  </p>
                )}
              </div>
            )}
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
                  : r.status === "declined"
                    ? `Refunded ${dateLong(r.decline!.declinedAt)}.`
                    : `Refunded after the reply window closed.`}
            </p>
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

function StatusPill({
  status,
}: {
  status: "pending" | "replied" | "declined" | "expired";
}) {
  if (status === "pending") return <Pill size="sm" tone="ink">Held</Pill>;
  if (status === "replied") return <Pill size="sm">Replied</Pill>;
  if (status === "declined") return <Pill size="sm" tone="muted">Declined</Pill>;
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
