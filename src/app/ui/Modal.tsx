import {
  AnimatePresence,
  motion,
  type HTMLMotionProps,
} from "framer-motion";
import { X } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * Modal — the platform's confirmation surface. Centered, with a
 * blurred backdrop and a 3xl rounded card. Close on backdrop,
 * close on escape. The blur on the backdrop is part of the
 * platform's vocabulary — content behind always blurs, never just
 * dims.
 *
 * Portaled to document.body so it renders outside any parent
 * filter/transform stacks (e.g. a <Reveal> wrapper with
 * `filter: blur()`). Without the portal, typing in a textarea
 * inside the modal triggers a re-paint of the entire filtered
 * subtree on every keystroke — visible as input lag.
 */
export function Modal({
  open,
  onClose,
  children,
  title,
  description,
  size = "md",
  dismissable = true,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  size?: "sm" | "md" | "lg";
  dismissable?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissable) onClose();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose, dismissable]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } }}
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-8"
        >
          <motion.div
            onClick={dismissable ? onClose : undefined}
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } }}
            className="absolute inset-0 bg-[hsl(var(--ink))]/30 backdrop-blur-sm"
            style={{ willChange: "opacity" }}
            aria-hidden="true"
          />
          <motion.div
            {...({
              initial: { opacity: 0, y: 6, scale: 0.985 },
              animate: { opacity: 1, y: 0, scale: 1 },
              exit: { opacity: 0, y: 4, scale: 0.99 },
              transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
            } as HTMLMotionProps<"div">)}
            className={cn(
              "relative w-full overflow-hidden rounded-3xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))]",
              size === "sm" && "max-w-[420px]",
              size === "md" && "max-w-[560px]",
              size === "lg" && "max-w-[720px]",
            )}
            style={{ willChange: "transform, opacity" }}
          >
            {dismissable && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:bg-[hsl(var(--rule))] hover:text-[hsl(var(--ink))]"
              >
                <X size={16} strokeWidth={1.6} />
              </button>
            )}
            {(title || description) && (
              <div className="px-7 pb-3 pt-9 md:px-9 md:pt-10">
                {title && (
                  <h2
                    className="font-serif text-[hsl(var(--ink))]"
                    style={{
                      fontSize: "clamp(1.45rem, 2.4vw, 1.9rem)",
                      fontWeight: 500,
                      lineHeight: 1.1,
                      letterSpacing: "-0.025em",
                      textWrap: "balance",
                    }}
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    className="mt-3 max-w-[58ch] text-[hsl(var(--ink-muted))]"
                    style={{ fontSize: "0.97rem", lineHeight: 1.6 }}
                  >
                    {description}
                  </p>
                )}
              </div>
            )}
            <div className="px-7 pb-7 md:px-9 md:pb-9">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
