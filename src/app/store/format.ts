/**
 * Formatting utilities — money, time, identity. One source of
 * truth, used everywhere, so the language is consistent.
 */

export function formatMoney(
  cents: number,
  opts: { withCents?: boolean } = {},
): string {
  const dollars = cents / 100;
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits:
      opts.withCents || dollars % 1 !== 0 ? 2 : 0,
    maximumFractionDigits:
      opts.withCents || dollars % 1 !== 0 ? 2 : 0,
  });
  return formatter.format(dollars);
}

export function parseMoneyToCents(input: string): number {
  const cleaned = input.replace(/[^\d.]/g, "");
  if (!cleaned) return 0;
  const value = parseFloat(cleaned);
  if (Number.isNaN(value)) return 0;
  return Math.round(value * 100);
}

/** "3 minutes ago", "2 hours ago", "yesterday", "3 days ago", "Jun 4". */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const sec = Math.round(diffMs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);

  if (sec < 30) return "just now";
  if (min < 1) return `${sec}s ago`;
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day === 1) return "yesterday";
  if (day < 7) return `${day} days ago`;

  return then.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year:
      then.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

/** "in 6 days", "in 3 hours", "in 12 minutes", "expired". */
export function timeUntil(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const diffMs = then.getTime() - now.getTime();
  if (diffMs <= 0) return "expired";
  const sec = Math.round(diffMs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);

  if (min < 60) return `in ${Math.max(min, 1)}m`;
  if (hr < 24) return `in ${hr}h`;
  return `in ${day} ${day === 1 ? "day" : "days"}`;
}

export function dateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

export function isHandleAvailable(
  handle: string,
  reservedHandles: readonly string[] = RESERVED,
): boolean {
  return !reservedHandles.includes(handle.toLowerCase());
}

export function isHandleValid(handle: string): boolean {
  return /^[a-z0-9][a-z0-9_-]{0,29}$/.test(handle.toLowerCase());
}

/** Reserved system paths so handles never collide with routes. */
export const RESERVED: readonly string[] = [
  "claim",
  "login",
  "logout",
  "signup",
  "find",
  "dashboard",
  "settings",
  "received",
  "sent",
  "page",
  "earnings",
  "admin",
  "api",
  "about",
  "pricing",
  "terms",
  "privacy",
  "help",
  "support",
  "contact",
  "reachme",
  "www",
  "app",
];
