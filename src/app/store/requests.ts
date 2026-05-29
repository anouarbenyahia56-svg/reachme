import type {
  Profile,
  ReceivedRequest,
  RequestRecord,
  SenderContact,
  SentRequest,
} from "../types";
import { read, write } from "./storage";
import { findInDirectory } from "./directory";
import { getProfile } from "./session";
import { useExternal } from "./useExternal";

/**
 * Requests store — receiver inbox and sender outbox.
 *
 * The amount-as-escrow lifecycle is enforced here:
 *
 *   submit   → held    (status=pending,  expiresAt=+replyWindow)
 *   reply    → release (status=replied,  fee deducted)
 *   decline  → refund  (status=declined)
 *   tick     → refund  (status=expired)  — when expiresAt passes
 *
 * The platform fee is a constant for now; trivial to make per-tier
 * later without UI rework.
 */

const RECEIVED_KEY = "received";
const SENT_KEY = "sent";

const PLATFORM_FEE_BPS = 500; // 5% on completed reply

function platformFee(amountCents: number): number {
  return Math.round((amountCents * PLATFORM_FEE_BPS) / 10_000);
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `r_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function getReceived(): ReceivedRequest[] {
  return read<ReceivedRequest[]>(RECEIVED_KEY, []);
}

function getSent(): SentRequest[] {
  return read<SentRequest[]>(SENT_KEY, []);
}

function setReceived(list: ReceivedRequest[]): void {
  write(RECEIVED_KEY, list);
}

function setSent(list: SentRequest[]): void {
  write(SENT_KEY, list);
}

/** Sweep: any pending request whose expiresAt has passed becomes
 *  expired and refunded. Idempotent — safe to call on every read.
 *  Crucially, when no statuses change we return the original list
 *  reference so React's external-store snapshot stays stable. */
function sweepExpirations(): {
  received: ReceivedRequest[];
  sent: SentRequest[];
  changed: boolean;
} {
  const now = new Date().toISOString();
  const receivedIn = getReceived();
  const sentIn = getSent();
  let changed = false;

  const sweep = <T extends RequestRecord>(list: T[]): T[] => {
    let mutated = false;
    const out = list.map((r) => {
      if (r.status !== "pending") return r;
      if (r.expiresAt > now) return r;
      mutated = true;
      changed = true;
      return {
        ...r,
        status: "expired",
        escrow: { ...r.escrow, refundedAt: now },
      } as T;
    });
    return mutated ? out : list;
  };

  const received = sweep(receivedIn);
  const sent = sweep(sentIn);

  if (changed) {
    setReceived(received);
    setSent(sent);
  }
  return { received, sent, changed };
}

// ─── Public API ───────────────────────────────────────────────────

export interface SubmitInput {
  toHandle: string;
  from: SenderContact;
  category: string;
  subject: string;
  message: string;
  amountCents: number;
}

export function submitRequest(
  input: SubmitInput,
): { ok: true; record: RequestRecord } | { ok: false; reason: string } {
  const recipient = findInDirectory(input.toHandle);
  if (!recipient) {
    return { ok: false, reason: "Page not found." };
  }
  if (recipient.visibility === "paused") {
    return { ok: false, reason: "This page is not currently accepting requests." };
  }
  if (input.amountCents < recipient.minAmountCents) {
    return { ok: false, reason: "Below the minimum signal." };
  }
  const cat = recipient.categories.find((c) => c.id === input.category);
  if (!cat) {
    return { ok: false, reason: "Choose a request category." };
  }
  if (!input.subject.trim() || !input.message.trim()) {
    return { ok: false, reason: "Subject and message are required." };
  }
  if (!input.from.name.trim() || !input.from.email.trim()) {
    return { ok: false, reason: "Add your name and email." };
  }

  const now = new Date();
  const expires = new Date(
    now.getTime() + recipient.replyWindowDays * 24 * 60 * 60 * 1000,
  );

  const record: RequestRecord = {
    id: uid(),
    toHandle: recipient.handle,
    toDisplayName: recipient.displayName,
    toAvatarUrl: recipient.avatarUrl,
    from: input.from,
    category: input.category,
    subject: input.subject.trim(),
    message: input.message.trim(),
    amountCents: input.amountCents,
    status: "pending",
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    escrow: { heldAt: now.toISOString() },
  };

  // Receiver-side delivery.
  //
  // In a real backend, the request lands in the recipient's
  // server-side inbox. Locally, we only persist it into this
  // device's `received` list when the recipient *is* this device's
  // page owner — otherwise the local inbox would fill with noise
  // every time the same person tested another handle.
  const profile = getProfile();
  if (profile && profile.handle.toLowerCase() === recipient.handle.toLowerCase()) {
    setReceived([record, ...getReceived()]);
  }

  // Sender side: always log to the local outbox so the sender's
  // dashboard reflects what they did.
  setSent([record, ...getSent()]);

  return { ok: true, record };
}

export function replyToRequest(id: string, body: string): boolean {
  if (!body.trim()) return false;
  const now = new Date().toISOString();
  const update = <T extends RequestRecord>(r: T): T =>
    r.id === id && r.status === "pending"
      ? ({
          ...r,
          status: "replied",
          reply: { body: body.trim(), repliedAt: now },
          escrow: {
            ...r.escrow,
            releasedAt: now,
            feeCents: platformFee(r.amountCents),
          },
        } as T)
      : r;
  setReceived(getReceived().map(update));
  setSent(getSent().map(update));
  return true;
}

export function declineRequest(id: string, reason?: string): boolean {
  const now = new Date().toISOString();
  const update = <T extends RequestRecord>(r: T): T =>
    r.id === id && r.status === "pending"
      ? ({
          ...r,
          status: "declined",
          decline: { reason: reason?.trim() || undefined, declinedAt: now },
          escrow: { ...r.escrow, refundedAt: now },
        } as T)
      : r;
  setReceived(getReceived().map(update));
  setSent(getSent().map(update));
  return true;
}

// ─── Reactive bindings ────────────────────────────────────────────

export function useReceived(): ReceivedRequest[] {
  return useExternal(RECEIVED_KEY, () => {
    sweepExpirations();
    return getReceived();
  });
}

export function useSent(): SentRequest[] {
  return useExternal(SENT_KEY, () => {
    sweepExpirations();
    return getSent();
  });
}

// ─── Receiver helpers (filtering by recipient) ─────────────────────

export function inboxFor(profile: Profile): ReceivedRequest[] {
  const target = profile.handle.toLowerCase();
  return getReceived().filter(
    (r) => r.toHandle.toLowerCase() === target,
  );
}

// ─── Demo seeding ─────────────────────────────────────────────────
//
// First-time profile owners get a single, gentle "welcome" request
// in their inbox so empty isn't the only thing they see on day one.
// Marked seedable with a stable id so we never seed twice.

export function seedDemoForOwner(profile: Profile): void {
  const seedId = `seed-welcome-${profile.handle}`;
  const existing = getReceived().find((r) => r.id === seedId);
  if (existing) return;

  const now = new Date();
  const expires = new Date(
    now.getTime() + profile.replyWindowDays * 24 * 60 * 60 * 1000,
  );
  const cat = profile.categories[0];
  if (!cat) return;

  const welcome: ReceivedRequest = {
    id: seedId,
    toHandle: profile.handle,
    toDisplayName: profile.displayName,
    toAvatarUrl: profile.avatarUrl,
    from: {
      name: "ReachMe",
      email: "hello@reachme.com",
      organization: "ReachMe",
    },
    category: cat.id,
    subject: "Welcome to your inbox",
    message:
      "This is what a serious request looks like. Reply, decline, or let it sit — the choice is yours. The amount is held until you decide.",
    amountCents: profile.minAmountCents,
    status: "pending",
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    escrow: { heldAt: now.toISOString() },
  };
  setReceived([welcome, ...getReceived()]);
}
