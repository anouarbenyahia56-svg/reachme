import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { EASE } from "@/components/motion";
import { AppHeader } from "../../ui/AppHeader";
import { Reveal } from "../../ui/Reveal";
import { Link, useRouter } from "../../router";
import { findInDirectory } from "../../store/directory";
import { ProfilePreviewCard } from "./ProfilePreviewCard";
import { useToast } from "../../ui/Toast";
import { Button } from "../../ui/Button";

/**
 * Public profile route — what every sender sees first when they
 * land on reachme.com/:handle. Quiet, focused, identical in
 * voice to the marketing page; no chrome competes with the
 * person.
 *
 * If the handle isn't in the directory, render a graceful "not
 * found" that still represents the platform with care.
 */
export function PublicProfile({ handle }: { handle: string }) {
  const profile = findInDirectory(handle);
  const { navigate } = useRouter();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(t);
  }, [copied]);

  if (!profile) {
    return <NotFound handle={handle} />;
  }

  const link = `reachme.com/${profile.handle}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${link}`);
      setCopied(true);
      toast.show("Link copied.", link);
    } catch {
      toast.show("Couldn't copy. Try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--page))] text-[hsl(var(--ink))]">
      <AppHeader />

      <main className="mx-auto max-w-[640px] px-5 pb-32 pt-16 md:px-6 md:pt-24">
        <Reveal delay={0.05}>
          <ProfilePreviewCard
            profile={profile}
            variant="public"
            onCopyLink={copy}
            onShare={copy}
          />
        </Reveal>

        <motion.div
          initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.85, delay: 0.4, ease: EASE }}
          className="mt-12 text-center"
        >
          <p className="text-[12.5px] uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
            How ReachMe works
          </p>
          <p
            className="mx-auto mt-4 max-w-[44ch] font-serif italic text-[hsl(var(--ink))]"
            style={{
              fontSize: "1.25rem",
              lineHeight: 1.4,
              letterSpacing: "-0.015em",
              fontWeight: 500,
            }}
          >
            The amount is held until {profile.displayName.split(" ")[0]} replies.
            Declined or expired requests are refunded automatically.
          </p>
        </motion.div>

        <Reveal delay={0.5}>
          <div className="mt-14 flex flex-col items-center gap-4 border-t border-[hsl(var(--rule))] pt-10">
            <p className="text-[12.5px] text-[hsl(var(--ink-muted))]">
              Want a page like this?
            </p>
            <Button
              size="md"
              trailingArrow
              variant="outline"
              onClick={() => navigate("/claim")}
            >
              Claim your handle
            </Button>
          </div>
        </Reveal>
      </main>
    </div>
  );
}

function NotFound({ handle }: { handle: string }) {
  return (
    <div className="min-h-screen bg-[hsl(var(--page))] text-[hsl(var(--ink))]">
      <AppHeader />
      <main className="mx-auto flex min-h-[70vh] max-w-[760px] flex-col items-center justify-center px-6 text-center">
        <Reveal>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
            Page not found
          </p>
          <h1
            className="mt-5 font-serif text-[hsl(var(--ink))]"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.4rem)",
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              textWrap: "balance",
            }}
          >
            No one's claimed{" "}
            <span className="italic text-[hsl(var(--ink-subtle))]">
              reachme.com/{handle}
            </span>{" "}
            yet.
          </h1>
          <p className="mx-auto mt-5 max-w-[44ch] text-[hsl(var(--ink-muted))]">
            Check the spelling, or claim it for yourself.
          </p>
          <div className="mt-9 flex justify-center gap-3">
            <Link
              href="/claim"
              className="rounded-full bg-[hsl(var(--ink))] px-6 py-3 text-[14px] font-medium text-[hsl(var(--page))] transition-colors duration-300 hover:bg-[hsl(var(--ink))]/92"
            >
              Claim it
            </Link>
            <Link
              href="/find"
              className="rounded-full border border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] px-6 py-3 text-[14px] font-medium text-[hsl(var(--ink))] transition-colors duration-300 hover:border-[hsl(var(--ink))]"
            >
              Find someone
            </Link>
          </div>
        </Reveal>
      </main>
    </div>
  );
}
