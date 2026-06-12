import { motion, useReducedMotion } from "framer-motion";
import { Children, isValidElement, type ReactNode } from "react";
import { EASE } from "./motion";

interface StaggerContainerProps {
  children: ReactNode;
  stagger?: number;
  delay?: number;
  duration?: number;
  y?: number;
  className?: string;
}

export function StaggerContainer({
  children,
  stagger = 0.12,
  delay = 0,
  duration = 0.9,
  y = 24,
  className,
}: StaggerContainerProps) {
  const reduced = useReducedMotion();
  const items = Children.toArray(children).filter(isValidElement);

  const initial = reduced
    ? { opacity: 1, y: 0, filter: "blur(0px)" }
    : { opacity: 0, y, filter: "blur(8px)" };

  const resolved = { opacity: 1, y: 0, filter: "blur(0px)" };

  return (
    <div className={className}>
      {items.map((child, i) => (
        <motion.div
          key={i}
          initial={initial}
          whileInView={resolved}
          viewport={{ once: true, margin: "-8% 0px" }}
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
