"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { EASE } from "./layout";
import { cn } from "@/lib/utils";

type Variant = "solid" | "ghost";

/**
 * The single, deliberate call-to-action.
 *
 * LOCKED. The pill shape (rounded-full) is the original and does not
 * change again. Used wherever a primary action lives. Hover lifts 1 px
 * and tightens contrast. All transitions are property-listed.
 */
export function CTA({
  href = "/claim",
  label = "Claim your handle",
  variant = "solid",
  className,
}: {
  href?: string;
  label?: string;
  variant?: Variant;
  className?: string;
}) {
  const base =
    "group inline-flex items-center gap-2.5 rounded-full text-[0.95rem] font-medium tracking-[-0.005em] transition-[transform,background-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

  const variants: Record<Variant, string> = {
    solid:
      "bg-[hsl(var(--ink))] text-[hsl(var(--page))] px-7 py-3.5 hover:bg-[hsl(var(--ink))]/92",
    ghost:
      "text-[hsl(var(--ink))] px-1 py-1 hover:text-[hsl(var(--ink))]/80",
  };

  return (
    <motion.a
      href={href}
      whileHover={{ y: -1 }}
      whileTap={{ y: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
      className={cn(base, variants[variant], className)}
    >
      <span>{label}</span>
      <ArrowRight
        size={16}
        strokeWidth={1.6}
        className="transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[3px]"
        aria-hidden="true"
      />
    </motion.a>
  );
}
