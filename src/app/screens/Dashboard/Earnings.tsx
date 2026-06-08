import { useState } from "react";
import { Inbox } from "lucide-react";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { Modal } from "../../ui/Modal";
import { Label } from "../../ui/Field";
import { Reveal } from "../../ui/Reveal";
import { useRouter } from "../../router";
import { useReceived, platformFeeCents } from "../../store/requests";
import {
  useWithdrawals,
  requestWithdrawal,
  withdrawnCents,
} from "../../store/withdrawals";
import {
  usePayoutMethod,
  clearPayoutMethod,
} from "../../store/payoutMethod";
import { useProfile } from "../../store/session";
import { formatMoney, dateLong } from "../../store/format";
import { useToast } from "../../ui/Toast";
import { cn } from "@/lib/utils";
import type {
  PayoutMethod,
  ReceivedRequest,
  Withdrawal,
} from "../../types";

/**
 * Earnings — the owner's view of their money.
 *
 * The first question this screen must answer is also the only
 * one that matters: how much can I move to my bank today? The
 * number dominates; the activity that earned it is the second
 * voice; the payouts are the third.
 *
 *   1. Statement   — what's available, the action, the context
 *   2. Earned      — the replies that put money in the account
 *   3. Bank        — where it lives, what's been moved
 *
 * Every value, count, and list on this screen is bound to a
 * named variable (see Backing variables below). The data
 * currently comes from the local store; the backend developer
 * replaces each binding with a real API value and flips
 * `loading` to `true` while the fetch is in flight.
 */
const MIN_PAYOUT_CENTS = 100;

/** Shape of a single row in the EARNED section. */
interface EarningEntry {
  id: string;
  date: string;
  category: string;
  amountCents: number;
}

/** Shape of a single row in the WITHDRAWALS section. */
interface WithdrawalEntry {
  id: string;
  date: string;
  amountCents: number;
  lastFour: string;
  status: Withdrawal["status"];
}

export function Earnings() {
  const profile = useProfile();
  const received = useReceived();
  const withdrawals = useWithdrawals();
  const payoutMethod = usePayoutMethod();
  const toast = useToast();
  const { navigate } = useRouter();

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [removeOpen, setRemoveOpen] = useState(false);

  if (!profile) return null;

  // ─── Loading state ──────────────────────────────────────────────
  // TODO: wire to backend — set to `true` while the data fetch is in
  // flight, set to `false` once every variable below is populated.
  const loading = false;

  // ─── Derived numbers (intermediate calculations) ────────────────

  const inbox = received.filter(
    (r) => r.toHandle.toLowerCase() === profile.handle.toLowerCase(),
  );
  const pending = inbox.filter((r) => r.status === "pending");
  const released = inbox.filter(
    (r) => r.status === "replied" && r.escrow.releasedAt,
  );
  const netOf = (r: ReceivedRequest) =>
    r.amountCents - (r.escrow.feeCents ?? platformFeeCents(r.amountCents));

  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );
  const thisMonth = released.filter(
    (r) => new Date(r.reply!.repliedAt).getTime() >= startOfMonth.getTime(),
  );

  // ─── Backing variables (replace each with real API data) ────────

  // TODO: wire to backend — value from GET /earnings/lifetime
  const lifetimeNetCents = released.reduce((sum, r) => sum + netOf(r), 0);

  // TODO: wire to backend — value from GET /earnings/lifetime/count
  const lifetimeReplyCount = released.length;

  // TODO: wire to backend — value from GET /earnings/available
  const availableBalance = Math.max(
    0,
    lifetimeNetCents - withdrawnCents(withdrawals),
  );

  // TODO: wire to backend — value from GET /earnings/this-month
  const thisMonthEarnings = thisMonth.reduce((sum, r) => sum + netOf(r), 0);

  const currentMonthName = new Date().toLocaleDateString("en-US", {
    month: "long",
  });

  // TODO: wire to backend — value from GET /earnings/pending-escrow
  const pendingEscrow = pending.reduce((sum, r) => sum + r.amountCents, 0);

  // TODO: wire to backend — value from GET /earnings/pending-escrow/count
  const pendingRequestCount = pending.length;

  // TODO: wire to backend — value from GET /earnings/withdrawn
  const totalWithdrawn = withdrawnCents(withdrawals);

  // TODO: wire to backend — value from GET /payout-method
  const hasPayoutMethod = Boolean(payoutMethod);

  const hasAvailableFunds = availableBalance > 0;

  // TODO: wire to backend — array from GET /earnings/history
  const earningsHistory: EarningEntry[] = [...released]
    .sort(
      (a, b) =>
        new Date(b.reply!.repliedAt).getTime() -
        new Date(a.reply!.repliedAt).getTime(),
    )
    .map((r) => ({
      id: r.id,
      date: r.reply!.repliedAt,
      category:
        profile.categories.find((c) => c.id === r.category)?.label ?? "—",
      amountCents: netOf(r),
    }));

  // TODO: wire to backend — array from GET /withdrawals/history
  const withdrawalsHistory: WithdrawalEntry[] = withdrawals.map((w) => ({
    id: w.id,
    date: w.completedAt ?? w.requestedAt,
    amountCents: w.amountCents,
    lastFour: w.method.lastFour,
    status: w.status,
  }));

  // ─── Handlers (placeholder functions) ────────────────────────────

  const openWithdrawModal = () => {
    setWithdrawAmount(String(Math.floor(availableBalance / 100)));
    setWithdrawOpen(true);
  };

  // TODO: Initiate Stripe Connect OAuth flow when backend is connected
  const handleConnectBank = () => {};

  // TODO: wire to backend — POST /withdrawals, then poll the result
  // or subscribe to a webhook before refreshing the balance.
  const handleWithdraw = () => {
    openWithdrawModal();
  };

  const onConfirmWithdraw = () => {
    const cents = Math.round(parseFloat(withdrawAmount || "0") * 100);
    if (!cents || cents <= 0) return toast.show("Add an amount.");
    if (cents < MIN_PAYOUT_CENTS)
      return toast.show(
        `Minimum withdrawal is ${formatMoney(MIN_PAYOUT_CENTS, { withCents: true })}.`,
      );
    if (cents > availableBalance)
      return toast.show("That exceeds your available balance.");
    if (!payoutMethod) return toast.show("Add a payout method first.");

    const result = requestWithdrawal({
      amountCents: cents,
      method: {
        kind: payoutMethod.kind,
        label: payoutMethod.label,
        lastFour: payoutMethod.lastFour,
      },
    });
    if (!result.ok) return toast.show(result.reason);

    toast.show(
      "Withdrawal requested.",
      `${formatMoney(cents, { withCents: true })} → ${payoutMethod.label} ··${payoutMethod.lastFour}`,
    );
    setWithdrawOpen(false);
    setWithdrawAmount("");
  };

  const onRemovePayout = () => {
    clearPayoutMethod();
    toast.show("Payout method removed.");
    setRemoveOpen(false);
  };

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="grid gap-6 lg:gap-8">
      <Reveal duration={0.7} blur={6} delay={0}>
        <StatementCard
          availableBalance={availableBalance}
          lifetimeNetCents={lifetimeNetCents}
          lifetimeReplyCount={lifetimeReplyCount}
          currentMonthName={currentMonthName}
          thisMonthEarnings={thisMonthEarnings}
          pendingEscrow={pendingEscrow}
          pendingRequestCount={pendingRequestCount}
          totalWithdrawn={totalWithdrawn}
          hasPayoutMethod={hasPayoutMethod}
          hasAvailableFunds={hasAvailableFunds}
          loading={loading}
          onConnectBank={handleConnectBank}
          onWithdraw={handleWithdraw}
        />
      </Reveal>

      <Reveal duration={0.7} blur={6} delay={0.08}>
        <EarnedCard
          earnings={earningsHistory}
          loading={loading}
          onRowClick={(id) => navigate(`/dashboard/received/${id}`)}
        />
      </Reveal>

      <Reveal duration={0.7} blur={6} delay={0.16}>
        <BankCard
          hasPayoutMethod={hasPayoutMethod}
          payoutMethod={payoutMethod}
          withdrawals={withdrawalsHistory}
          loading={loading}
          onConnectBank={handleConnectBank}
        />
      </Reveal>

      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        availableCents={availableBalance}
        payoutMethod={payoutMethod}
        amount={withdrawAmount}
        onAmountChange={setWithdrawAmount}
        onConfirm={onConfirmWithdraw}
      />

      <RemovePayoutModal
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        onConfirm={onRemovePayout}
      />
    </div>
  );
}

// ─── Statement ───────────────────────────────────────────────────

interface StatementCardProps {
  availableBalance: number;
  lifetimeNetCents: number;
  lifetimeReplyCount: number;
  currentMonthName: string;
  thisMonthEarnings: number;
  pendingEscrow: number;
  pendingRequestCount: number;
  totalWithdrawn: number;
  hasPayoutMethod: boolean;
  hasAvailableFunds: boolean;
  loading: boolean;
  onConnectBank: () => void;
  onWithdraw: () => void;
}

function StatementCard({
  availableBalance,
  lifetimeNetCents,
  lifetimeReplyCount,
  currentMonthName,
  thisMonthEarnings,
  pendingEscrow,
  pendingRequestCount,
  totalWithdrawn,
  hasPayoutMethod,
  hasAvailableFunds,
  loading,
  onConnectBank,
  onWithdraw,
}: StatementCardProps) {
  return (
    <Card>
      <div className="px-8 py-10 md:px-11 md:py-14">
        <div className="flex items-start justify-between gap-6">
          <p className="pt-1.5 text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
            Available to withdraw
          </p>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {!hasPayoutMethod ? (
              <Button
                size="md"
                onClick={onConnectBank}
                trailingArrow
                disabled={loading}
              >
                Connect bank account
              </Button>
            ) : hasAvailableFunds ? (
              <Button
                size="md"
                onClick={onWithdraw}
                trailingArrow
                disabled={loading}
              >
                Withdraw
              </Button>
            ) : (
              <p className="pt-2 text-[12px] leading-[1.5] text-[hsl(var(--ink-muted))]">
                Funds appear here when you reply to requests.
              </p>
            )}
          </div>
        </div>

        <div className="mt-7">
          {loading ? (
            <ShimmerBlock
              width="w-[260px] sm:w-[340px]"
              height="h-[clamp(3.2rem,6.6vw,4.8rem)]"
            />
          ) : (
            <p
              className="font-serif text-[hsl(var(--ink))]"
              style={{
                fontSize: "clamp(3.2rem, 6.6vw, 4.8rem)",
                fontWeight: 500,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatMoney(availableBalance, { withCents: true })}
            </p>
          )}
          <p className="mt-5 max-w-[58ch] text-[13.5px] leading-[1.6] text-[hsl(var(--ink-muted))]">
            {statementHelper({
              availableCents: availableBalance,
              lifetimeNetCents,
              lifetimeReplyCount,
              hasMethod: hasPayoutMethod,
            })}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-x-12 gap-y-10 border-t border-[hsl(var(--rule))] pt-10 sm:grid-cols-3">
          <StatementStat
            label="This month"
            loading={loading}
            value={formatMoney(thisMonthEarnings, { withCents: true })}
            caption={
              thisMonthEarnings === 0
                ? `No replies yet in ${currentMonthName}.`
                : `Earned in ${currentMonthName}.`
            }
          />
          <StatementStat
            label="Held"
            loading={loading}
            value={formatMoney(pendingEscrow, { withCents: true })}
            caption={
              pendingRequestCount === 0
                ? "Nothing held right now."
                : `${pendingRequestCount} ${pendingRequestCount === 1 ? "request" : "requests"} waiting on a reply.`
            }
          />
          <StatementStat
            label="Withdrawn"
            loading={loading}
            value={formatMoney(totalWithdrawn, { withCents: true })}
            caption={
              totalWithdrawn === 0
                ? "Nothing moved yet."
                : "Moved to your bank."
            }
          />
        </div>
      </div>
    </Card>
  );
}

function statementHelper({
  availableCents,
  lifetimeNetCents,
  lifetimeReplyCount,
  hasMethod,
}: {
  availableCents: number;
  lifetimeNetCents: number;
  lifetimeReplyCount: number;
  hasMethod: boolean;
}): string {
  if (lifetimeNetCents === 0) {
    return "Reply to a pending request to receive your first payment.";
  }
  if (availableCents === 0) {
    return "Everything you've earned has been moved to your bank.";
  }
  if (!hasMethod) {
    return `${formatMoney(lifetimeNetCents, { withCents: true })} earned across ${lifetimeReplyCount} ${lifetimeReplyCount === 1 ? "reply" : "replies"}. Add a payout method to withdraw.`;
  }
  return `${formatMoney(lifetimeNetCents, { withCents: true })} earned across ${lifetimeReplyCount} ${lifetimeReplyCount === 1 ? "reply" : "replies"}.`;
}

function StatementStat({
  label,
  value,
  caption,
  loading,
}: {
  label: string;
  value: string;
  caption: string;
  loading: boolean;
}) {
  return (
    <div>
      <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
        {label}
      </p>
      {loading ? (
        <ShimmerBlock
          width="w-[140px]"
          height="h-[clamp(1.6rem,2.8vw,2rem)]"
          className="mt-3"
        />
      ) : (
        <p
          className="mt-3 font-serif text-[hsl(var(--ink))]"
          style={{
            fontSize: "clamp(1.6rem, 2.8vw, 2rem)",
            fontWeight: 500,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </p>
      )}
      <p className="mt-2.5 text-[12.5px] leading-[1.55] text-[hsl(var(--ink-muted))]">
        {caption}
      </p>
    </div>
  );
}

// ─── Earned ──────────────────────────────────────────────────────

interface EarnedCardProps {
  earnings: EarningEntry[];
  loading: boolean;
  onRowClick: (id: string) => void;
}

function EarnedCard({ earnings, loading, onRowClick }: EarnedCardProps) {
  return (
    <Card>
      <div className="px-8 py-10 md:px-11 md:py-12">
        <div className="flex items-baseline justify-between">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
            Earned
          </p>
          {!loading && earnings.length > 0 && (
            <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
              {earnings.length}{" "}
              {earnings.length === 1 ? "payment" : "payments"}
            </p>
          )}
        </div>

        {loading ? (
          <div className="mt-10 space-y-5">
            {[0, 1, 2].map((i) => (
              <ShimmerBlock key={i} width="w-full" height="h-[52px]" />
            ))}
          </div>
        ) : earnings.length === 0 ? (
          <EarnedEmptyState />
        ) : (
          <ul className="mt-10 divide-y divide-[hsl(var(--rule))]">
            {earnings.map((e) => (
              <EarningRow
                key={e.id}
                entry={e}
                onClick={() => onRowClick(e.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

function EarningRow({
  entry,
  onClick,
}: {
  entry: EarningEntry;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-6 px-1 py-4 text-left transition-colors duration-200 hover:bg-[hsl(var(--page))]/60"
      >
        <p className="truncate text-[13.5px] font-medium text-[hsl(var(--ink))]">
          {entry.category}
        </p>
        <p className="text-[12px] tabular-nums text-[hsl(var(--ink-muted))]">
          {dateLong(entry.date)}
        </p>
        <p
          className="font-serif tabular-nums text-[hsl(var(--ink))]"
          style={{
            fontSize: "1.1rem",
            fontWeight: 500,
            letterSpacing: "-0.015em",
          }}
        >
          +{formatMoney(entry.amountCents, { withCents: true })}
        </p>
      </button>
    </li>
  );
}

function EarnedEmptyState() {
  return (
    <div className="mt-6 flex flex-col items-center px-6 py-16 text-center">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--page))] text-[hsl(var(--ink-muted))] ring-1 ring-[hsl(var(--rule))]">
        <Inbox size={18} strokeWidth={1.6} aria-hidden="true" />
      </span>
      <p
        className="mt-6 font-serif text-[hsl(var(--ink))]"
        style={{
          fontSize: "1.55rem",
          fontWeight: 500,
          letterSpacing: "-0.025em",
          lineHeight: 1.15,
        }}
      >
        Nothing earned yet.
      </p>
      <p className="mt-2.5 max-w-[44ch] text-[13.5px] leading-[1.6] text-[hsl(var(--ink-muted))]">
        Your payments will appear here as you reply to requests.
      </p>
    </div>
  );
}

// ─── Bank ────────────────────────────────────────────────────────

interface BankCardProps {
  hasPayoutMethod: boolean;
  payoutMethod: PayoutMethod | null;
  withdrawals: WithdrawalEntry[];
  loading: boolean;
  onConnectBank: () => void;
}

function BankCard({
  hasPayoutMethod,
  payoutMethod,
  withdrawals,
  loading,
  onConnectBank,
}: BankCardProps) {
  return (
    <div className="grid gap-6 lg:gap-8">
      {hasPayoutMethod ? (
        <Card>
          <div className="flex items-center justify-between gap-6 px-8 py-7 md:px-11 md:py-8">
            <div className="min-w-0">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
                Payout method
              </p>
              <p
                className="mt-3 truncate font-serif text-[hsl(var(--ink))]"
                style={{
                  fontSize: "clamp(1.2rem, 1.8vw, 1.45rem)",
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                }}
              >
                {payoutMethod?.label}
                <span className="ml-2 text-[hsl(var(--ink-subtle))]">
                  ··{payoutMethod?.lastFour}
                </span>
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center justify-between gap-6 px-8 py-7 md:px-11 md:py-8">
            <div className="min-w-0">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
                Payout method
              </p>
              <p
                className="mt-3 font-serif text-[hsl(var(--ink-subtle))]"
                style={{
                  fontSize: "clamp(1.2rem, 1.8vw, 1.45rem)",
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                }}
              >
                Not connected
              </p>
              <p className="mt-2 text-[12.5px] leading-[1.55] text-[hsl(var(--ink-muted))]">
                Add a bank account to withdraw.
              </p>
            </div>
            <Button
              size="md"
              onClick={onConnectBank}
              trailingArrow
              disabled={loading}
            >
              Connect bank account
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <div className="px-8 py-10 md:px-11 md:py-12">
          <div className="flex items-baseline justify-between">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
              Withdrawals
            </p>
            {!loading && withdrawals.length > 0 && (
              <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
                {withdrawals.length}{" "}
                {withdrawals.length === 1 ? "transfer" : "transfers"}
              </p>
            )}
          </div>

          {loading ? (
            <div className="mt-8 space-y-5">
              {[0, 1, 2].map((i) => (
                <ShimmerBlock key={i} width="w-full" height="h-[44px]" />
              ))}
            </div>
          ) : withdrawals.length === 0 ? (
            <p className="mt-7 max-w-[42ch] text-[13.5px] leading-[1.6] text-[hsl(var(--ink-muted))]">
              Your withdrawal history will appear here once you start moving
              earnings to your bank.
            </p>
          ) : (
            <ul className="mt-7 divide-y divide-[hsl(var(--rule))]">
              {withdrawals.map((w) => (
                <WithdrawalRow key={w.id} w={w} />
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}

function WithdrawalRow({ w }: { w: WithdrawalEntry }) {
  return (
    <li className="flex items-baseline justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p
          className="font-serif tabular-nums text-[hsl(var(--ink))]"
          style={{
            fontSize: "1.05rem",
            fontWeight: 500,
            letterSpacing: "-0.015em",
          }}
        >
          {formatMoney(w.amountCents, { withCents: true })}
        </p>
        <p className="mt-1 text-[11.5px] tabular-nums text-[hsl(var(--ink-muted))]">
          ··{w.lastFour}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[11.5px] tabular-nums text-[hsl(var(--ink-subtle))]">
          {dateLong(w.date)}
        </p>
      </div>
    </li>
  );
}

// ─── Shimmer ─────────────────────────────────────────────────────

function ShimmerBlock({
  width = "w-full",
  height = "h-4",
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-md bg-[hsl(var(--rule))]/45",
        width,
        height,
        className,
      )}
    >
      <div className="absolute inset-0 animate-[shimmer-sweep_1.6s_infinite] bg-gradient-to-r from-transparent via-white/55 to-transparent" />
    </div>
  );
}

// ─── Modals ──────────────────────────────────────────────────────

function WithdrawModal({
  open,
  onClose,
  availableCents,
  payoutMethod,
  amount,
  onAmountChange,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  availableCents: number;
  payoutMethod: PayoutMethod | null;
  amount: string;
  onAmountChange: (s: string) => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Withdraw to your bank"
      description={
        payoutMethod
          ? `${formatMoney(availableCents, { withCents: true })} available · transfers to ${payoutMethod.label} ··${payoutMethod.lastFour} in 1–2 business days.`
          : `${formatMoney(availableCents, { withCents: true })} available.`
      }
      size="sm"
    >
      <div>
        <Label>Amount</Label>
        <div className="mt-2 flex items-center rounded-2xl border border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] transition-[border-color] duration-300 focus-within:border-[hsl(var(--ink))]">
          <span className="pl-4 text-[15px] text-[hsl(var(--ink-muted))]">$</span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder={String(Math.floor(availableCents / 100))}
            autoFocus
            className="w-full bg-transparent px-3 py-3.5 text-[15px] text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-subtle))] focus:outline-none"
          />
          <button
            type="button"
            onClick={() =>
              onAmountChange(String(Math.floor(availableCents / 100)))
            }
            className="mr-2 rounded-full px-3 py-1.5 text-[12px] font-medium text-[hsl(var(--ink-muted))] transition-colors duration-200 hover:bg-[hsl(var(--rule))] hover:text-[hsl(var(--ink))]"
          >
            Max
          </button>
        </div>
        <p className="mt-3 text-[12px] leading-[1.55] text-[hsl(var(--ink-subtle))]">
          Minimum withdrawal {formatMoney(MIN_PAYOUT_CENTS, { withCents: true })} · No transfer fee.
        </p>
        <div className="mt-7 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm} trailingArrow>
            Withdraw
          </Button>
        </div>
      </div>
    </Modal>
  );
}


function RemovePayoutModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Remove this payout method?"
      description="You'll need to add one again before your next withdrawal."
      size="sm"
    >
      <div className="flex items-center justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>
          Keep
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Remove
        </Button>
      </div>
    </Modal>
  );
}
