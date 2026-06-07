/**
 * Domain types for the ReachMe application.
 *
 * Designed so that authentication, a backend database, and a real
 * payment processor can drop in without changing the shape of the
 * data the UI renders. The "amount signal" is modelled as escrow
 * from the first commit:
 *
 *   pending  → held on submission
 *   replied  → released to owner (less platform fee)
 *   declined → refunded to sender
 *   expired  → refunded to sender
 *
 * The two core actors are named consistently throughout the app:
 *   • sender — the person who submits a request and attaches the amount
 *   • owner  — the person whose page receives the request and decides
 *
 * Times are stored as ISO strings; amounts are integer cents.
 */

export type ISODate = string;

export type Visibility = "public" | "paused";

export type RequestStatus =
  | "pending"
  | "replied"
  | "declined"
  | "expired";

/** A category the owner accepts requests under. */
export interface Category {
  id: string;
  label: string;
}

/** Social platforms supported on the public profile card.
 *  Each value is the platform key stored on `Profile.socials`. */
export type SocialPlatform =
  | "instagram"
  | "x"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "twitch"
  | "kick"
  | "linkedin"
  | "github"
  | "spotify"
  | "pinterest";

/** Map of platform -> full URL. Only present platforms render.
 *  Stored as full URLs so the card never guesses; the owner
 *  controls exactly where each link points. */
export type Socials = Partial<Record<SocialPlatform, string>>;

/** The owner's profile — what senders see, and what the
 *  dashboard manages. Persisted locally; ready to be moved to a
 *  user record in a real database. */
export interface Profile {
  /** The handle is the public address: reachme.com/{handle} */
  handle: string;
  displayName: string;
  /** A short role label sitting under the display name. */
  title: string;
  /** Data URL or future remote URL — same shape, swap the source. */
  avatarUrl?: string;
  /** Minimum amount, in cents, that a sender must attach. */
  minAmountCents: number;
  /** Reply window in days. Selectable by the owner: 3, 5,
   *  or 7. Defaults to 5. */
  replyWindowDays: number;
  categories: Category[];
  /** Optional social links rendered on the public card. */
  socials?: Socials;
  visibility: Visibility;
  verified: boolean;
  /** When the profile was first activated. */
  createdAt: ISODate;
}

/** The owner of this device's session. Once auth is real, this
 *  becomes the result of a token exchange — same shape. */
export interface Account {
  email: string;
  displayName: string;
  /** True once onboarding is complete and a profile exists. */
  hasProfile: boolean;
}

/** Sender contact carried with every request. Stored opaquely on
 *  the owner's side — the owner sees what they need, not more. */
export interface SenderContact {
  name: string;
  email: string;
  /** A line of professional context — who they are, beyond a name. */
  context?: string;
  organization?: string;
}

/** A single request. Lives in either the owner's "received"
 *  inbox or the sender's "sent" outbox depending on whose store
 *  it is in — the shape is identical. */
export interface RequestRecord {
  id: string;
  /** Handle of the owner the request was sent to. */
  toHandle: string;
  /** Display name & avatar snapshot of the owner at send time. */
  toDisplayName: string;
  toAvatarUrl?: string;
  /** Sender. */
  from: SenderContact;
  category: string;
  subject: string;
  message: string;
  amountCents: number;
  status: RequestStatus;
  createdAt: ISODate;
  expiresAt: ISODate;
  /** Set when status becomes "replied". */
  reply?: {
    body: string;
    repliedAt: ISODate;
  };
  /** Set when status becomes "declined". */
  decline?: {
    reason?: string;
    declinedAt: ISODate;
  };
  /** Audit of the escrow lifecycle. Mirrors what a payment
   *  processor will do; the UI reads this directly. */
  escrow: {
    /** Always held on submit. */
    heldAt: ISODate;
    releasedAt?: ISODate;
    refundedAt?: ISODate;
    /** Platform fee in cents — applied on release only. */
    feeCents?: number;
  };
}

/** Snapshot stored locally so a sender can see their own outbox. */
export type SentRequest = RequestRecord;

/** Snapshot stored locally for the owner's inbox. */
export type ReceivedRequest = RequestRecord;

// ─── Payouts ───────────────────────────────────────────────────
//
// The payout / withdrawal types are designed to mirror what
// Stripe Connect (or a similar processor) returns so the swap
// to a real backend is a data-layer change, not a UI rewrite.

export type PayoutMethodKind = "bank";

/** A saved destination the owner can withdraw to. Single entry
 *  for v1; the shape supports multiple methods when needed. */
export interface PayoutMethod {
  id: string;
  kind: PayoutMethodKind;
  /** Display label — bank name, "PayPal", etc. */
  label: string;
  /** Last 4 digits of account or card. */
  lastFour: string;
  currency: "USD";
  /** Set when KYC / micro-deposit verification completes. */
  verifiedAt?: ISODate;
  createdAt: ISODate;
}

export type WithdrawalStatus = "pending" | "paid" | "failed";

/** A single withdrawal request. The owner-visible balance is
 *  `lifetime released − sum(non-failed withdrawals)`. Status
 *  moves pending → paid (or failed) as the processor settles. */
export interface Withdrawal {
  id: string;
  amountCents: number;
  requestedAt: ISODate;
  completedAt?: ISODate;
  status: WithdrawalStatus;
  /** Method snapshot at the moment of request — so the row stays
   *  truthful even if the owner later removes or changes the method. */
  method: {
    kind: PayoutMethodKind;
    label: string;
    lastFour: string;
  };
  failureReason?: string;
}
