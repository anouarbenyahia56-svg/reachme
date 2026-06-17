import type {
  Profile,
  ReceivedRequest,
  RequestAttachment,
  RequestRecord,
  SenderContact,
  SentRequest,
} from "../types";
import { read, write } from "./storage";
import { findInDirectory } from "./directory";
import { getProfile } from "./session";
import { useExternal } from "./useExternal";

// ─── Attachment storage ────────────────────────────────────────────
//
// Attachments are kept out of React state. The store holds the raw
// `File` objects in memory and creates short `blob:` URLs lazily on
// first access. Two reasons this matters:
//
//   1. Base64 data URLs are ~33% larger than the binary, fully
//      serialized through React's render pipeline, and force the
//      browser to decode megabytes of base64 into pixels for every
//      re-render. Blob URLs are tiny strings the browser resolves
//      natively against the already-decoded file.
//   2. Sending (or re-opening) a request with N attachments used
//      to call `readFileAsDataURL` on every file synchronously on
//      the main thread, blocking the UI for the duration. We now
//      hand the `File` straight through.
//
// The cache is keyed `requestId::scope::index` so the sender's
// message attachments and the owner's reply attachments can share
// a request id without colliding. The URL cache wraps each File in
// a blob URL the first time it's asked for and reuses that URL
// thereafter; the URL is revoked when the slot is overwritten or
// cleared.

const attachmentFileCache = new Map<string, File>();
const attachmentBlobUrlCache = new Map<string, string>();

export type AttachmentScope = "msg" | "reply";

function attachmentCacheKey(
  requestId: string,
  scope: AttachmentScope,
  index: number,
): string {
  return `${requestId}::${scope}::${index}`;
}

/** Persist the raw files for a request. The array must align with
 *  the attachment metadata stored on the record (same length, same
 *  order). Blob URLs are pre-created so the first render of the
 *  bubbles is immediate. */
export function saveAttachmentFiles(
  requestId: string,
  scope: AttachmentScope,
  files: ArrayLike<File | undefined>,
): void {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file) continue;
    const key = attachmentCacheKey(requestId, scope, i);
    attachmentFileCache.set(key, file);
    const prev = attachmentBlobUrlCache.get(key);
    if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
    attachmentBlobUrlCache.set(key, URL.createObjectURL(file));
  }
}

/** Synchronous lookup: returns the blob URL if the attachment is
 *  already cached, otherwise `undefined`. The bubble uses this on
 *  every render; the first time it returns undefined the URL is
 *  created on the next save (or on hydration from the in-memory
 *  cache after a page mount). */
export function getAttachmentUrl(
  requestId: string,
  scope: AttachmentScope,
  index: number,
): string | undefined {
  return attachmentBlobUrlCache.get(attachmentCacheKey(requestId, scope, index));
}

/** Revoke the blob URL and drop the File reference. Used when an
 *  attachment is removed or the request is cleared. */
export function revokeAttachmentUrl(
  requestId: string,
  scope: AttachmentScope,
  index: number,
): void {
  const key = attachmentCacheKey(requestId, scope, index);
  const url = attachmentBlobUrlCache.get(key);
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  attachmentBlobUrlCache.delete(key);
  attachmentFileCache.delete(key);
}

/** Drop every cached attachment for a request (both sender's
 *  message and owner's reply). */
export function clearAttachmentCache(requestId: string): void {
  const prefix = `${requestId}::`;
  for (const key of Array.from(attachmentBlobUrlCache.keys())) {
    if (!key.startsWith(prefix)) continue;
    const url = attachmentBlobUrlCache.get(key);
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    attachmentBlobUrlCache.delete(key);
    attachmentFileCache.delete(key);
  }
}

/**
 * Requests store — owner's inbox and sender's outbox.
 *
 * The amount-as-escrow lifecycle is enforced here:
 *
 *   submit   → held    (status=pending,  expiresAt=+replyWindow)
 *   reply    → release (status=replied,  fee deducted)
 *   tick     → refund  (status=expired)  — when expiresAt passes
 *
 * The platform fee is a constant for now; trivial to make per-tier
 * later without UI rework.
 */

const RECEIVED_KEY = "received";
const SENT_KEY = "sent";

export const PLATFORM_FEE_BPS = 500; // 5% on completed reply

/** Platform fee in cents for a given gross amount. Applied on
 *  release only; expired requests are fully refunded. */
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

/** Deterministic conversation ID for a sender-owner pair. Same
 *  email + same handle = same conversation, always. */
function getConversationId(senderEmail: string, ownerHandle: string): string {
  const email = senderEmail.trim().toLowerCase();
  const handle = ownerHandle.trim().toLowerCase();
  // Simple hash — not cryptographic, but stable and collision-free
  // enough for a local store. A backend would use a proper key.
  let hash = 0;
  const key = `${email}:${handle}`;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  }
  return `conv_${Math.abs(hash).toString(36)}`;
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
  /** Attachments supplied by the sender. Stored as data URLs so both
   *  sides can open and download them. */
  attachments?: RequestAttachment[];
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

  // The blob URLs from compose state are stripped before the record
  // is persisted — localStorage would otherwise fill with megabytes
  // of base64 and fail at the quota wall. The actual files are
  // handed to `saveAttachmentFiles` by the caller; the in-memory
  // cache resolves them back to short blob URLs on demand.
  const storedAttachments = input.attachments?.map(
    ({ url: _url, ...rest }) => rest,
  );

  const record: RequestRecord = {
    id: uid(),
    conversationId: getConversationId(input.from.email, owner.handle),
    toHandle: owner.handle,
    toDisplayName: owner.displayName,
    toAvatarUrl: owner.avatarUrl,
    from: input.from,
    category: input.category,
    subject: input.subject.trim(),
    message: input.message.trim(),
    ...(storedAttachments?.length ? { attachments: storedAttachments } : {}),
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

export function replyToRequest(
  id: string,
  body?: string,
  attachments?: RequestAttachment[],
): boolean {
  const hasBody = body && body.trim().length > 0;
  const hasAttachments = attachments && attachments.length > 0;
  if (!hasBody && !hasAttachments) return false;

  // Strip data URLs before storing — they're too large for localStorage.
  // Actual URLs are kept in the in-memory attachmentUrlCache.
  const storedAttachments = hasAttachments
    ? attachments!.map(({ url: _, ...rest }) => rest)
    : undefined;

  const now = new Date().toISOString();
  let changed = false;
  const update = <T extends RequestRecord>(r: T): T => {
    if (r.id !== id || r.status !== "pending") return r;
    changed = true;
    return {
      ...r,
      status: "replied",
      reply: {
        ...(hasBody ? { body: body!.trim() } : {}),
        ...(storedAttachments ? { attachments: storedAttachments } : {}),
        repliedAt: now,
      },
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

export function markOpened(id: string): void {
  const now = new Date().toISOString();
  const update = <T extends RequestRecord>(r: T): T => {
    if (r.id !== id || r.openedAt) return r;
    return { ...r, openedAt: now } as T;
  };
  setReceived(getReceived().map(update));
  setSent(getSent().map(update));
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

/** Get all requests in a conversation, sorted chronologically.
 *  Works for both the owner and sender side. */
export function getConversation(conversationId: string): RequestRecord[] {
  const all = [...getReceived(), ...getSent()];
  return all
    .filter((r) => r.conversationId === conversationId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
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
    conversationId: getConversationId("sarah@meridianventures.com", profile.handle),
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
