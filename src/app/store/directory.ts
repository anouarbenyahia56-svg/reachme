import type { Profile } from "../types";
import { read, write } from "./storage";

/**
 * Public directory of all ReachMe handles on this device.
 *
 * In production this becomes a server-side query. For now it lets
 * a sender land on /someone-elses-handle and find the right page.
 * The directory stores owner profiles, not sender profiles.
 */

const DIRECTORY_KEY = "directory";

const SEED_DIRECTORY: Profile[] = [
  {
    handle: "youssefbenyahia",
    displayName: "Youssef Benyahia",
    title: "Founder & Investor",
    minAmountCents: 9500,
    replyWindowDays: 7,
    categories: [
      { id: "business", label: "Business opportunity" },
      { id: "partnership", label: "Partnership" },
      { id: "intro", label: "Intro request" },
      { id: "advice", label: "Advice request" },
    ],
    socials: {
      x: "https://x.com/youssefby",
      linkedin: "https://www.linkedin.com/in/youssefbenyahia",
      github: "https://github.com/youssefby",
    },
    visibility: "public",
    verified: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    handle: "marawright",
    displayName: "Mara Wright",
    title: "Partner, Northline Capital",
    minAmountCents: 25000,
    replyWindowDays: 7,
    categories: [
      { id: "business", label: "Business opportunity" },
      { id: "intro", label: "Intro request" },
      { id: "advice", label: "Advice request" },
    ],
    socials: {
      instagram: "https://instagram.com/marawright",
      facebook: "https://facebook.com/marawright",
      x: "https://x.com/marawright",
      linkedin: "https://www.linkedin.com/in/marawright",
    },
    visibility: "public",
    verified: true,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    handle: "jonas",
    displayName: "Jonas Lindberg",
    title: "Independent designer",
    minAmountCents: 12500,
    replyWindowDays: 7,
    categories: [
      { id: "consulting", label: "Consulting" },
      { id: "collab", label: "Collaboration" },
      { id: "speaking", label: "Speaking" },
    ],
    socials: {
      instagram: "https://instagram.com/jonaslindberg",
      tiktok: "https://tiktok.com/@jonaslindberg",
      youtube: "https://youtube.com/@jonaslindberg",
      twitch: "https://twitch.tv/jonaslindberg",
      spotify: "https://open.spotify.com/user/jonaslindberg",
    },
    visibility: "public",
    verified: false,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * Returns the directory, seeding it on first call.
 *
 * The seed write happens lazily here. We tolerate it being called
 * during render (e.g. from search-as-you-type validators) because
 * the storage layer keeps the cached reference stable and the
 * notify only fires on the very first call.
 *
 * On subsequent calls we run a non-destructive migration:
 * for any handle that exists in both the stored directory and
 * the current SEED, new fields on the seed (e.g. `socials`) are
 * backfilled onto the stored entry. Owner edits to existing
 * fields are preserved. The migration is idempotent — re-running
 * it is a no-op.
 */
function ensureSeed(): Profile[] {
  const current = read<Profile[] | null>(DIRECTORY_KEY, null);
  if (!current || !Array.isArray(current) || !current.length) {
    write(DIRECTORY_KEY, SEED_DIRECTORY);
    return SEED_DIRECTORY;
  }
  const seedByHandle = new Map(
    SEED_DIRECTORY.map((s) => [s.handle.toLowerCase(), s]),
  );
  let dirty = false;
  const migrated = current.map((entry) => {
    const seed = seedByHandle.get(entry.handle.toLowerCase());
    if (!seed) return entry;
    // Seed first, entry second — owner-edited fields win, new
    // seed fields are backfilled.
    const next = { ...seed, ...entry };
    if (JSON.stringify(next) !== JSON.stringify(entry)) dirty = true;
    return next;
  });
  if (dirty) write(DIRECTORY_KEY, migrated);
  return dirty ? migrated : current;
}

export function listDirectory(): Profile[] {
  return ensureSeed();
}

export function findInDirectory(handle: string): Profile | null {
  return (
    ensureSeed().find(
      (p) => p.handle.toLowerCase() === handle.toLowerCase(),
    ) ?? null
  );
}

export function upsertDirectory(profile: Profile): void {
  const dir = ensureSeed();
  const next = dir.filter(
    (p) => p.handle.toLowerCase() !== profile.handle.toLowerCase(),
  );
  next.push(profile);
  write(DIRECTORY_KEY, next);
}

export function isHandleTaken(handle: string): boolean {
  return ensureSeed().some(
    (p) => p.handle.toLowerCase() === handle.toLowerCase(),
  );
}

/**
 * Emails already attached to a profile on this device.
 *
 * In production this becomes a server-side uniqueness check. For
 * the client-only demo it lets the email step show the "already
 * registered" branch the way the real flow will, so the error
 * styling and copy can be exercised end-to-end.
 */
const REGISTERED_EMAILS: ReadonlySet<string> = new Set(
  [
    "youssef@reachme.com",
    "mara@reachme.com",
    "jonas@reachme.com",
  ].map((e) => e.toLowerCase()),
);

export function isEmailRegistered(email: string): boolean {
  return REGISTERED_EMAILS.has(email.trim().toLowerCase());
}
