import type { Profile } from "../types";
import { read, subscribe, write } from "./storage";

/**
 * Public directory of all ReachMe handles on this device.
 *
 * In production this becomes a server-side query. For now it lets
 * a sender land on /someone-elses-handle and find the right page,
 * and lets the "Find someone" search return real results.
 */

const DIRECTORY_KEY = "directory";

const SEED_DIRECTORY: Profile[] = [
  {
    handle: "youssefbenyahia",
    displayName: "Youssef Benyahia",
    title: "Founder & Investor",
    bio: "I review serious business, partnership, and acquisition opportunities. The amount filters volume; the reply earns it back.",
    minAmountCents: 9500,
    replyWindowDays: 7,
    categories: [
      { id: "business", label: "Business opportunity" },
      { id: "partnership", label: "Partnership" },
      { id: "intro", label: "Intro request" },
      { id: "advice", label: "Advice request" },
    ],
    visibility: "public",
    verified: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    handle: "marawright",
    displayName: "Mara Wright",
    title: "Partner, Northline Capital",
    bio: "Reading early-stage decks at the seed and Series A stage. If you can describe your wedge in one sentence, I will read.",
    minAmountCents: 25000,
    replyWindowDays: 7,
    categories: [
      { id: "business", label: "Business opportunity" },
      { id: "intro", label: "Intro request" },
      { id: "advice", label: "Advice request" },
    ],
    visibility: "public",
    verified: true,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    handle: "jonas",
    displayName: "Jonas Lindberg",
    title: "Independent designer",
    bio: "Brand identity, type, motion. Booked through 2026. Take a serious request as your starting point.",
    minAmountCents: 12500,
    replyWindowDays: 7,
    categories: [
      { id: "consulting", label: "Consulting" },
      { id: "collab", label: "Collaboration" },
      { id: "speaking", label: "Speaking" },
    ],
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
 */
function ensureSeed(): Profile[] {
  const current = read<Profile[] | null>(DIRECTORY_KEY, null);
  if (current && Array.isArray(current) && current.length) return current;
  // First call ever — seed the directory. Fire-and-forget; the
  // notify is harmless because no hook subscribes to the directory
  // key during render.
  write(DIRECTORY_KEY, SEED_DIRECTORY);
  return SEED_DIRECTORY;
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

export function subscribeDirectory(fn: () => void) {
  return subscribe(DIRECTORY_KEY, fn);
}
