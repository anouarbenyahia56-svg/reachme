import {
  AnimatePresence,
  motion,
  type HTMLMotionProps,
} from "framer-motion";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { EASE } from "@/components/motion";

/**
 * A small, quiet toast — slides up from the bottom-right with a
 * blur reveal in the same easing as the rest of the platform.
 * Used for confirmations like "Link copied", "Reply sent",
 * "Request submitted".
 */

interface Toast {
  id: number;
  body: string;
  meta?: string;
}

interface ToastValue {
  show: (body: string, meta?: string) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const show = useCallback((body: string, meta?: string) => {
    const id = ++counter.current;
    setToasts((t) => [...t, { id, body, meta }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              {...({
                initial: { opacity: 0, y: 14, filter: "blur(6px)" },
                animate: { opacity: 1, y: 0, filter: "blur(0px)" },
                exit: { opacity: 0, y: 8, filter: "blur(6px)" },
                transition: { duration: 0.55, ease: EASE },
              } as HTMLMotionProps<"div">)}
              className="pointer-events-auto inline-flex max-w-[420px] items-center gap-3 rounded-full border border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] px-5 py-3 text-[13px] text-[hsl(var(--ink))] shadow-[0_2px_18px_rgba(0,0,0,0.04)]"
            >
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--ink))]"
              />
              <span>
                {t.body}
                {t.meta && (
                  <span className="ml-2 text-[hsl(var(--ink-subtle))]">
                    {t.meta}
                  </span>
                )}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful fallback — never throws if used outside provider
    // during very early renders. The console message helps in dev.
    return {
      show: (body) => {
        if (typeof window !== "undefined") {
          // eslint-disable-next-line no-console
          console.info("[toast]", body);
        }
      },
    };
  }
  return ctx;
}

/** Hook to auto-clear local "just happened" flags. */
export function useTimeout(fn: () => void, ms: number, dep: unknown) {
  useEffect(() => {
    const t = window.setTimeout(fn, ms);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep]);
}
