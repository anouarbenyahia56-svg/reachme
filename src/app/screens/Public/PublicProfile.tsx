import { useEffect, useState } from "react";
import { AppHeader } from "../../ui/AppHeader";
import { Reveal } from "../../ui/Reveal";
import { Link } from "../../router";
import { findInDirectory } from "../../store/directory";
import { useProfile } from "../../store/session";
import { ProfilePreviewCard } from "./ProfilePreviewCard";
import { useToast } from "../../ui/Toast";

/**
 * Public profile route — what every visitor sees on
 * reachme.com/:handle. Quiet, focused, identical in voice to the
 * marketing page; no chrome competes with the person.
 *
 * "Get your own ReachMe page" sits below the card only for people
 * who don't already own one. Anyone who has a ReachMe page (a
 * profile in session) never sees it — their return path to the
 * dashboard lives in the AppHeader, which switches its right-side
 * link to "Back to dashboard" on their own handle and in the send
 * flow.
 */
export function PublicProfile({ handle }: { handle: string }) {
  const profile = findInDirectory(handle);
  const ownerProfile = useProfile();
  const hasOwnPage = Boolean(ownerProfile);
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

      <main className="mx-auto max-w-[600px] px-5 pb-36 pt-20 md:px-6 md:pt-28">
        <Reveal delay={0.05}>
          <ProfilePreviewCard
            profile={profile}
            variant="public"
            onCopyLink={copy}
            onShare={copy}
          />
        </Reveal>

        {!hasOwnPage && (
          <Reveal delay={0.3}>
            <div className="mt-10 text-center">
              <Link
                href="/claim"
                className="group inline-flex items-center gap-1.5 text-[12.5px] tracking-[0.01em] text-[hsl(var(--ink-subtle))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
              >
                Get your own ReachMe page
                <span
                  aria-hidden="true"
                  className="transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[3px]"
                >
                  →
                </span>
              </Link>
            </div>
          </Reveal>
        )}
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
