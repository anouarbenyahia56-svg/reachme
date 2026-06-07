import type { Withdrawal } from "../types";
import { read, write } from "./storage";
import { useExternal } from "./useExternal";

/**
 * Withdrawals — the owner's outbound money.
 *
 * Mirrors the request-record pattern:
 *   request    → pending  (status="pending",  requestedAt=now)
 *   settle     → paid     (status="paid",     completedAt=now)
 *   fail       → failed   (status="failed",   failureReason)
 *
 * `useWithdrawals` runs a `sweepSettlements` on every read so
 * locally-stubbed transfers move to "paid" after a brief delay,
 * giving the UI a believable processing state without a backend.
 * When a real processor lands, drop the sweep and let webhooks
 * write the terminal status directly.
 *
 * The owner-visible balance is computed from this list:
 *   available = lifetime released net − sum(non-failed withdrawals)
 *
 * Failed withdrawals do not reduce the balance.
 */

const KEY = "withdrawals";

/** How long a pending withdrawal sits before locally "settling".
 *  Short enough to feel responsive in the demo; long enough that
 *  the pending state is actually visible after submit. */
const SETTLE_MS = 4_000;

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `w_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function getAll(): Withdrawal[] {
  return read<Withdrawal[]>(KEY, []);
}

function setAll(list: Withdrawal[]): void {
  write(KEY, list);
}

/** Move any `pending` withdrawal older than SETTLE_MS to `paid`.
 *  Idempotent; returns the original reference when nothing changed
 *  so React's external-store snapshot stays stable. */
function sweepSettlements(): { list: Withdrawal[]; changed: boolean } {
  const now = Date.now();
  const nowIso = new Date().toISOString();
  const list = getAll();
  let mutated = false;
  const next = list.map((w) => {
    if (w.status !== "pending") return w;
    const requested = new Date(w.requestedAt).getTime();
    if (now - requested < SETTLE_MS) return w;
    mutated = true;
    return {
      ...w,
      status: "paid" as const,
      completedAt: nowIso,
    };
  });
  if (mutated) {
    setAll(next);
    return { list: next, changed: true };
  }
  return { list, changed: false };
}

// ─── Public API ───────────────────────────────────────────────

export interface WithdrawInput {
  amountCents: number;
  method: Withdrawal["method"];
}

export function requestWithdrawal(
  input: WithdrawInput,
): { ok: true; record: Withdrawal } | { ok: false; reason: string } {
  if (input.amountCents <= 0) {
    return { ok: false, reason: "Add an amount." };
  }
  if (!input.method || !input.method.lastFour) {
    return { ok: false, reason: "Add a payout method first." };
  }
  const record: Withdrawal = {
    id: uid(),
    amountCents: input.amountCents,
    requestedAt: new Date().toISOString(),
    status: "pending",
    method: input.method,
  };
  setAll([record, ...getAll()]);

  // Stub the processor's webhook: schedule a sweep once the
  // settlement window has passed. Real provider replaces this
  // with a server-side state transition.
  if (typeof window !== "undefined") {
    window.setTimeout(() => {
      sweepSettlements();
    }, SETTLE_MS + 100);
  }

  return { ok: true, record };
}

/** Sum of all non-failed withdrawals — what's been (or is being)
 *  paid out, in cents. Pending counts; failed does not. */
export function withdrawnCents(list: Withdrawal[]): number {
  return list
    .filter((w) => w.status !== "failed")
    .reduce((s, w) => s + w.amountCents, 0);
}

// ─── Reactive binding ─────────────────────────────────────────

export function useWithdrawals(): Withdrawal[] {
  return useExternal(KEY, () => {
    sweepSettlements();
    return getAll();
  });
}

/** Force a re-sweep — useful when a pending withdrawal exists and
 *  we want the UI to pick up the settlement transition on a timer
 *  rather than waiting for the next unrelated render. */
export function tickWithdrawals(): void {
  const { changed } = sweepSettlements();
  if (changed) {
    // setAll already notified subscribers; nothing else to do.
  }
}
