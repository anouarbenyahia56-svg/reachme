import { useCallback } from "react";
import { AppHeader } from "../../ui/AppHeader";
import { Reveal } from "../../ui/Reveal";
import { Link } from "../../router";
import { findInDirectory } from "../../store/directory";
import { useProfile } from "../../store/session";
import { useToast } from "../../ui/Toast";
import { ProfilePreviewCard } from "./ProfilePreviewCard";

/**
 * Public profile route — what every visitor sees on
 * reachme.com/:handle. The card is the page; the type does the
 * work; whitespace is the structure.
 *
 * Uses `variant="auto"` so the header adapts to who's looking:
 *   • Authed visitor — wordmark + "Back to dashboard" (when on
 *                      their own page) or "View public page"
 *                      (when on someone else's) + the profile
 *                      pill on the right.
 *   • Anonymous visitor — wordmark + the marketing controls.
 *
 * "Get your own ReachMe page" sits below the card only for people
 * who don't already own one. Anyone who has a ReachMe page (a
 * profile in session) never sees it.
 */
export function PublicProfile({ handle }: { handle: string }) {
  const profile = findInDirectory(handle);
  const ownerProfile = useProfile();
  const hasOwnPage = Boolean(ownerProfile);
  const toast = useToast();

  const handleShare = useCallback(async () => {
    if (!profile) return;
    const url = window.location.href;
    const title = `${profile.displayName || profile.handle} on ReachMe`;
    const isTouchDevice =
      typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
    if (isTouchDevice && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* user cancelled — silent */
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.show("Link copied.", url);
    }
  }, [profile, toast]);

  if (!profile) {
    return <NotFound handle={handle} />;
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--page))] text-[hsl(var(--ink))]">
      <AppHeader variant="auto" />

      <main className="md:px-6 md:pb-32 md:pt-10">
        <div className="relative md:mx-auto md:max-w-[480px]">
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share this page"
            className="absolute -top-14 right-0 inline-flex h-14 w-14 items-center justify-center rounded-full text-[hsl(var(--ink-subtle))] transition-colors duration-300 hover:bg-[hsl(var(--rule))]/40 hover:text-[hsl(var(--ink))] md:hidden"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 50 50"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M30.3 13.7L25 8.4l-5.3 5.3-1.4-1.4L25 5.6l6.7 6.7z" />
              <path d="M24 7h2v21h-2z" />
              <path d="M35 40H15c-1.7 0-3-1.3-3-3V19c0-1.7 1.3-3 3-3h7v2h-7c-.6 0-1 .4-1 1v18c0 .6.4 1 1 1h20c.6 0 1-.4 1-1V19c0-.6-.4-1-1-1h-7v-2h7c1.7 0 3 1.3 3 3v18c0 1.7-1.3 3-3 3z" />
            </svg>
          </button>
          <ProfilePreviewCard
            profile={profile}
            variant="public"
            fill
            animate={false}
          />
        </div>

        {!hasOwnPage && (
          <Reveal delay={0.7}>
            <div className="hidden text-center md:mt-14 md:block">
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
      <AppHeader variant="minimal" />
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
          </div>
        </Reveal>
      </main>
    </div>
  );
}
