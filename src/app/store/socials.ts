import type { SocialPlatform, Socials } from "../types";

/**
 * Socials — domain helpers for the owner's social links.
 *
 * The editor asks the owner for the simplest thing it can: their
 * handle on each platform (e.g. `@yourname`). We build the canonical
 * `https://…` URL the public card needs from that handle, per
 * platform. A pasted full URL is honored as-is so power users keep
 * full control.
 */

/** The canonical URL prefix used to build a public link from
 *  a bare handle on each platform. */
export const PLATFORM_URL_BASE: Record<SocialPlatform, string> = {
  instagram: "https://instagram.com/",
  x: "https://x.com/",
  facebook: "https://facebook.com/",
  tiktok: "https://tiktok.com/@",
  youtube: "https://youtube.com/@",
  twitch: "https://twitch.tv/",
  kick: "https://kick.com/",
  snapchat: "https://snapchat.com/add/",
  linkedin: "https://linkedin.com/in/",
  github: "https://github.com/",
  spotify: "https://open.spotify.com/user/",
  pinterest: "https://pinterest.com/",
};

/** Normalize an arbitrary user input to a canonical https URL.
 *  Used as a fallback when no platform context is available.
 *
 *   1. already absolute (`https://...`, `http://...`)  → as-is
 *   2. protocol-relative (`//instagram.com/x`)          → prepend https:
 *   3. relative (`instagram.com/x`)                     → prepend https://
 *
 * Empty / whitespace inputs return `null`. */
export function normalizeSocialUrl(input: string): string | null {
  const t = input.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith("//")) return `https:${t}`;
  return `https://${t.replace(/^\/+/, "")}`;
}

/** Build the public-facing URL for a platform from whatever the
 *  owner typed — a handle (`@yourname`), a path (`yourname`), or a
 *  full URL. Returns `null` for empty input. */
export function buildSocialUrl(
  platform: SocialPlatform,
  input: string,
): string | null {
  const t = input.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith("//")) return `https:${t}`;
  // Looks like a hostname (contains a dot before any slash) →
  // treat as a relative URL and prepend the protocol.
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(t)) {
    return `https://${t.replace(/^\/+/, "")}`;
  }
  // Bare handle — strip leading @ and slashes, then attach the
  // platform's canonical prefix.
  const handle = t.replace(/^@+/, "").replace(/^\/+/, "");
  if (!handle) return null;
  return `${PLATFORM_URL_BASE[platform]}${handle}`;
}

/** Extract the handle portion from a stored URL so the editor can
 *  show the owner what they originally typed instead of the full
 *  canonical link. Falls back to the URL when the shape doesn't
 *  match the platform's canonical prefix. */
export function extractSocialHandle(
  platform: SocialPlatform,
  url: string | undefined,
): string {
  if (!url) return "";
  const base = PLATFORM_URL_BASE[platform];
  if (url.toLowerCase().startsWith(base.toLowerCase())) {
    return url.slice(base.length);
  }
  // If it's a same-domain URL but a different path shape, hand
  // back the trimmed pathname so the user still sees a handle.
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
    if (path) return path;
  } catch {
    // fall through
  }
  return url;
}

/** Build a new `Socials` map from a single platform edit.
 *  Empty result drops the key entirely — never stores "" —
 *  so the public card treats the platform as absent. */
export function setSocial(
  current: Socials | undefined,
  platform: SocialPlatform,
  raw: string,
): Socials {
  const next: Socials = { ...(current ?? {}) };
  const url = buildSocialUrl(platform, raw);
  if (url) next[platform] = url;
  else delete next[platform];
  return next;
}
