import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { EASE } from "@/components/motion";

/**
 * Reveal — the in-app twin of `BlurReveal`.
 *
 * Speaks the exact same language (blur 8px → 0, axis offset → 0,
 * ease, duration) so screens look identical to the landing page.
 * The implementation differs in one important way: it renders a
 * fixed `motion.div`/`motion.span` instead of calling
 * `motion(Tag)` inside the function body. Calling `motion(Tag)`
 * every render returns a new component reference, which causes
 * React to remount the entire subtree on every parent re-render.
 * That's invisible on the landing page (nothing re-renders mid-view)
 * but catastrophic on form screens where state changes on every
 * keystroke — the flash you'd see is the form re-mounting.
 *
 * Direction:
 *   • `axis="y"` (default) — entrance rises up. Good for sections
 *     arriving as the page settles.
 *   • `axis="x"` — entrance slides in from the right. Used between
 *     onboarding steps so progress reads like forward motion
 *     through pages, not stacking content.
 */
export function Reveal({
  children,
  delay = 0,
  duration = 0.9,
  offset,
  axis = "y",
  className,
  as = "div",
  style,
  blur = 8,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  /** Distance, in pixels, the element travels to its resting
   *  position. Defaults to 24 for `y` and 32 for `x`. */
  offset?: number;
  axis?: "y" | "x";
  className?: string;
  as?: "div" | "span" | "section" | "article" | "p";
  style?: React.CSSProperties;
  /** Initial blur radius in pixels. 8 is the platform default;
   *  onboarding screens pass a smaller value (5) because four
   *  elements blur-resolve simultaneously and the full 8px on
   *  the large h1/form area can stutter on lower-end devices. */
  blur?: number;
}) {
  const reduced = useReducedMotion();
  const distance = offset ?? (axis === "x" ? 32 : 24);

  const initial = reduced
    ? { opacity: 1, x: 0, y: 0, filter: "blur(0px)" }
    : axis === "x"
      ? { opacity: 0, x: distance, y: 0, filter: `blur(${blur}px)` }
      : { opacity: 0, x: 0, y: distance, filter: `blur(${blur}px)` };
  const animate = { opacity: 1, x: 0, y: 0, filter: "blur(0px)" };
  const transition = { duration, delay, ease: EASE };

  // Stable component identity — `motion.div` is a constant
  // reference, so re-renders don't remount children.
  const props = {
    initial,
    animate,
    transition,
    className,
    style,
  } satisfies HTMLMotionProps<"div">;

  switch (as) {
    case "span":
      return <motion.span {...props}>{children}</motion.span>;
    case "section":
      return <motion.section {...props}>{children}</motion.section>;
    case "article":
      return <motion.article {...props}>{children}</motion.article>;
    case "p":
      return <motion.p {...props}>{children}</motion.p>;
    default:
      return <motion.div {...props}>{children}</motion.div>;
  }
}
