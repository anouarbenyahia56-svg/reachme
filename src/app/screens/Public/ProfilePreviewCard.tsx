import { Link as LinkIcon } from "lucide-react";
import { Avatar, VerifiedMark } from "../../ui/Avatar";
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
    <article className="overflow-hidden rounded-2xl bg-[hsl(var(--surface))]">
      <div
        className="relative aspect-[5/2] w-full bg-[hsl(var(--ink))]"
        aria-hidden={!profile.bannerUrl}
      >
        {profile.bannerUrl ? (
          <img
            src={profile.bannerUrl}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_hsl(0_0%_18%)_0%,_hsl(0_0%_4%)_70%)]" />
        )}
      </div>

      <div className="relative px-6 pb-6 pt-0 sm:px-8 sm:pb-8">
        <div className="-mt-12 flex items-end justify-between">
          <Avatar
            src={profile.avatarUrl}
            name={profile.displayName}
            size="xl"
            ring
          />
          {variant === "public" && onShare && (
            <Button
              variant="outline"
              size="sm"
              leadingIcon={<LinkIcon size={13} strokeWidth={1.6} />}
              onClick={onShare}
            >
              Share
            </Button>
          )}
        </div>

        <div className="mt-5 flex items-center gap-2">
          <h2
            className="font-serif text-[hsl(var(--ink))]"
            style={{
              fontSize: "1.6rem",
              fontWeight: 600,
              letterSpacing: "-0.025em",
              fontOpticalSizing: "auto",
            }}
          >
            {profile.displayName}
          </h2>
          {profile.verified && <VerifiedMark size={15} />}
        </div>
        <p className="mt-1 text-[14px] text-[hsl(var(--ink-muted))]">
          {profile.title}
        </p>

        <button
          type="button"
          onClick={onCopyLink}
          className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
        >
          reachme.com/{profile.handle}
          <LinkIcon size={11} strokeWidth={1.6} aria-hidden="true" />
        </button>

        {profile.bio && (
          <>
            <div className="my-5 h-px w-full bg-[hsl(var(--rule))]" />
            <p
              className="text-[hsl(var(--ink))]"
              style={{ fontSize: "0.97rem", lineHeight: 1.6 }}
            >
              {profile.bio}
            </p>
          </>
        )}

        {profile.categories.length > 0 && (
          <div className="mt-5">
            <p className="mb-2.5 text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
              Open to
            </p>
            <ul className="flex flex-wrap gap-2">
              {profile.categories.map((c) => (
                <li key={c.id}>
                  <Pill size="sm">{c.label}</Pill>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Pill size="sm" tone="ink">
            {formatMoney(profile.minAmountCents)} minimum
          </Pill>
          <Pill size="sm">7-day reply window</Pill>
          <Pill size="sm">Structured request</Pill>
        </div>

        <div className="mt-7">
          {variant === "public" ? (
            isPaused ? (
              <div className="rounded-2xl border border-[hsl(var(--rule))] bg-[hsl(var(--page))] px-5 py-4 text-center text-[13.5px] text-[hsl(var(--ink-muted))]">
                {profile.displayName} is not accepting new requests right
                now.
              </div>
            ) : (
              <Link
                href={`/${profile.handle}/send`}
                className="block w-full rounded-full bg-[hsl(var(--ink))] px-7 py-4 text-center text-[15px] font-medium text-[hsl(var(--page))] transition-colors duration-300 hover:bg-[hsl(var(--ink))]/92"
              >
                Send a request
              </Link>
            )
          ) : (
            <button
              type="button"
              disabled
              className="block w-full cursor-default rounded-full bg-[hsl(var(--ink))] px-7 py-4 text-center text-[15px] font-medium text-[hsl(var(--page))] opacity-90"
            >
              Send a request
            </button>
          )}
        </div>

        {variant === "public" && (
          <Link
            href="/claim"
            className="mt-5 block text-center text-[12.5px] text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
          >
            Get your own ReachMe page →
          </Link>
        )}
      </div>
    </article>
  );
}
