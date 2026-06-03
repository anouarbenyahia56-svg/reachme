import { Link as LinkIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar } from "../../ui/Avatar";
import { VerifiedBadge } from "../../ui/VerifiedBadge";
import { Pill } from "../../ui/Pill";
import { formatMoney } from "../../store/format";
import type { Profile } from "../../types";
import { Button } from "../../ui/Button";
import { Link } from "../../router";

/**
 * The card that represents an owner's page — used in two contexts:
 *
 *   • variant="preview"  — inside onboarding and the dashboard,
 *                          where the owner is looking at themselves.
 *   • variant="public"   — on the actual /:handle route, where a
 *                          sender is deciding whether to reach out.
 *
 * Same component for both because the visual must be identical.
 */
export function ProfilePreviewCard({
  profile,
  variant,
  onCopyLink,
  onShare,
}: {
  profile: Profile;
  variant: "preview" | "public";
  onCopyLink?: () => void;
  onShare?: () => void;
}) {
  const isPaused = profile.visibility === "paused";
  return (
    <article className="overflow-hidden rounded-3xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))]">
      <div className="relative px-7 pb-9 pt-6 sm:px-10 sm:pb-11">
        <div>
          <Avatar
            src={profile.avatarUrl}
            name={profile.displayName || profile.handle}
            size="xl"
            ring
          />
        </div>

        <div className="mt-7 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h2
                className="font-serif text-[hsl(var(--ink))]"
                style={{
                  fontSize: "1.85rem",
                  fontWeight: 600,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.05,
                  fontOpticalSizing: "auto",
                }}
              >
                {profile.displayName}
              </h2>
              <VerifiedBadge size={20} className="translate-y-[1px]" />
            </div>
            <p className="mt-2 text-[14.5px] tracking-[-0.005em] text-[hsl(var(--ink-muted))]">
              {profile.title}
            </p>
            <button
              type="button"
              onClick={onCopyLink}
              className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] tracking-[0.01em] text-[hsl(var(--ink-subtle))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
            >
              reachme.com/{profile.handle}
              <LinkIcon size={11} strokeWidth={1.6} aria-hidden="true" />
            </button>
          </div>

          {variant === "public" && onShare && (
            <Button
              variant="outline"
              size="sm"
              leadingIcon={<LinkIcon size={13} strokeWidth={1.6} />}
              onClick={onShare}
              className="mt-1 shrink-0"
            >
              Share
            </Button>
          )}
        </div>

        {profile.bio && (
          <div className="mt-10">
            <Eyebrow>About</Eyebrow>
            <p
              className="mt-3.5 text-[hsl(var(--ink))]"
              style={{
                fontSize: "14.5px",
                lineHeight: 1.6,
                fontWeight: 400,
                letterSpacing: "-0.005em",
                textWrap: "balance",
              }}
            >
              {profile.bio}
            </p>
          </div>
        )}

        {profile.categories.length > 0 && (
          <div className="mt-10">
            <Eyebrow>Open to</Eyebrow>
            <ul className="mt-3.5 flex flex-wrap gap-2">
              {profile.categories.map((c) => (
                <li key={c.id}>
                  <Pill size="sm">{c.label}</Pill>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-10">
          <Eyebrow>Terms</Eyebrow>
          <ul className="mt-3.5 flex flex-wrap gap-2">
            <li>
              <Pill size="sm">{formatMoney(profile.minAmountCents)} minimum</Pill>
            </li>
            <li>
              <Pill size="sm">{profile.replyWindowDays}-day reply window</Pill>
            </li>
          </ul>
        </div>

        <div className="mt-11">
          {variant === "public" ? (
            isPaused ? (
              <div className="rounded-full border border-[hsl(var(--rule-strong))] bg-[hsl(var(--page))] px-7 py-4 text-center text-[14px] text-[hsl(var(--ink-muted))]">
                Not accepting requests right now.
              </div>
            ) : (
              <Link
                href={`/${profile.handle}/send`}
                className="block w-full rounded-full bg-[hsl(var(--ink))] px-7 py-[18px] text-center text-[15px] font-medium tracking-[-0.005em] text-[hsl(var(--page))] transition-colors duration-300 hover:bg-[hsl(var(--ink))]/92"
              >
                Send a request
              </Link>
            )
          ) : isPaused ? (
            <div className="rounded-full border border-[hsl(var(--rule-strong))] bg-[hsl(var(--page))] px-7 py-4 text-center text-[14px] text-[hsl(var(--ink-muted))]">
              Not accepting requests right now.
            </div>
          ) : (
            <button
              type="button"
              disabled
              className="block w-full cursor-default rounded-full bg-[hsl(var(--ink))] px-7 py-[18px] text-center text-[15px] font-medium tracking-[-0.005em] text-[hsl(var(--page))] opacity-90"
            >
              Send a request
            </button>
          )}
        </div>

        {variant === "public" && !isPaused && (
          <p className="mx-auto mt-5 max-w-[42ch] text-center text-[12.5px] leading-[1.6] text-[hsl(var(--ink-subtle))]">
            The amount is held until {profile.displayName.split(" ")[0]} replies.
            Declined or expired requests are refunded automatically.
          </p>
        )}
      </div>
    </article>
  );
}

/** Section eyebrow — one consistent treatment for every label on
 *  the card, matching the landing page's 0.22em uppercase rhythm. */
function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
      {children}
    </p>
  );
}
