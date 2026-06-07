import { read, write } from "./storage";
import type { ISODate } from "../types";

/**
 * Email verification — the auth handshake before a page goes live.
 *
 * In production this is server-driven: the server generates and
 * emails the code, the client never sees it, and the server
 * compares on submit. Locally we still persist a `lastSentAt`
 * timestamp so the `Resend` button honours a real cooldown — the
 * same one a real backend would enforce on the wire.
 *
 * The demo `Verify email` button in the dashboard flips
 * `profile.verified` directly to model the link-click path; it
 * does not go through a code challenge.
 */

const KEY = "auth.verification";

/** Minimum seconds between consecutive verification requests. */
const RESEND_COOLDOWN_MS = 30 * 1000;

interface VerificationMeta {
  email: string;
  lastSentAt: ISODate;
}

function getMeta(): VerificationMeta | null {
  return read<VerificationMeta | null>(KEY, null);
}

/** Milliseconds remaining before a resend is allowed, or 0. */
export function resendCooldownRemaining(): number {
  const m = getMeta();
  if (!m) return 0;
  const elapsed = Date.now() - new Date(m.lastSentAt).getTime();
  return Math.max(0, RESEND_COOLDOWN_MS - elapsed);
}

/**
 * Request a fresh verification challenge for an email.
 *
 * Honours the resend cooldown: if a recent challenge for the same
 * email was issued within the cooldown window, the existing
 * timestamp is preserved so the UI's countdown stays accurate.
 */
export function requestVerification(email: string): void {
  const existing = getMeta();
  const t = Date.now();
  const withinCooldown =
    existing &&
    existing.email === email &&
    t - new Date(existing.lastSentAt).getTime() < RESEND_COOLDOWN_MS;
  if (withinCooldown) return;

  write(KEY, {
    email,
    lastSentAt: new Date(t).toISOString(),
  } satisfies VerificationMeta);
}
