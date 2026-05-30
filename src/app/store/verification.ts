import { read, write, remove } from "./storage";
import type { ISODate } from "../types";
import { useExternal } from "./useExternal";

/**
 * Email verification — the auth handshake before a page goes live.
 *
 * This is structured as a real verification challenge, not a UI
 * placeholder, so a production auth provider can slot in by
 * replacing only the transport (`deliverCode`) and the verify
 * comparison (which, server-side, never exposes the code to the
 * client). Everything else — challenge issuance, expiry, attempt
 * limiting, resend cooldown, and the persisted state machine —
 * is already correct.
 *
 * Production swap notes:
 *   • `deliverCode` becomes `POST /auth/verifications` (server
 *     generates + emails the code; client never sees it).
 *   • `verifyCode` becomes `POST /auth/verifications/:id/verify`
 *     and the server compares; the client only learns ok / reason.
 *   • The persisted `Challenge.code` field disappears entirely —
 *     it exists here only because there is no server to hold it.
 */

const KEY = "auth.verification";

/** Code lifetime and guardrails. Tunable; mirror these on a real
 *  backend so the UI's countdowns and limits stay accurate. */
const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
const MAX_ATTEMPTS = 5;
const CODE_LENGTH = 6;

export interface Challenge {
  email: string;
  /** LOCAL-ONLY. A server holds this; the client never would.
   *  Present here purely because there is no backend to verify
   *  against in this build. */
  code: string;
  issuedAt: ISODate;
  expiresAt: ISODate;
  lastSentAt: ISODate;
  attempts: number;
  verified: boolean;
}

export type VerifyResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "no-challenge"
        | "expired"
        | "too-many-attempts"
        | "mismatch";
      message: string;
    };

function now(): number {
  return Date.now();
}

function generateCode(): string {
  // Cryptographically-sound digits where available; falls back to
  // Math.random only if the platform has no crypto.
  let out = "";
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const buf = new Uint32Array(CODE_LENGTH);
    crypto.getRandomValues(buf);
    for (let i = 0; i < CODE_LENGTH; i++) out += String(buf[i] % 10);
  } else {
    for (let i = 0; i < CODE_LENGTH; i++)
      out += String(Math.floor(Math.random() * 10));
  }
  return out;
}

export function getChallenge(): Challenge | null {
  return read<Challenge | null>(KEY, null);
}

export function useChallenge(): Challenge | null {
  return useExternal(KEY, getChallenge);
}

/**
 * Issue (or re-issue) a verification challenge for an email.
 *
 * Returns the generated code so this build's transport can surface
 * it (a real backend would email it and return nothing sensitive).
 * Honours the resend cooldown: if a live challenge for the same
 * email was sent within the cooldown window, the existing code is
 * reused rather than churning a new one.
 */
export function requestVerification(email: string): {
  code: string;
  resent: boolean;
} {
  const existing = getChallenge();
  const t = now();

  if (
    existing &&
    existing.email === email &&
    !existing.verified &&
    new Date(existing.expiresAt).getTime() > t &&
    t - new Date(existing.lastSentAt).getTime() < RESEND_COOLDOWN_MS
  ) {
    // Within cooldown — reuse the active code, just report it.
    return { code: existing.code, resent: false };
  }

  const code = generateCode();
  const challenge: Challenge = {
    email,
    code,
    issuedAt: new Date(t).toISOString(),
    expiresAt: new Date(t + CODE_TTL_MS).toISOString(),
    lastSentAt: new Date(t).toISOString(),
    attempts: 0,
    verified: false,
  };
  write(KEY, challenge);
  return { code, resent: Boolean(existing) };
}

/** Milliseconds remaining before a resend is allowed, or 0. */
export function resendCooldownRemaining(): number {
  const c = getChallenge();
  if (!c) return 0;
  const elapsed = now() - new Date(c.lastSentAt).getTime();
  return Math.max(0, RESEND_COOLDOWN_MS - elapsed);
}

export function verifyCode(input: string): VerifyResult {
  const c = getChallenge();
  if (!c) {
    return {
      ok: false,
      reason: "no-challenge",
      message: "Your code expired. Send a new one.",
    };
  }
  if (now() > new Date(c.expiresAt).getTime()) {
    return {
      ok: false,
      reason: "expired",
      message: "That code has expired. Send a new one.",
    };
  }
  if (c.attempts >= MAX_ATTEMPTS) {
    return {
      ok: false,
      reason: "too-many-attempts",
      message: "Too many tries. Send a new code to continue.",
    };
  }

  const submitted = input.replace(/\D/g, "");
  if (submitted !== c.code) {
    write(KEY, { ...c, attempts: c.attempts + 1 });
    const left = MAX_ATTEMPTS - (c.attempts + 1);
    return {
      ok: false,
      reason: "mismatch",
      message:
        left > 0
          ? `That code isn't right. ${left} ${left === 1 ? "try" : "tries"} left.`
          : "That code isn't right. Send a new code to continue.",
    };
  }

  write(KEY, { ...c, verified: true });
  return { ok: true };
}

export function clearVerification(): void {
  remove(KEY);
}

export const VERIFICATION_CONSTANTS = {
  CODE_TTL_MS,
  RESEND_COOLDOWN_MS,
  MAX_ATTEMPTS,
  CODE_LENGTH,
} as const;
