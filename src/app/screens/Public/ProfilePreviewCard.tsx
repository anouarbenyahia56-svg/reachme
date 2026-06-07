import { motion, useReducedMotion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { EASE } from "@/components/motion";
import { Link } from "../../router";
import { Avatar } from "../../ui/Avatar";
import { Button } from "../../ui/Button";
import { Modal } from "../../ui/Modal";
import { Reveal } from "../../ui/Reveal";
import { SocialIcons } from "../../ui/SocialIcons";
import { formatMoney } from "../../store/format";
import { useProfile } from "../../store/session";
import type { Profile } from "../../types";
import { cn } from "@/lib/utils";

/**
 * The public profile card.
 *
 * Rendered on the live /:handle route. The CTA is a real link
 * into the send flow for every visitor, including the page
 * owner.
 *
 * Vertical rhythm (top → bottom):
 *   88  photo
 *   24  photo → name            ← identity unit, close
 *   6   name → title
 *   22  title → socials         ← socials still read with the
 *                                identity, not a new section
 *   72  socials → stats         ← the intentional, generous
 *                                beat; space alone separates
 *   10  stat header → value
 *   48  stats → CTA
 *
 * The card is the layout. Whitespace is the only structure.
 * No rules, no dividers, no decorative marks.
 *
 * Type scale:
 *   name         — fluid 22 → 40 px (longer names shrink)
 *   title        — 11 px tracked caps
 *   stat header  — 10 px tracked caps
 *   stat value   — 28 px serif
 *   social icon  — 18 px monochrome
 *   CTA          — 14.5 px
 *
 * `animate` controls the staggered blur-reveal entrance. The
 * public route wants the polish on first paint; the dashboard
 * editor preview is a live mirror of the owner's edits, so any
 * blur-in on tab swap reads as lag — the editor passes
 * `animate={false}` and the card commits instantly.
 */
export function ProfilePreviewCard({
  profile,
  variant,
  fill = false,
  animate = true,
}: {
  profile: Profile;
  variant: "preview" | "public";
  /** When true, the card becomes the entire mobile viewport
   *  (no rounded corners, no shadow, no max-width) — used on
   *  the public route so a visitor on a phone gets a full-page
   *  experience rather than a floating card. The dashboard
   *  preview keeps the default card-in-a-frame look. */
  fill?: boolean;
  /** When false, the card skips its blur-reveal entrance and
   *  renders in its final state. Use this in any context that
   *  mounts the card repeatedly (dashboard tabs, onboarding
   *  steps) where the entrance animation would feel like lag. */
  animate?: boolean;
}) {
  const reduced = useReducedMotion();
  const ownerProfile = useProfile();
  const isOwner =
    Boolean(ownerProfile) &&
    ownerProfile?.handle.toLowerCase() === profile.handle.toLowerCase();
  const [selfRequestOpen, setSelfRequestOpen] = useState(false);
  const isPaused = profile.visibility === "paused";
  const fullName = profile.displayName || profile.handle;
  const replyValue = `${profile.replyWindowDays}-day`;

  const avatarInitial = reduced
    ? { opacity: 1, scale: 1, filter: "blur(0px)" }
    : { opacity: 0, scale: 0.94, filter: "blur(8px)" };

  // Static wrapper — used when `animate` is false. Renders a plain
  // div with the same spacing/classes, so layout is identical.
  const Static = ({
    className,
    children,
  }: {
    className?: string;
    children: ReactNode;
  }) => <div className={className}>{children}</div>;

  return (
    <div
      className={cn(
        "relative w-full bg-white text-center",
        fill &&
          "min-h-[calc(100vh-68px)] min-h-[calc(100dvh-68px)] flex flex-col justify-center md:min-h-0",
        "md:mx-auto md:my-10 md:max-w-[480px] md:rounded-[20px] md:shadow-[0_1px_1px_rgba(15,15,15,0.04),0_2px_6px_rgba(15,15,15,0.04),0_28px_56px_-20px_rgba(15,15,15,0.12)]",
      )}
    >
      <div className="px-7 pb-14 pt-14 md:px-11 md:pb-16 md:pt-16">
        {animate ? (
          <Reveal as="div" delay={0} className="flex justify-center">
            <motion.div
              initial={avatarInitial}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.0, ease: EASE }}
            >
              <Avatar
                src={profile.avatarUrl}
                name={fullName}
                size="xl"
                className={cn(
                  "h-[88px] w-[88px] text-[26px]",
                  profile.avatarUrl && "bg-[hsl(var(--rule-strong))]",
                )}
              />
            </motion.div>
          </Reveal>
        ) : (
          <Static className="flex justify-center">
            <Avatar
              src={profile.avatarUrl}
              name={fullName}
              size="xl"
              className={cn(
                "h-[88px] w-[88px] text-[26px]",
                profile.avatarUrl && "bg-[hsl(var(--rule-strong))]",
              )}
            />
          </Static>
        )}

        {animate ? (
          <Reveal as="div" delay={0.05} className="mt-6">
            <h1
              className="font-serif text-[hsl(var(--ink))]"
              style={{
                fontSize: `${nameFontSize(profile.displayName)}px`,
                fontWeight: 500,
                letterSpacing: "-0.035em",
                lineHeight: 1.05,
                fontOpticalSizing: "auto",
                fontFeatureSettings: "'ss01', 'kern'",
                textWrap: "balance",
              }}
            >
              {profile.displayName}
            </h1>
          </Reveal>
        ) : (
          <Static className="mt-6">
            <h1
              className="font-serif text-[hsl(var(--ink))]"
              style={{
                fontSize: `${nameFontSize(profile.displayName)}px`,
                fontWeight: 500,
                letterSpacing: "-0.035em",
                lineHeight: 1.05,
                fontOpticalSizing: "auto",
                fontFeatureSettings: "'ss01', 'kern'",
                textWrap: "balance",
              }}
            >
              {profile.displayName}
            </h1>
          </Static>
        )}

        {animate ? (
          <Reveal as="div" delay={0.1} className="mt-1.5">
            <p
              className="font-medium uppercase text-[hsl(var(--ink-subtle))]"
              style={{ fontSize: "11px", letterSpacing: "0.24em" }}
            >
              {profile.title}
            </p>
          </Reveal>
        ) : (
          <Static className="mt-1.5">
            <p
              className="font-medium uppercase text-[hsl(var(--ink-subtle))]"
              style={{ fontSize: "11px", letterSpacing: "0.24em" }}
            >
              {profile.title}
            </p>
          </Static>
        )}

        {animate ? (
          <Reveal as="div" delay={0.16} className="mt-[22px] flex justify-center">
            <SocialIcons
              socials={profile.socials}
              ownerName={fullName}
              inert={variant === "preview"}
            />
          </Reveal>
        ) : (
          <Static className="mt-[22px] flex justify-center">
            <SocialIcons
              socials={profile.socials}
              ownerName={fullName}
              inert={variant === "preview"}
            />
          </Static>
        )}

        {animate ? (
          <Reveal
            as="div"
            delay={0.26}
            className="mt-[72px] grid grid-cols-2 gap-x-10"
          >
            <div>
              <p
                className="font-medium uppercase text-[hsl(var(--ink-subtle))]"
                style={{ fontSize: "10px", letterSpacing: "0.22em" }}
              >
                Floor
              </p>
              <p
                className="mt-2.5 font-serif text-[hsl(var(--ink))]"
                style={{
                  fontSize: "28px",
                  fontWeight: 500,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatMoney(profile.minAmountCents)}
              </p>
            </div>
            <div>
              <p
                className="font-medium uppercase text-[hsl(var(--ink-subtle))]"
                style={{ fontSize: "10px", letterSpacing: "0.22em" }}
              >
                Reply window
              </p>
              <p
                className="mt-2.5 font-serif text-[hsl(var(--ink))]"
                style={{
                  fontSize: "28px",
                  fontWeight: 500,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                }}
              >
                {replyValue}
              </p>
            </div>
          </Reveal>
        ) : (
          <Static className="mt-[72px] grid grid-cols-2 gap-x-10">
            <div>
              <p
                className="font-medium uppercase text-[hsl(var(--ink-subtle))]"
                style={{ fontSize: "10px", letterSpacing: "0.22em" }}
              >
                Floor
              </p>
              <p
                className="mt-2.5 font-serif text-[hsl(var(--ink))]"
                style={{
                  fontSize: "28px",
                  fontWeight: 500,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatMoney(profile.minAmountCents)}
              </p>
            </div>
            <div>
              <p
                className="font-medium uppercase text-[hsl(var(--ink-subtle))]"
                style={{ fontSize: "10px", letterSpacing: "0.22em" }}
              >
                Reply window
              </p>
              <p
                className="mt-2.5 font-serif text-[hsl(var(--ink))]"
                style={{
                  fontSize: "28px",
                  fontWeight: 500,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                }}
              >
                {replyValue}
              </p>
            </div>
          </Static>
        )}

        {animate ? (
          <Reveal as="div" delay={0.34} className="mt-12">
            {isPaused ? (
              <div
                role="status"
                className="flex h-[50px] w-full items-center justify-center rounded-full border border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] px-7 text-[14.5px] font-medium tracking-[-0.005em] text-[hsl(var(--ink-muted))]"
              >
                Not accepting requests right now.
              </div>
            ) : isOwner ? (
              <button
                type="button"
                onClick={() => setSelfRequestOpen(true)}
                className="flex h-[50px] w-full items-center justify-center rounded-full bg-[hsl(var(--ink))] text-[14.5px] font-medium tracking-[-0.005em] text-[hsl(var(--page))] transition-colors duration-300 hover:bg-[hsl(var(--ink))]/92 focus-visible:outline-none"
              >
                Send a request
              </button>
            ) : (
              <Link
                href={`/${profile.handle}/send`}
                className="flex h-[50px] w-full items-center justify-center rounded-full bg-[hsl(var(--ink))] text-[14.5px] font-medium tracking-[-0.005em] text-[hsl(var(--page))] transition-colors duration-300 hover:bg-[hsl(var(--ink))]/92 focus-visible:outline-none"
              >
                Send a request
              </Link>
            )}
          </Reveal>
        ) : (
          <Static className="mt-12">
            {isPaused ? (
              <div
                role="status"
                className="flex h-[50px] w-full items-center justify-center rounded-full border border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] px-7 text-[14.5px] font-medium tracking-[-0.005em] text-[hsl(var(--ink-muted))]"
              >
                Not accepting requests right now.
              </div>
            ) : isOwner ? (
              <button
                type="button"
                onClick={() => setSelfRequestOpen(true)}
                className="flex h-[50px] w-full items-center justify-center rounded-full bg-[hsl(var(--ink))] text-[14.5px] font-medium tracking-[-0.005em] text-[hsl(var(--page))] transition-colors duration-300 hover:bg-[hsl(var(--ink))]/92 focus-visible:outline-none"
              >
                Send a request
              </button>
            ) : (
              <Link
                href={`/${profile.handle}/send`}
                className="flex h-[50px] w-full items-center justify-center rounded-full bg-[hsl(var(--ink))] text-[14.5px] font-medium tracking-[-0.005em] text-[hsl(var(--page))] transition-colors duration-300 hover:bg-[hsl(var(--ink))]/92 focus-visible:outline-none"
              >
                Send a request
              </Link>
            )}
          </Static>
        )}
      </div>

      <Modal
        open={selfRequestOpen}
        onClose={() => setSelfRequestOpen(false)}
        title="Looking good from here"
        description="This is your live page. To experience the sender flow, open your link in an incognito window or share it with someone."
        size="sm"
      >
        <div className="mt-2">
          <Button variant="ghost" onClick={() => setSelfRequestOpen(false)} className="w-full">
            Makes sense
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/**
 * Name scales fluidly with length — shorter names render
 * larger, longer names shrink, so the line never feels
 * cramped on one end or sparse on the other.
 *
 *   ≤ 8 chars  → 40 px   (e.g. "Ada Wong")
 *   9 – 12     → 34 px   (e.g. "Mara Wright")
 *   13 – 18    → 30 px   (e.g. "Youssef Benyahia")
 *   19 – 24    → 26 px
 *   > 24       → 22 px
 *
 * Keeps the name on a single line at every step inside the
 * 480 px card with its internal padding.
 */
function nameFontSize(name: string): number {
  const len = name.trim().length;
  if (len <= 8) return 40;
  if (len <= 12) return 34;
  if (len <= 18) return 30;
  if (len <= 24) return 26;
  return 22;
}
