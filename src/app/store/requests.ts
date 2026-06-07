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
 * Requests store — owner's inbox and sender's outbox.
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

export const PLATFORM_FEE_BPS = 500; // 5% on completed reply

/** Platform fee in cents for a given gross amount. Applied on
 *  release only; declined and expired requests are fully refunded. */
export function platformFeeCents(amountCents: number): number {
  return Math.round((amountCents * PLATFORM_FEE_BPS) / 10_000);
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
  const owner = findInDirectory(input.toHandle);
  if (!owner) {
    return { ok: false, reason: "Page not found." };
  }
  const me = getProfile();
  if (me && me.handle.toLowerCase() === owner.handle.toLowerCase()) {
    return {
      ok: false,
      reason: "You can't send a request to your own page.",
    };
  }
  if (owner.visibility === "paused") {
    return { ok: false, reason: "This page is not currently accepting requests." };
  }
  if (input.amountCents < owner.minAmountCents) {
    return { ok: false, reason: "Below the minimum signal." };
  }
  const cat = owner.categories.find((c) => c.id === input.category);
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
    now.getTime() + owner.replyWindowDays * MS_PER_DAY,
  );

  const record: RequestRecord = {
    id: uid(),
    toHandle: owner.handle,
    toDisplayName: owner.displayName,
    toAvatarUrl: owner.avatarUrl,
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

  // Owner-side delivery.
  //
  // In a real backend, the request lands in the owner's server-side
  // inbox. Locally, we only persist it into this device's `received`
  // list when the owner *is* this device's logged-in user — otherwise
  // the local inbox would fill with noise every time the same person
  // tested another handle.
  if (me && me.handle.toLowerCase() === owner.handle.toLowerCase()) {
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
  let changed = false;
  const update = <T extends RequestRecord>(r: T): T => {
    if (r.id !== id || r.status !== "pending") return r;
    changed = true;
    return {
      ...r,
      status: "replied",
      reply: { body: body.trim(), repliedAt: now },
      escrow: {
        ...r.escrow,
        releasedAt: now,
        feeCents: platformFeeCents(r.amountCents),
      },
    } as T;
  };
  setReceived(getReceived().map(update));
  setSent(getSent().map(update));
  return changed;
}

export function declineRequest(id: string, reason?: string): boolean {
  const now = new Date().toISOString();
  let changed = false;
  const update = <T extends RequestRecord>(r: T): T => {
    if (r.id !== id || r.status !== "pending") return r;
    changed = true;
    return {
      ...r,
      status: "declined",
      decline: { reason: reason?.trim() || undefined, declinedAt: now },
      escrow: { ...r.escrow, refundedAt: now },
    } as T;
  };
  setReceived(getReceived().map(update));
  setSent(getSent().map(update));
  return changed;
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
    now.getTime() + profile.replyWindowDays * MS_PER_DAY,
  );
  const cat = profile.categories[0];
  if (!cat) return;

  const welcome: ReceivedRequest = {
    id: seedId,
    toHandle: profile.handle,
    toDisplayName: profile.displayName,
    toAvatarUrl: profile.avatarUrl,
    from: {
      name: "Sarah Chen",
      email: "sarah@meridianventures.com",
      organization: "Meridian Ventures",
    },
    category: cat.id,
    subject: "Partnership conversation",
    message:
      "Hi — I've been following your work for a while and I think there's a strong alignment between what you're building and where our portfolio is heading. We're backing a few companies in this space and I'd love to explore whether there's a fit for a closer collaboration.\n\nWould you be open to a 30-minute call sometime this week? Happy to work around your schedule.",
    amountCents: profile.minAmountCents,
    status: "pending",
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    escrow: { heldAt: now.toISOString() },
  };
  setReceived([welcome, ...getReceived()]);
}
