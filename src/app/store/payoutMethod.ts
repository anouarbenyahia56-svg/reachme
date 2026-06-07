import type { PayoutMethod } from "../types";
import { read, write, remove } from "./storage";
import { useExternal } from "./useExternal";

/**
 * Payout method — the destination withdrawals are sent to.
 *
 * One method per account for v1; the shape is a record so it
 * extends to multiple methods (bank + PayPal, etc.) without a
 * migration. The fields mirror what Stripe Connect's external
 * accounts API returns so the swap to a real provider is a
 * data-layer change.
 */

const KEY = "payout.method";

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `pm_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function getPayoutMethod(): PayoutMethod | null {
  return read<PayoutMethod | null>(KEY, null);
}

/** Save (or replace) the payout method. Stubbed: the local flow
 *  marks the method as instantly verified so the demo can withdraw
 *  immediately; the real provider will set `verifiedAt` only after
 *  micro-deposits / instant-verify completes. */
export function savePayoutMethod(input: {
  label: string;
  lastFour: string;
}): PayoutMethod {
  const now = new Date().toISOString();
  const method: PayoutMethod = {
    id: uid(),
    kind: "bank",
    label: input.label.trim(),
    lastFour: input.lastFour.trim(),
    currency: "USD",
    verifiedAt: now,
    createdAt: now,
  };
  write<PayoutMethod>(KEY, method);
  return method;
}

export function clearPayoutMethod(): void {
  remove(KEY);
}

export function usePayoutMethod(): PayoutMethod | null {
  return useExternal(KEY, getPayoutMethod);
}
