import { cn } from "@/lib/utils";

/**
 * The ReachMe verified badge.
 *
 * The classic scalloped eight-lobe seal silhouette, rebuilt in
 * ReachMe's palette: the seal is filled with --ink (near-black)
 * and the checkmark is drawn in --page (the warm off-white). No
 * blue, no gradient, no shadow — pure black and white, native to
 * the platform.
 *
 * Sized via the `size` prop to sit beside the display name —
 * present but never competing with it. One component, used
 * consistently everywhere the badge appears.
 */
export function VerifiedBadge({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label="Verified"
      className={cn("inline-block shrink-0", className)}
    >
      {/* Eight-lobe scalloped seal. */}
      <path
        fill="hsl(var(--ink))"
        d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
      />
      {/* Centered checkmark, off-white. */}
      <path
        fill="none"
        stroke="hsl(var(--page))"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.1 12.2 L10.9 15 L16 9.4"
      />
    </svg>
  );
}
