"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { EASE } from "./layout";
import { cn } from "@/lib/utils";

/**
 * Primary button — the form-side equivalent of the landing CTA.
 *
 * Same shape, same motion, same easing as <CTA>, but rendered as a
 * <button> so it participates in form submission, password managers,
 * and keyboard-driven UX.
 *
 * Variants are explicit components per `patterns-explicit-variants` —
 * this file exposes Button (solid) and GhostButton (text-only).
 *
 * Loading state preserves the original label and shows a spinner;
 * the button stays enabled until the request actually starts (per
 * web interface guidelines on form feedback).
 */

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: ReactNode;
  loading?: boolean;
  trailingArrow?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, children, loading, trailingArrow = true, type = "button", disabled, ...rest },
    ref,
  ) {
    return (
      <motion.button
        ref={ref}
        type={type}
        whileHover={disabled || loading ? undefined : { y: -1 }}
        whileTap={disabled || loading ? undefined : { y: 0 }}
        transition={{ duration: 0.25, ease: EASE }}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          "group relative inline-flex items-center justify-center gap-2.5",
          "rounded-full px-7 py-3.5",
          "bg-[hsl(var(--ink))] text-[hsl(var(--page))]",
          "text-[0.95rem] font-medium tracking-[-0.005em]",
          "transition-[transform,background-color,color,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "hover:bg-[hsl(var(--ink))]/92",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className,
        )}
        {...rest}
      >
        <span>{children}</span>
        {loading ? (
          <Loader2
            size={16}
            strokeWidth={1.6}
            aria-hidden="true"
            className="animate-spin"
          />
        ) : trailingArrow ? (
          <ArrowRight
            size={16}
            strokeWidth={1.6}
            aria-hidden="true"
            className="transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[3px]"
          />
        ) : null}
      </motion.button>
    );
  },
);

interface GhostButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export const GhostButton = forwardRef<HTMLButtonElement, GhostButtonProps>(
  function GhostButton({ className, children, ...rest }, ref) {
    return (
      <button
        ref={ref}
        className={cn(
          "text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))]",
          "rounded-sm px-1 py-1 text-[0.95rem] tracking-[-0.005em]",
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
