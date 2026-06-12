import { motion, type HTMLMotionProps } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { forwardRef, type ReactNode } from "react";
import { EASE } from "@/components/motion";
import { cn } from "@/lib/utils";

/** Shimmer sweep for loading buttons */
function Shimmer() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden rounded-full"
    >
      <span className="absolute inset-0 animate-[shimmer-sweep_1.6s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </span>
  );
}

/**
 * Buttons — the action surface used everywhere outside the
 * landing page's primary CTA.
 *
 * Same pill shape, same easing, same hover-lift as the locked
 * `<CTA />` component, scaled across variants and sizes for the
 * dashboard, onboarding, and forms.
 */

type Variant = "solid" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-[13px]",
  md: "px-5 py-2.5 text-[14px]",
  lg: "px-7 py-3.5 text-[15px]",
};

const variantClasses: Record<Variant, string> = {
  solid:
    "relative bg-[hsl(var(--ink))] text-[hsl(var(--page))] hover:bg-[hsl(var(--ink))]/85 hover:shadow-glow disabled:bg-[hsl(var(--rule-strong))] disabled:text-[hsl(var(--ink-subtle))] disabled:shadow-none",
  outline:
    "relative border border-rule-strong bg-[hsl(var(--surface))] text-[hsl(var(--ink))] disabled:opacity-50",
  ghost:
    "relative text-[hsl(var(--ink))] hover:text-[hsl(var(--ink))]/70 disabled:opacity-50",
  danger:
    "relative border border-rule-strong bg-[hsl(var(--surface))] text-[hsl(var(--ink))] hover:bg-[hsl(var(--ink))] hover:text-[hsl(var(--page))] disabled:opacity-50",
};

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "children" | "ref"> {
  variant?: Variant;
  size?: Size;
  trailingArrow?: boolean;
  leadingIcon?: ReactNode;
  children: ReactNode;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "solid",
      size = "md",
      trailingArrow,
      leadingIcon,
      children,
      className,
      disabled,
      loading,
      ...rest
    },
    ref,
  ) {
    const isDisabled = disabled || loading;
    return (
      <motion.button
        ref={ref}
        whileHover={isDisabled ? undefined : { scale: 1.02, y: -1 }}
        whileTap={isDisabled ? undefined : { scale: 0.96, y: 0 }}
        transition={{ duration: 0.25, ease: EASE }}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          "group inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[-0.005em] transition-[transform,background-color,color,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:cursor-not-allowed focus-visible:outline-none",
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
        {...rest}
      >
        {loading ? (
          <Spinner />
        ) : leadingIcon ? (
          <span className="inline-flex">{leadingIcon}</span>
        ) : null}
        <span>{children}</span>
        {trailingArrow && !loading ? (
          <ArrowRight
            size={size === "sm" ? 14 : 16}
            strokeWidth={1.6}
            className="transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[5px]"
            aria-hidden="true"
          />
        ) : null}
        {loading && <Shimmer />}
      </motion.button>
    );
  },
);

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-current border-r-transparent opacity-70"
    />
  );
}
