/**
 * Domain types for the ReachMe application.
 *
 * Designed so that authentication, a backend database, and a real
 * payment processor can drop in without changing the shape of the
 * data the UI renders. The "amount signal" is modelled as escrow
 * from the first commit:
 *
 *   pending  → held on submission
 *   replied  → released to recipient (less platform fee)
 *   declined → refunded to sender
 *   expired  → refunded to sender
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

/** A category the page owner accepts requests under. */
export interface Category {
  id: string;
  label: string;
}

/** The page owner's profile — what senders see, and what the
 *  dashboard manages. Persisted locally; ready to be moved to a
 *  user record in a real database. */
export interface Profile {
  /** The handle is the public address: reachme.com/{handle} */
  handle: string;
  displayName: string;
  /** A short role label sitting under the display name. */
  title: string;
  bio: string;
  /** Data URL or future remote URL — same shape, swap the source. */
  avatarUrl?: string;
  bannerUrl?: string;
  /** Minimum amount, in cents, that a sender must attach. */
  minAmountCents: number;
  /** Reply window in days. Selectable by the page owner: 3, 7,
   *  or 14. Defaults to 7. */
  replyWindowDays: number;
  categories: Category[];
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
 *  the receiver side — the recipient sees what they need, not more. */
export interface SenderContact {
  name: string;
  email: string;
  /** A line of professional context — who they are, beyond a name. */
  context?: string;
  organization?: string;
}

/** A single request. Lives in either the receiver's "received"
 *  inbox or the sender's "sent" outbox depending on whose store
 *  it is in — the shape is identical. */
export interface RequestRecord {
  id: string;
  /** Handle of the recipient (the page owner the request was sent to). */
  toHandle: string;
  /** Display name & avatar snapshot of the recipient at send time. */
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

/** Snapshot stored locally for the recipient's inbox. */
export type ReceivedRequest = RequestRecord;
