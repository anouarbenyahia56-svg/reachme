import { useEffect, useState } from "react";
import { subscribe } from "./storage";

/**
 * useExternal — a simple, boring binding to our localStorage layer.
 *
 * We tried `useSyncExternalStore` first; it requires the snapshot
 * function to return a referentially stable value, which our
 * defaulted/merged reads can't always guarantee under React 19's
 * stricter checks. A plain `useState` + subscribe pattern is the
 * honest solution: read once on mount, re-read whenever the key
 * notifies, render normally.
 *
 * This is also future-friendly — when a real backend lands, the
 * `read` function below can be swapped for an HTTP fetch with the
 * same shape.
 */
export function useExternal<T>(key: string, read: () => T): T {
  const [snapshot, setSnapshot] = useState<T>(() => read());

  useEffect(() => {
    // Re-read once on mount in case the value changed between
    // the initial render and effect time.
    setSnapshot(read());
    return subscribe(key, () => setSnapshot(read()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return snapshot;
}
