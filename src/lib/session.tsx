"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { localStore, type Store } from "./store";
import type { Session } from "./domain";

/**
 * Session provider — the single boundary the app reads "who is signed in"
 * from. The Store implementation lives behind it; calling code never
 * touches localStorage directly.
 *
 * When real auth lands (Better Auth), only this file's internals change —
 * the consumed shape (`useSession`) stays identical.
 *
 * Per `state-decouple-implementation`: the provider owns the
 * implementation; consumers see only the contract.
 */

type SessionState =
  | { status: "loading"; session: null }
  | { status: "anonymous"; session: null }
  | { status: "authenticated"; session: Session };

interface SessionContextValue {
  /** Reactive session state. */
  state: SessionState;
  /** Underlying store — exposed so feature hooks can run mutations. */
  store: Store;
  /** Refresh the session from the store. */
  refresh: () => Promise<void>;
  /** Sign out and refresh. */
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({
    status: "loading",
    session: null,
  });

  // Stable store reference for the lifetime of the app. When we swap
  // implementations later, this is the single line that changes.
  const store = useMemo(() => localStore, []);

  const refresh = useCallback(async () => {
    const session = await store.getSession();
    setState(
      session
        ? { status: "authenticated", session }
        : { status: "anonymous", session: null },
    );
  }, [store]);

  const signOut = useCallback(async () => {
    await store.signOut();
    await refresh();
  }, [store, refresh]);

  // Initial hydration. We start in "loading" and resolve once.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<SessionContextValue>(
    () => ({ state, store, refresh, signOut }),
    [state, store, refresh, signOut],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

/** Read the current session state. Suspends never; loading is explicit. */
export function useSession(): SessionState {
  const ctx = use(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used inside <SessionProvider>.");
  }
  return ctx.state;
}

/** Access the underlying store + actions. */
export function useStore(): {
  store: Store;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
} {
  const ctx = use(SessionContext);
  if (!ctx) {
    throw new Error("useStore must be used inside <SessionProvider>.");
  }
  return { store: ctx.store, refresh: ctx.refresh, signOut: ctx.signOut };
}
