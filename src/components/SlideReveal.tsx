import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode } from "react";
import { EASE } from "./motion";

interface SlideRevealProps {
  children: ReactNode;
  direction?: "left" | "right";
  delay?: number;
  duration?: number;
  className?: string;
}

export function SlideReveal({
  children,
  direction = "right",
  delay = 0,
  duration = 0.85,
  className,
}: SlideRevealProps) {
  const reduced = useReducedMotion();
  const xOffset = direction === "right" ? 40 : -40;

  const initial = reduced
    ? { opacity: 1, x: 0, filter: "blur(0px)" }
    : { opacity: 0, x: xOffset, filter: "blur(4px)" };

  const resolved = { opacity: 1, x: 0, filter: "blur(0px)" };

  return (
    <motion.div
      initial={initial}
      whileInView={resolved}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
