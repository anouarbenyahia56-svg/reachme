"use client";

import { notFound } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { EASE } from "@/components/layout";
import { useSession, useStore } from "@/lib/session";
import {
  ALL_CATEGORIES,
  CATEGORY_LABELS,
  type Profile,
} from "@/lib/domain";
import { OwnerView } from "./OwnerView";
import { PublicView } from "./PublicView";

/**
 * The profile route's main render.
 *
 * Decides between three modes:
 *   • Loading — fetching profile from store
 *   • Owner view — the signed-in handle owner is viewing their own page
 *   • Public view — anyone else (or the owner before publishing)
 *
 * The owner view is editable in place. The public view is read-only
 * and renders the request form. Both share the same scaffolding so
 * the owner sees the public structure as they edit it.
 */
export function ProfileScreen({ handle }: { handle: string }) {
  const session = useSession();
  const { store } = useStore();
  const reduced = useReducedMotion();

  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  const refresh = useCallback(async () => {
    const result = await store.getProfileByHandle(handle);
    setProfile(result);
  }, [handle, store]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isOwner =
    session.status === "authenticated" &&
    session.session.handle.toLowerCase() === handle;

  // Both views need a stable reference to the canonical category list
  // and labels. Hoist the lookups once so the children are pure props.
  const categoryOptions = useMemo(
    () =>
      ALL_CATEGORIES.map((category) => ({
        value: category,
        label: CATEGORY_LABELS[category],
      })),
    [],
  );

  // While loading, render the calm shell so navigation feels instant.
  if (profile === undefined) {
    return (
      <>
        <AppNav />
        <main className="min-h-screen bg-[hsl(var(--page))]">
          <div className="mx-auto flex max-w-[640px] items-center gap-3 px-6 pt-44 text-[hsl(var(--ink-muted))]">
            <Loader2
              size={16}
              strokeWidth={1.6}
              aria-hidden="true"
              className="animate-spin"
            />
            <span
              style={{
                fontSize: "0.95rem",
                fontStyle: "italic",
                letterSpacing: "-0.005em",
              }}
            >
              Loading…
            </span>
          </div>
        </main>
      </>
    );
  }

  // No profile + not the owner → 404.
  // No profile + is the owner via session lookup means the session is
  // pointing at a deleted handle; let it 404 too.
  if (!profile) {
    notFound();
  }

  // Drafts are private. Anyone but the owner sees a 404 until publish.
  if (!profile.published && !isOwner) {
    notFound();
  }

  return (
    <>
      <AppNav />
      <motion.main
        key={isOwner ? "owner" : "public"}
        initial={
          reduced
            ? { opacity: 1 }
            : { opacity: 0, y: 8, filter: "blur(6px)" }
        }
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: EASE }}
        className="min-h-screen bg-[hsl(var(--page))] text-[hsl(var(--ink))]"
      >
        {isOwner ? (
          <OwnerView
            profile={profile}
            categoryOptions={categoryOptions}
            onChange={async (next) => {
              const saved = await store.upsertProfile(next);
              setProfile(saved);
            }}
          />
        ) : (
          <PublicView profile={profile} categoryOptions={categoryOptions} />
        )}
      </motion.main>
    </>
  );
}
