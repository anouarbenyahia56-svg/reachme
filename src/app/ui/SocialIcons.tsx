import type { ReactElement, SVGProps } from "react";
import type { SocialPlatform, Socials } from "../types";

/**
 * SocialIcons — a quiet, monochrome row of social profile
 * links rendered on the public profile card.
 *
 * The glyphs are the actual brand marks (filled silhouettes
 * for the platforms that read as a solid shape, outlined for
 * the ones whose identity is a frame + interior detail). Every
 * glyph lives on the same 24 × 24 grid, painted with
 * `currentColor`, so the row can be tinted by the parent.
 *
 * Design rules:
 *   • Monochrome only. No brand color, no chromatic offset.
 *     The card's `ink` token sets the default tone; the row
 *     inherits it.
 *   • Equal optical size. Every icon is the same display size
 *     (24 px on the public card) so the row reads as one
 *     rhythm — not a grab-bag of mismatched weights.
 *   • Quiet by default. The icons sit at full ink weight but
 *     at a small enough size to stay contextual — present
 *     without competing with the identity or the CTA.
 *   • Only present platforms render. An owner who lists
 *     nothing shows nothing — no empty slots, no placeholder
 *     row.
 *
 * Links open in a new tab with `rel="noopener noreferrer"` so
 * the public page never loses the visitor's place.
 */

const ICON_PROPS_BASE: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

/** Stable display order, left → right. The list mirrors the
 *  reference design — a row of brand marks, evenly spaced,
 *  with no implied hierarchy between them. */
const PLATFORM_ORDER: SocialPlatform[] = [
  "instagram",
  "x",
  "facebook",
  "tiktok",
  "youtube",
  "twitch",
  "kick",
  "linkedin",
  "github",
  "spotify",
  "pinterest",
];

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  x: "X",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitch: "Twitch",
  kick: "Kick",
  linkedin: "LinkedIn",
  github: "GitHub",
  spotify: "Spotify",
  pinterest: "Pinterest",
};

const PLACEHOLDERS: Record<SocialPlatform, string> = {
  instagram: "username",
  x: "username",
  facebook: "username",
  tiktok: "username",
  youtube: "handle",
  twitch: "channel",
  kick: "channel",
  linkedin: "username",
  github: "username",
  spotify: "username",
  pinterest: "username",
};

/** One row per platform — what the public card iterates,
 *  what the editor lays out. Each entry pairs a platform id
 *  with the URL pattern an owner is likely to paste. */
export const SOCIAL_PLATFORMS: ReadonlyArray<{
  id: SocialPlatform;
  label: string;
  placeholder: string;
}> = PLATFORM_ORDER.map((id) => ({
  id,
  label: PLATFORM_LABELS[id],
  placeholder: PLACEHOLDERS[id],
}));

/** A single platform icon. Inherits color from `currentColor`
 *  so the editor and the public card can paint the same
 *  glyph with different tones without duplicating paths. */
export function SocialIcon({
  platform,
  ...rest
}: { platform: SocialPlatform } & SVGProps<SVGSVGElement>) {
  const Icon = ICONS[platform];
  return <Icon {...rest} />;
}

export function SocialIcons({
  socials,
  ownerName,
  inert = false,
}: {
  socials: Socials | undefined;
  ownerName: string;
  /** When true, the row is purely a preview — icons are not
   *  links, do not show a pointer, do not respond to hover or
   *  focus, and are not reachable by keyboard. Used inside the
   *  dashboard so the owner can review the layout without
   *  accidentally opening their own profiles in a new tab. The
   *  public route leaves this off so visitors get the real
   *  interaction. */
  inert?: boolean;
}) {
  const entries = PLATFORM_ORDER.flatMap((p) => {
    const url = socials?.[p];
    return url ? ([[p, url]] as const) : [];
  })
    // The public card's row only fits 5 icons at the 44 px touch
    // target across every phone width. Older stored profiles may
    // carry extras from before the editor's cap landed — this
    // is a hard ceiling in the renderer so the row never overflows.
    .slice(0, 5);

  if (entries.length === 0) return null;

  return (
    <ul
      className="flex items-center justify-center gap-1"
      aria-label={`${ownerName} on social media`}
    >
      {entries.map(([platform, url]) => {
        const label = PLATFORM_LABELS[platform];
        if (inert) {
          return (
            <li key={platform}>
              <span
                title={`${ownerName} on ${label}`}
                aria-label={`${ownerName} on ${label}`}
                className="inline-flex h-11 w-11 cursor-default items-center justify-center text-[hsl(var(--ink))] select-none"
              >
                <SocialIcon
                  platform={platform}
                  className="h-6 w-6"
                  aria-hidden
                />
              </span>
            </li>
          );
        }
        return (
          <li key={platform}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${ownerName} on ${label}`}
              className="group inline-flex h-11 w-11 items-center justify-center text-[hsl(var(--ink))] transition-opacity duration-300 hover:opacity-60 focus-visible:outline-none focus-visible:opacity-60"
            >
              <SocialIcon
                platform={platform}
                className="h-6 w-6"
              />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

// ─── Brand glyphs ──────────────────────────────────────────────────
//
// Each path is the platform's own mark, normalized to a 24 × 24
// grid and painted with `currentColor` so the row stays
// monochrome. Filled for the silhouettes (X, TikTok, YouTube,
// Facebook, Pinterest), outlined for the frames (Instagram,
// LinkedIn, Spotify) — the way each brand actually reads.

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...ICON_PROPS_BASE} fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
      />
      <path d="M18 5C17.4477 5 17 5.44772 17 6C17 6.55228 17.4477 7 18 7C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.65396 4.27606C1 5.55953 1 7.23969 1 10.6V13.4C1 16.7603 1 18.4405 1.65396 19.7239C2.2292 20.8529 3.14708 21.7708 4.27606 22.346C5.55953 23 7.23969 23 10.6 23H13.4C16.7603 23 18.4405 23 19.7239 22.346C20.8529 21.7708 21.7708 20.8529 22.346 19.7239C23 18.4405 23 16.7603 23 13.4V10.6C23 7.23969 23 5.55953 22.346 4.27606C21.7708 3.14708 20.8529 2.2292 19.7239 1.65396C18.4405 1 16.7603 1 13.4 1H10.6C7.23969 1 5.55953 1 4.27606 1.65396C3.14708 2.2292 2.2292 3.14708 1.65396 4.27606ZM13.4 3H10.6C8.88684 3 7.72225 3.00156 6.82208 3.0751C5.94524 3.14674 5.49684 3.27659 5.18404 3.43597C4.43139 3.81947 3.81947 4.43139 3.43597 5.18404C3.27659 5.49684 3.14674 5.94524 3.0751 6.82208C3.00156 7.72225 3 8.88684 3 10.6V13.4C3 15.1132 3.00156 16.2777 3.0751 17.1779C3.14674 18.0548 3.27659 18.5032 3.43597 18.816C3.81947 19.5686 4.43139 20.1805 5.18404 20.564C5.49684 20.7234 5.94524 20.8533 6.82208 20.9249C7.72225 20.9984 8.88684 21 10.6 21H13.4C15.1132 21 16.2777 20.9984 17.1779 20.9249C18.0548 20.8533 18.5032 20.7234 18.816 20.564C19.5686 20.1805 20.1805 19.5686 20.564 18.816C20.7234 18.5032 20.8533 18.0548 20.9249 17.1779C20.9984 16.2777 21 15.1132 21 13.4V10.6C21 8.88684 20.9984 7.72225 20.9249 6.82208C20.8533 5.94524 20.7234 5.49684 20.564 5.18404C20.1805 4.43139 19.5686 3.81947 18.816 3.43597C18.5032 3.27659 18.0548 3.14674 17.1779 3.0751C16.2777 3.00156 15.1132 3 13.4 3Z"
      />
    </svg>
  );
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...ICON_PROPS_BASE} fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  // Material Design's Facebook mark — its disc is 20 × 20 inside
  // a 24 × 24 viewBox (2-unit margin all sides). Every other
  // glyph in this file fills the full 24 × 24, so a raw drop-in
  // would look noticeably smaller. We scale 1.2× from the centre
  // (12, 12) so the disc hits the edges like the others; the f
  // cut-out is part of the same path, so it scales in proportion
  // and stays in the right place.
  return (
    <svg {...ICON_PROPS_BASE} fill="currentColor" {...props}>
      <g transform="translate(-2.4 -2.4) scale(1.2)">
        <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06c0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
      </g>
    </svg>
  );
}

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...ICON_PROPS_BASE}
      viewBox="0 0 32 32"
      fill="currentColor"
      {...props}
    >
      <path d="M16.656 1.029c1.637-0.025 3.262-0.012 4.886-0.025 0.054 2.031 0.878 3.859 2.189 5.213l-0.002-0.002c1.411 1.271 3.247 2.095 5.271 2.235l0.028 0.002v5.036c-1.912-0.048-3.71-0.489-5.331-1.247l0.082 0.034c-0.784-0.377-1.447-0.764-2.077-1.196l0.052 0.034c-0.012 3.649 0.012 7.298-0.025 10.934-0.103 1.853-0.719 3.543-1.707 4.954l0.020-0.031c-1.652 2.366-4.328 3.919-7.371 4.011l-0.014 0c-0.123 0.006-0.268 0.009-0.414 0.009-1.73 0-3.347-0.482-4.725-1.319l0.040 0.023c-2.508-1.509-4.238-4.091-4.558-7.094l-0.004-0.041c-0.025-0.625-0.037-1.25-0.012-1.862 0.49-4.779 4.494-8.476 9.361-8.476 0.547 0 1.083 0.047 1.604 0.136l-0.056-0.008c0.025 1.849-0.050 3.699-0.050 5.548-0.423-0.153-0.911-0.242-1.42-0.242-1.868 0-3.457 1.194-4.045 2.861l-0.009 0.030c-0.133 0.427-0.21 0.918-0.21 1.426 0 0.206 0.013 0.41 0.037 0.61l-0.002-0.024c0.332 2.046 2.086 3.59 4.201 3.59 0.061 0 0.121-0.001 0.181-0.004l-0.009 0c1.463-0.044 2.733-0.831 3.451-1.994l0.010-0.018c0.267-0.372 0.45-0.822 0.511-1.311l0.001-0.014c0.125-2.237 0.075-4.461 0.087-6.698 0.012-5.036-0.012-10.060 0.025-15.083z" />
    </svg>
  );
}

function YouTubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...ICON_PROPS_BASE} fill="currentColor" {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function TwitchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...ICON_PROPS_BASE} viewBox="0 0 32 32" fill="currentColor" {...props}>
      <path d="M26.711 14.929l-4.284 4.284h-4.285l-3.749 3.749v-3.749h-4.82v-16.067h17.138zM8.502 1.004l-5.356 5.356v19.279h6.427v5.356l5.356-5.356h4.284l9.641-9.64v-14.996zM21.356 6.895h2.142v6.427h-2.142zM15.464 6.895h2.143v6.427h-2.144z" />
    </svg>
  );
}

function KickIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...ICON_PROPS_BASE} fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.43478 1H9.6087v4.78261H12V3.3913h2.3913V1h7.1739v7.17391h-2.3913v2.39129h-2.3913v2.8696h2.3913v2.3913h2.3913V23h-7.1739v-2.3913H12v-2.3913H9.6087V23H2.43478V1Z"
      />
    </svg>
  );
}

function LinkedInIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...ICON_PROPS_BASE} fill="currentColor" {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function SpotifyIcon(props: SVGProps<SVGSVGElement>) {
  // The source path is drawn on a 20 × 20 grid in the 84–104 /
  // 7319–7339 coordinate space (the disc is centred at 94, 7329
  // with radius 10). We scale by 1.2 and shift so the disc lands
  // inside the standard 24 × 24 viewBox used by the rest of the
  // row — same visual weight as the other marks.
  return (
    <svg {...ICON_PROPS_BASE} fill="currentColor" {...props}>
      <g transform="translate(-100.8 -8782.8) scale(1.2)">
        <path d="M99.915,7327.865 C96.692,7325.951 91.375,7325.775 88.297,7326.709 C87.803,7326.858 87.281,7326.58 87.131,7326.085 C86.981,7325.591 87.26,7325.069 87.754,7324.919 C91.287,7323.846 97.159,7324.053 100.87,7326.256 C101.314,7326.52 101.46,7327.094 101.196,7327.538 C100.934,7327.982 100.358,7328.129 99.915,7327.865 L99.915,7327.865 Z M99.81,7330.7 C99.584,7331.067 99.104,7331.182 98.737,7330.957 C96.05,7329.305 91.952,7328.827 88.773,7329.792 C88.36,7329.916 87.925,7329.684 87.8,7329.272 C87.676,7328.86 87.908,7328.425 88.32,7328.3 C91.951,7327.198 96.466,7327.732 99.553,7329.629 C99.92,7329.854 100.035,7330.334 99.81,7330.7 L99.81,7330.7 Z M98.586,7333.423 C98.406,7333.717 98.023,7333.81 97.729,7333.63 C95.381,7332.195 92.425,7331.871 88.944,7332.666 C88.609,7332.743 88.274,7332.533 88.198,7332.197 C88.121,7331.862 88.33,7331.528 88.667,7331.451 C92.476,7330.58 95.743,7330.955 98.379,7332.566 C98.673,7332.746 98.766,7333.129 98.586,7333.423 L98.586,7333.423 Z M94,7319 C88.477,7319 84,7323.477 84,7329 C84,7334.523 88.477,7339 94,7339 C99.523,7339 104,7334.523 104,7329 C104,7323.478 99.523,7319.001 94,7319.001 L94,7319 Z" />
      </g>
    </svg>
  );
}

function PinterestIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...ICON_PROPS_BASE} fill="currentColor" {...props}>
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.174.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641 0 12.017 0z" />
    </svg>
  );
}

function GitHubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...ICON_PROPS_BASE} fill="currentColor" {...props}>
      <path d="M12 2c5.5228 0 10 4.47715 10 10 0 4.5716 -3.0686 8.4239 -7.2578 9.6162v-3.0117c0 -0.7275 -0.1595 -1.4465 -0.4678 -2.1055 2.1883 -0.7822 4.2783 -2.4447 4.2783 -4.4355 0 -1.2663 -0.4671 -2.75174 -1.5127 -3.63186V6l-2.9462 0.98828c-0.6589 -0.16036 -1.3628 -0.24706 -2.0938 -0.24707 -0.731 0 -1.4349 0.08673 -2.09375 0.24707L6.95996 6v2.43164c-1.04555 0.88009 -1.51163 2.36566 -1.51172 3.63186 0 1.9907 2.08913 3.6533 4.27735 4.4355 -0.26358 0.5635 -0.41862 1.1711 -0.45801 1.7901 -0.13854 0.0283 -0.25191 0.0415 -0.34473 0.04 -0.20756 -0.0033 -0.36606 -0.06 -0.51953 -0.1562 -1.11532 -0.7 -1.54401 -1.9835 -3.05566 -2.1543 -0.19076 -0.0214 -0.3474 0.1371 -0.34766 0.3291 0 0.1922 0.15921 0.3423 0.34473 0.3925 1.44216 0.39 1.42755 3.2266 3.54785 3.2598 0.11976 0.0019 0.24101 -0.0069 0.36426 -0.0186v1.6348C5.06807 20.4236 2 16.5713 2 12 2 6.47715 6.47715 2 12 2" />
    </svg>
  );
}

const ICONS: Record<
  SocialPlatform,
  (props: SVGProps<SVGSVGElement>) => ReactElement
> = {
  instagram: InstagramIcon,
  x: XIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
  youtube: YouTubeIcon,
  twitch: TwitchIcon,
  kick: KickIcon,
  linkedin: LinkedInIcon,
  github: GitHubIcon,
  spotify: SpotifyIcon,
  pinterest: PinterestIcon,
};
