/**
 * A typed, single-source-of-truth localStorage adapter.
 *
 * Every read is defensive — a corrupt blob never breaks the app,
 * it returns the fallback. Every write notifies in-process
 * subscribers so multiple components stay in sync without a
 * full state library.
 *
 * Reference stability is part of the contract. `useSyncExternalStore`
 * (React 19 in particular) requires `getSnapshot` to return the
 * same reference when nothing has changed, otherwise it tears the
 * component down with "The result of getSnapshot should be cached".
 *
 * We honour that here by caching the parsed value keyed only on
 * the raw JSON string. When the raw string hasn't changed, the
 * very same reference comes back. Fallbacks are not part of the
 * cache key — they are only consulted when the key is unset for
 * the first time, and the resulting value is captured into the
 * cache so subsequent reads return the same reference even if a
 * different fallback literal is supplied.
 *
 * When a real backend lands, swap the body of `read`/`write` for
 * an HTTP client; the surface is unchanged.
 */

type Listener = () => void;

// Bumping this prefix invalidates every key in localStorage from
// older builds. We did this once during development to escape a
// stale shape; production should never bump it without a real
// migration path.
const PREFIX = "reachme.v2.";

const listeners = new Map<string, Set<Listener>>();

interface CacheEntry {
  /** The raw JSON string we last parsed. `null` means the key
   *  was missing and we cached the fallback at that moment. */
  raw: string | null;
  /** The corresponding parsed (or fallback) reference. */
  value: unknown;
}

const cache = new Map<string, CacheEntry>();

function notify(key: string) {
  const set = listeners.get(key);
  if (!set) return;
  set.forEach((fn) => fn());
}

export function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(PREFIX + key);
  } catch {
    return fallback;
  }

  const cached = cache.get(key);

  if (raw === null) {
    // Key is unset. The first caller's fallback becomes the
    // canonical cached value; later callers — even with a
    // different fallback literal — get back the same reference.
    if (cached && cached.raw === null) {
      return cached.value as T;
    }
    cache.set(key, { raw: null, value: fallback });
    return fallback;
  }

  if (cached && cached.raw === raw) {
    return cached.value as T;
  }

  try {
    const parsed = JSON.parse(raw) as T;
    cache.set(key, { raw, value: parsed });
    return parsed;
  } catch {
    return fallback;
  }
}

export function write<T>(key: string, value: T): void {
  let raw: string | null = null;
  try {
    raw = JSON.stringify(value);
  } catch {
    cache.delete(key);
    notify(key);
    return;
  }

  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PREFIX + key, raw);
    }
  } catch {
    /* quota / private mode — value still propagates via the cache
       and the notify call below. */
  }

  cache.set(key, { raw, value });
  notify(key);
}

export function remove(key: string): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(PREFIX + key);
    }
  } catch {
    /* ignore */
  }
  cache.delete(key);
  notify(key);
}

export function subscribe(key: string, fn: Listener): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(fn);

  // Cross-tab sync — pick up writes from other tabs without polling.
  // Invalidate our in-process cache before notifying so the next
  // read picks up the cross-tab change.
  const handler = (e: StorageEvent) => {
    if (e.key === PREFIX + key) {
      cache.delete(key);
      fn();
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handler);
  }

  return () => {
    set!.delete(fn);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handler);
    }
  };
}
