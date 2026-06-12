import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import { EASE } from "./motion";

const DOT_COUNT = 16;

interface CelebrationBurstProps {
  children?: ReactNode;
  autoPlay?: boolean;
  className?: string;
}

export function CelebrationBurst({
  children,
  autoPlay = false,
  className,
}: CelebrationBurstProps) {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const hasPlayed = useRef(false);

  useEffect(() => {
    if (!autoPlay || reduced || hasPlayed.current) return;
    hasPlayed.current = true;

    const dots = containerRef.current?.querySelectorAll<HTMLDivElement>(".burst-dot");
    if (!dots) return;

    dots.forEach((dot) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 60 + Math.random() * 80;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      dot.animate(
        [
          { transform: "translate(0, 0) scale(1)", opacity: 1 },
          { transform: `translate(${x}px, ${y}px) scale(0)`, opacity: 0 },
        ],
        {
          duration: 700 + Math.random() * 300,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards",
        }
      );
    });
  }, [autoPlay, reduced]);

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {Array.from({ length: DOT_COUNT }).map((_, i) => (
          <motion.div
            key={i}
            className="burst-dot absolute h-1 w-1 rounded-full bg-[hsl(var(--ink))]"
            initial={{ opacity: 0, scale: 0 }}
            style={{ opacity: 0 }}
          />
        ))}
      </div>
      {children}
    </div>
  );
}
