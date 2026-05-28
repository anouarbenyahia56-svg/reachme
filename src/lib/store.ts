/**
 * Storage layer.
 *
 * A single interface (`Store`) the application codes against, and a
 * localStorage-backed implementation that satisfies it today. When
 * the real backend lands (Postgres + an API), only the implementation
 * gets swapped — calling code does not change.
 *
 * Per the React composition skill (`state-decouple-implementation`):
 * the provider is the only place that knows how state is managed.
 */

import {
  type HandleAvailability,
  type Profile,
  type RequestItem,
  type Session,
  RESERVED_HANDLES,
  validateHandleSyntax,
} from "./domain";

// ─── Public interface ──────────────────────────────────────────────────────

export interface Store {
  // Profile
  checkHandleAvailability(handle: string): Promise<HandleAvailability>;
  getProfileByHandle(handle: string): Promise<Profile | null>;
  upsertProfile(profile: Profile): Promise<Profile>;

  // Auth (stubbed magic-link until Better Auth lands)
  beginSignIn(email: string, intendedHandle?: string): Promise<{ token: string }>;
  completeSignIn(token: string): Promise<Session>;
  getSession(): Promise<Session | null>;
  signOut(): Promise<void>;

  // Requests (sender → owner)
  createRequest(input: NewRequestInput): Promise<RequestItem>;
  listRequestsFor(handle: string): Promise<RequestItem[]>;
  updateRequest(
    id: string,
    patch: Partial<Pick<RequestItem, "status" | "reply" | "repliedAt">>,
  ): Promise<RequestItem>;
}

export interface NewRequestInput {
  ownerHandle: string;
  category: RequestItem["category"];
  subject: string;
  message: string;
  amount: number;
  senderName: string;
  senderEmail: string;
}

// ─── localStorage implementation ───────────────────────────────────────────
//
// Versioned keys (v1) so we can evolve the schema without leaking stale
// shapes. A real backend will replace this file entirely; the rest of
// the app already imports through `useStore()` and the Store interface.

const KEYS = {
  profiles: "reachme.v1.profiles",
  requests: "reachme.v1.requests",
  session: "reachme.v1.session",
  pending: "reachme.v1.pendingMagic",
} as const;

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage may be disabled (private browsing). Fail silent —
    // calling code shouldn't crash the UI for that.
  }
}

function id() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
  );
}

function nowIso() {
  return new Date().toISOString();
}

/** Simulated network latency so the UI's loading states are real. */
function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const localStore: Store = {
  async checkHandleAvailability(raw) {
    const handle = raw.trim().toLowerCase();
    const syntax = validateHandleSyntax(handle);
    if (syntax.state !== "available") return delay(syntax, 200);

    if (RESERVED_HANDLES.has(handle)) {
      // Silent — see Profile.published note in domain.ts.
      return delay({ state: "taken" }, 350);
    }

    const profiles = readJSON<Record<string, Profile>>(KEYS.profiles, {});
    if (profiles[handle]) {
      return delay({ state: "taken" }, 350);
    }
    return delay({ state: "available" }, 400);
  },

  async getProfileByHandle(handle) {
    const profiles = readJSON<Record<string, Profile>>(KEYS.profiles, {});
    return delay(profiles[handle.toLowerCase()] ?? null, 120);
  },

  async upsertProfile(profile) {
    const profiles = readJSON<Record<string, Profile>>(KEYS.profiles, {});
    profiles[profile.handle.toLowerCase()] = {
      ...profile,
      updatedAt: nowIso(),
    };
    writeJSON(KEYS.profiles, profiles);
    return delay(profiles[profile.handle.toLowerCase()]!, 200);
  },

  async beginSignIn(email, intendedHandle) {
    const token = id();
    writeJSON(KEYS.pending, {
      token,
      email: email.toLowerCase(),
      intendedHandle: intendedHandle?.toLowerCase() ?? null,
      createdAt: nowIso(),
    });
    // In a real backend, this is where the magic-link email is sent.
    // For local dev we expose the token via the URL (see /auth/verify).
    return delay({ token }, 600);
  },

  async completeSignIn(token) {
    const pending = readJSON<{
      token: string;
      email: string;
      intendedHandle: string | null;
    } | null>(KEYS.pending, null);

    if (!pending || pending.token !== token) {
      throw new Error("Invalid or expired sign-in link.");
    }

    const profiles = readJSON<Record<string, Profile>>(KEYS.profiles, {});

    // Find or create the profile this email owns.
    let profile = Object.values(profiles).find((p) => p.email === pending.email);

    if (!profile && pending.intendedHandle) {
      // First-time sign-in via the claim flow — create the draft profile.
      profile = {
        id: id(),
        handle: pending.intendedHandle,
        displayName: "",
        bio: "",
        floor: 100,
        categories: ["advisory", "intro", "partnership"],
        replyWindowDays: 7,
        published: false,
        email: pending.email,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      profiles[profile.handle] = profile;
      writeJSON(KEYS.profiles, profiles);
    }

    if (!profile) {
      throw new Error(
        "No ReachMe page found for this email. Claim a handle to get started.",
      );
    }

    const session: Session = {
      email: profile.email,
      handle: profile.handle,
    };
    writeJSON(KEYS.session, session);
    // Consume the pending token.
    if (isBrowser()) localStorage.removeItem(KEYS.pending);
    return delay(session, 300);
  },

  async getSession() {
    return delay(readJSON<Session | null>(KEYS.session, null), 60);
  },

  async signOut() {
    if (isBrowser()) localStorage.removeItem(KEYS.session);
    return delay(undefined, 100);
  },

  async createRequest(input) {
    const requests = readJSON<RequestItem[]>(KEYS.requests, []);
    const item: RequestItem = {
      id: id(),
      ownerHandle: input.ownerHandle.toLowerCase(),
      category: input.category,
      subject: input.subject.trim(),
      message: input.message.trim(),
      amount: input.amount,
      senderName: input.senderName.trim(),
      senderEmail: input.senderEmail.trim().toLowerCase(),
      status: "pending",
      createdAt: nowIso(),
      expiresAt: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    };
    requests.unshift(item);
    writeJSON(KEYS.requests, requests);
    return delay(item, 350);
  },

  async listRequestsFor(handle) {
    const requests = readJSON<RequestItem[]>(KEYS.requests, []);
    return delay(
      requests.filter((r) => r.ownerHandle === handle.toLowerCase()),
      120,
    );
  },

  async updateRequest(itemId, patch) {
    const requests = readJSON<RequestItem[]>(KEYS.requests, []);
    const idx = requests.findIndex((r) => r.id === itemId);
    if (idx === -1) throw new Error("Request not found.");
    requests[idx] = { ...requests[idx]!, ...patch };
    writeJSON(KEYS.requests, requests);
    return delay(requests[idx]!, 200);
  },
};
