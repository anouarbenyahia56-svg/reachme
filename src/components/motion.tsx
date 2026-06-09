import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import {
  Children,
  type CSSProperties,
  type ElementType,
  isValidElement,
  type ReactNode,
  useEffect,
  useRef,
} from "react";

/**
 * Motion primitives — the platform's animation language.
 *
 * Every visible element on the page arrives via blur-reveal:
 *   • starts at opacity 0, blur(8px), translated 24 px down
 *   • settles to opacity 1, blur(0), 0
 *   • duration 850 – 950 ms, easing decelerates gently at the end
 *
 * Within grouped content (cards, profile rows, bullet lists, FAQ items)
 * elements arrive in a 110 – 140 ms staggered cascade so they wave in
 * rather than march in.
 *
 * Reduced-motion users get the destination, never the journey.
 */

/** Decelerating easing — strong at the start, gentle at the end.
 *  Elements arrive and settle; they never stop abruptly. */
export const EASE = [0.22, 1, 0.36, 1] as const;

export const SECTION_PADDING = "px-6 py-32 md:px-10 md:py-40";
export const SECTION_GRID = "mx-auto grid max-w-[1240px] grid-cols-12 gap-8";

const VIEWPORT = { once: true, margin: "-8% 0px" } as const;

const BLUR_INITIAL = "blur(8px)";
const BLUR_RESOLVED = "blur(0px)";
const Y_INITIAL = 24;
const DEFAULT_DURATION = 0.9;
const DEFAULT_STAGGER = 0.12;

// ─── BlurReveal ────────────────────────────────────────────────────────────

export function BlurReveal({
  children,
  delay = 0,
  className,
  duration = DEFAULT_DURATION,
  y = Y_INITIAL,
  inView = true,
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  duration?: number;
  y?: number;
  inView?: boolean;
  as?: ElementType;
}) {
  const reduced = useReducedMotion();
  const Component = motion(Tag);
  const initial = reduced
    ? { opacity: 1, y: 0, filter: BLUR_RESOLVED }
    : { opacity: 0, y, filter: BLUR_INITIAL };
  const resolved = { opacity: 1, y: 0, filter: BLUR_RESOLVED };

  return (
    <Component
      initial={initial}
      {...(inView
        ? { whileInView: resolved, viewport: VIEWPORT }
        : { animate: resolved })}
      transition={{ duration, delay, ease: EASE }}
      className={className}
    >
      {children}
    </Component>
  );
}

// ─── WordReveal ────────────────────────────────────────────────────────────

export function WordReveal({
  text,
  as: Tag = "span",
  className,
  style,
  delay = 0,
  stagger = 0.05,
  inView = true,
  duration = 0.9,
  once = false,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  stagger?: number;
  inView?: boolean;
  duration?: number;
  /** When true, the animation only plays on the very first mount. */
  once?: boolean;
}) {
  const reduced = useReducedMotion();
  const words = text.split(" ");
  const initial = reduced
    ? { opacity: 1, y: 0, filter: BLUR_RESOLVED }
    : { opacity: 0, y: 22, filter: BLUR_INITIAL };
  const resolved = { opacity: 1, y: 0, filter: BLUR_RESOLVED };
  const skipInitial = once && !inView;

  return (
    <Tag className={className} style={style} aria-label={text}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={skipInitial ? false : initial}
          {...(inView
            ? { whileInView: resolved, viewport: VIEWPORT }
            : { animate: resolved })}
          transition={{
            duration,
            delay: delay + i * stagger,
            ease: EASE,
          }}
          style={{ display: "inline-block", marginRight: "0.27em" }}
          aria-hidden="true"
        >
          {word}
        </motion.span>
      ))}
    </Tag>
  );
}

// ─── RevealLines ───────────────────────────────────────────────────────────

export function RevealLines({
  children,
  delay = 0,
  stagger = DEFAULT_STAGGER,
  className,
  y = Y_INITIAL,
  duration = DEFAULT_DURATION,
}: {
  children: ReactNode;
  delay?: number;
  stagger?: number;
  className?: string;
  y?: number;
  duration?: number;
}) {
  const reduced = useReducedMotion();
  const items = Children.toArray(children).filter(isValidElement);
  const initial = reduced
    ? { opacity: 1, y: 0, filter: BLUR_RESOLVED }
    : { opacity: 0, y, filter: BLUR_INITIAL };
  const resolved = { opacity: 1, y: 0, filter: BLUR_RESOLVED };

  return (
    <div className={className}>
      {items.map((child, i) => (
        <motion.div
          key={i}
          initial={initial}
          whileInView={resolved}
          viewport={VIEWPORT}
          transition={{
            duration,
            delay: delay + i * stagger,
            ease: EASE,
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

// ─── RevealScale ───────────────────────────────────────────────────────────

export function RevealScale({
  children,
  delay = 0,
  className,
  duration = 1.05,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  duration?: number;
}) {
  const reduced = useReducedMotion();
  const initial = reduced
    ? { opacity: 1, scale: 1, filter: BLUR_RESOLVED }
    : { opacity: 0, scale: 0.96, filter: BLUR_INITIAL };
  const resolved = { opacity: 1, scale: 1, filter: BLUR_RESOLVED };

  return (
    <motion.div
      initial={initial}
      whileInView={resolved}
      viewport={VIEWPORT}
      transition={{ duration, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── CountTo ────────────────────────────────────────────────────────────────
//
// Animates a number from `from` to `to` on viewport entry. Writes the
// rounded integer directly into a ref'd <span> via a MotionValue
// subscription — never re-renders the React tree, so it stays fluid
// regardless of what's animating around it.

export function CountTo({
  from,
  to,
  duration = 1.7,
  delay = 0,
  className,
  style,
  suffix = "",
}: {
  from: number;
  to: number;
  duration?: number;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });
  const reduced = useReducedMotion();
  const value = useMotionValue(from);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.textContent = `${reduced ? to : from}${suffix}`;
  }, [from, to, reduced, suffix]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const unsubscribe = value.on("change", (latest) => {
      node.textContent = `${Math.round(latest)}${suffix}`;
    });

    if (!inView) return unsubscribe;

    if (reduced) {
      value.set(to);
      return unsubscribe;
    }

    const controls = animate(value, to, {
      duration,
      delay,
      ease: EASE,
    });

    return () => {
      unsubscribe();
      controls.stop();
    };
  }, [inView, reduced, to, duration, delay, value, suffix]);

  return (
    <span
      ref={ref}
      className={className}
      style={{
        ...style,
        display: "inline-block",
        fontVariantNumeric: "tabular-nums",
      }}
    />
  );
}
