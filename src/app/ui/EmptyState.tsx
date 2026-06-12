import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode, type ComponentType } from "react";
import { type LucideProps } from "lucide-react";
import { EASE } from "@/components/motion";

interface EmptyStateProps {
  icon: ComponentType<LucideProps>;
  title: string;
  body: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  const reduced = useReducedMotion();

  const iconInitial = reduced
    ? { opacity: 1, scale: 1 }
    : { opacity: 0, scale: 0.8 };
  const iconResolved = { opacity: 1, scale: 1 };

  const textInitial = reduced
    ? { opacity: 1, y: 0, filter: "blur(0px)" }
    : { opacity: 0, y: 16, filter: "blur(6px)" };
  const textResolved = { opacity: 1, y: 0, filter: "blur(0px)" };

  return (
    <div className="flex flex-col items-center px-6 py-20 text-center md:px-9">
      <motion.span
        initial={iconInitial}
        whileInView={iconResolved}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--rule))] to-[hsl(var(--page))] text-[hsl(var(--ink-muted))] shadow-sm"
      >
        <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
      </motion.span>

      <motion.h3
        initial={textInitial}
        whileInView={textResolved}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
        className="mt-6 font-serif text-[hsl(var(--ink))]"
        style={{
          fontSize: "1.55rem",
          fontWeight: 500,
          letterSpacing: "-0.025em",
          lineHeight: 1.15,
        }}
      >
        {title}
      </motion.h3>

      <motion.p
        initial={textInitial}
        whileInView={textResolved}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.16, ease: EASE }}
        className="mx-auto mt-2.5 max-w-[44ch] text-[13.5px] leading-[1.6] text-[hsl(var(--ink-muted))]"
      >
        {body}
      </motion.p>

      {action && (
        <motion.div
          initial={textInitial}
          whileInView={textResolved}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.24, ease: EASE }}
          className="mt-6"
        >
          {action}
        </motion.div>
      )}
    </div>
  );
}
