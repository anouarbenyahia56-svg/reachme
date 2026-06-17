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
  | "snapchat"
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
  /** Email address associated with this profile. */
  email: string;
  /** A short role label sitting under the display name. */
  title: string;
  /** Data URL or future remote URL — same shape, swap the source. */
  avatarUrl?: string;
  /** Optional background image for the public card. */
  backgroundUrl?: string;
  /** Minimum amount, in cents, that a sender must attach. */
  minAmountCents: number;
  /** Reply window in days. Selectable by the owner: 1, 2,
   *  or 3. Defaults to 2. */
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
  /** True once onboarding is complete and a profile exists. */
  hasProfile: boolean;
  /** True once the user has set a password. Controls whether
   *  Settings shows "Set password" or "Change password." */
  hasPassword: boolean;
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
 *  it is in — the shape is identical.
 *
 *  Each sender-owner pair shares one conversation thread. The
 *  `conversationId` groups all requests between the same two
 *  people. A follow-up is simply a new request with the same
 *  conversationId. */
export interface RequestRecord {
  id: string;
  /** Deterministic ID grouping all requests between the same
   *  sender email + owner handle. */
  conversationId: string;
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
  /** Attachments sent by the sender alongside the request. Stored as
   *  data URLs locally; openable and downloadable by both sender and owner. */
  attachments?: RequestAttachment[];
  amountCents: number;
  status: RequestStatus;
  createdAt: ISODate;
  /** Set when the owner opens the request detail. Used to show an
   *  unread indicator on pending rows in the inbox. */
  openedAt?: ISODate;
  expiresAt: ISODate;
  /** Set when status becomes "replied". The owner can reply with
   *  text, attachments (voice, video, files), or both. */
  reply?: {
    body?: string;
    attachments?: RequestAttachment[];
    repliedAt: ISODate;
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

/** An attachment included in a reply. For v1, stored as data
 *  URLs locally. For v2, swap to remote URLs from S3.
 *
 *  `url` is optional because the actual bytes live in the
 *  in-memory file cache (`requests.ts`) and are resolved to a
 *  short `blob:` URL on first access. Persisted records carry
 *  just the metadata so localStorage doesn't fill with base64. */
export interface RequestAttachment {
  type: "voice" | "video" | "file" | "image";
  url?: string;
  name?: string;
  /** Duration in seconds — for voice/video playback UI. */
  duration?: number;
  /** File size in bytes — shown for document attachments. */
  size?: number;
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
