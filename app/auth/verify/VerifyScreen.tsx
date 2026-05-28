"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { GhostButton } from "@/components/Button";
import { EASE } from "@/components/layout";
import { Screen } from "@/components/Screen";
import { useStore } from "@/lib/session";

/**
 * Magic-link verification screen.
 *
 * Receives the token via ?token=, asks the store to complete sign-in,
 * then routes the user to their own page in owner-edit mode.
 *
 * The screen renders a single calm moment — a small spinner over a
 * line of italic text. It is meant to last under a second in normal
 * conditions; the visible state exists so the routing handoff doesn't
 * flash a blank page.
 */
export function VerifyScreen() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}

function VerifyInner() {
  const params = useSearchParams();
  const router = useRouter();
  const reduced = useReducedMotion();
  const { store, refresh } = useStore();

  const token = params.get("token");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("This sign-in link is missing a token. Try sending a new one.");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const session = await store.completeSignIn(token);
        await refresh();
        if (cancelled) return;
        router.replace(`/${session.handle}`);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Something went wrong.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, store, router, refresh]);

  return (
    <Screen>
      <motion.div
        initial={
          reduced
            ? { opacity: 1 }
            : { opacity: 0, y: 12, filter: "blur(8px)" }
        }
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: EASE }}
        className="flex flex-col items-start gap-7"
      >
        {error ? (
          <>
            <p
              className="font-serif italic text-[hsl(var(--ink))]"
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                lineHeight: 1.25,
                letterSpacing: "-0.02em",
              }}
            >
              {error}
            </p>
            <Link href="/claim">
              <GhostButton type="button">← Start over</GhostButton>
            </Link>
          </>
        ) : (
          <div
            className="flex items-center gap-4 text-[hsl(var(--ink-muted))]"
            style={{
              fontSize: "1.05rem",
              fontStyle: "italic",
              letterSpacing: "-0.005em",
            }}
          >
            <Loader2
              size={18}
              strokeWidth={1.6}
              aria-hidden="true"
              className="animate-spin"
            />
            <span>Signing you in…</span>
          </div>
        )}
      </motion.div>
    </Screen>
  );
}
