/**
 * Domain types — the platform's core entities.
 *
 * These are the source of truth for shape across server, client,
 * and any future API. The data store, the routes, the forms, the
 * auth — all consume from here. When we wire a real database,
 * the schema will mirror these names.
 */

export type Handle = string;

/** Reasons a sender might reach out. The owner picks which they accept. */
export const ALL_CATEGORIES = [
  "advisory",
  "intro",
  "investment",
  "media",
  "partnership",
  "speaking",
  "support",
  "other",
] as const;

export type Category = (typeof ALL_CATEGORIES)[number];

/** Human label for a category. Centralised so copy never drifts. */
export const CATEGORY_LABELS: Record<Category, string> = {
  advisory: "Advisory",
  intro: "Intro / Connection",
  investment: "Investment",
  media: "Media / Press",
  partnership: "Partnership",
  speaking: "Speaking",
  support: "Support",
  other: "Other",
};

/**
 * The owner's public + private profile. The public page renders from
 * the public subset; the editor binds the full object.
 */
export interface Profile {
  /** Stable ID. Email-keyed today, UUID tomorrow. */
  id: string;
  /** The handle in the URL — irreversible once claimed. */
  handle: Handle;
  /** Display name shown on the public page. */
  displayName: string;
  /** Single-line bio. */
  bio: string;
  /** Floor amount in USD. Senders cannot attach less. */
  floor: number;
  /** Categories the owner accepts. */
  categories: Category[];
  /** Reply window in days. Default 7. */
  replyWindowDays: number;
  /** Has the owner clicked "Make it live"? Drafts are private. */
  published: boolean;
  /** Owner's email — used for sign-in and request notifications. */
  email: string;
  /** ISO timestamp. */
  createdAt: string;
  /** ISO timestamp. */
  updatedAt: string;
}

/** A request from a sender, in any of its lifecycle states. */
export interface RequestItem {
  id: string;
  ownerHandle: Handle;
  category: Category;
  subject: string;
  message: string;
  amount: number;
  senderName: string;
  senderEmail: string;
  status: "pending" | "replied" | "declined" | "expired";
  createdAt: string;
  expiresAt: string;
  /** Set when the owner replies. */
  reply?: string;
  repliedAt?: string;
}

/** Authenticated session — null when no one is signed in. */
export interface Session {
  email: string;
  handle: Handle;
}

/**
 * Handles the platform reserves and won't allow as user handles.
 * Kept here so a single source of truth governs both the URL router
 * and the claim flow's availability check.
 *
 * Senders see a generic "this handle isn't available" — never the
 * specific reason. The reservation is a platform decision.
 */
export const RESERVED_HANDLES: ReadonlySet<string> = new Set([
  // Routes / app shell
  "api",
  "app",
  "auth",
  "claim",
  "find",
  "help",
  "home",
  "inbox",
  "legal",
  "login",
  "logout",
  "onboarding",
  "preview",
  "privacy",
  "r",
  "request",
  "settings",
  "share",
  "signin",
  "signout",
  "signup",
  "support",
  "terms",
  "user",
  "verify",
  // Brand reservations
  "about",
  "blog",
  "careers",
  "contact",
  "manifesto",
  "press",
  "reachme",
  "team",
  // Common short tokens that must be free for future use
  "admin",
  "dev",
  "docs",
  "internal",
  "root",
  "static",
  "test",
  "www",
]);

/** Validation rules for a handle, enforced everywhere it's set. */
export const HANDLE_RULES = {
  minLength: 2,
  maxLength: 24,
  /** Letters, numbers, underscores. No dashes (look weird in URLs at this scale). */
  pattern: /^[a-z0-9_]+$/,
} as const;

export type HandleAvailability =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "invalid"; reason: string }
  | { state: "taken" }
  | { state: "available" };

export function validateHandleSyntax(handle: string): HandleAvailability {
  const trimmed = handle.trim().toLowerCase();
  if (trimmed.length === 0) return { state: "idle" };
  if (trimmed.length < HANDLE_RULES.minLength) {
    return {
      state: "invalid",
      reason: `Must be at least ${HANDLE_RULES.minLength} characters.`,
    };
  }
  if (trimmed.length > HANDLE_RULES.maxLength) {
    return {
      state: "invalid",
      reason: `Must be at most ${HANDLE_RULES.maxLength} characters.`,
    };
  }
  if (!HANDLE_RULES.pattern.test(trimmed)) {
    return {
      state: "invalid",
      reason: "Letters, numbers, and underscores only.",
    };
  }
  return { state: "available" };
}
