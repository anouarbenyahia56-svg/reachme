import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { EASE } from "@/components/motion";
import { Label } from "./Field";
import type { Visibility } from "../types";

const STATUS_OPTIONS: ReadonlyArray<{
  value: Visibility;
  label: string;
  helper: string;
}> = [
  {
    value: "public",
    label: "Live",
    helper: "Your page is live and accepting requests.",
  },
  {
    value: "paused",
    label: "Paused",
    helper: "Your page is visible, but not accepting requests.",
  },
];

const PRESET_DAYS = [1, 2, 3] as const;
const MAX_REPLY_WINDOW = 7;

/**
 * VisibilityField — the shared visibility + reply window editor
 * used by both onboarding (Step 7) and the My Page editor.
 *
 * Two sections:
 *   1. Status — Live or Paused
 *   2. Reply window — 1, 2, 3 days, or a custom value (4–7)
 */
export function VisibilityField({
  visibility,
  onChangeVisibility,
  replyWindowDays,
  onChangeReplyWindow,
}: {
  visibility: Visibility;
  onChangeVisibility: (v: Visibility) => void;
  replyWindowDays: number;
  onChangeReplyWindow: (d: number) => void;
}) {
  const isCustomDay = !PRESET_DAYS.includes(replyWindowDays as 1 | 2 | 3);
  const [customActive, setCustomActive] = useState(isCustomDay);
  const [customStr, setCustomStr] = useState(
    isCustomDay ? String(replyWindowDays) : "",
  );
  const customInputRef = useRef<HTMLInputElement>(null);

  const onPreset = (days: number) => {
    onChangeReplyWindow(days);
    setCustomActive(false);
    setCustomStr("");
  };

  const onCustomToggle = () => {
    if (!customActive) {
      const defaultVal = "4";
      setCustomActive(true);
      setCustomStr(defaultVal);
      onChangeReplyWindow(4);
      requestAnimationFrame(() => customInputRef.current?.focus());
    }
  };

  return (
    <div>
      <Label>Status</Label>
      <div className="grid gap-3 sm:grid-cols-2">
        {STATUS_OPTIONS.map((opt) => {
          const active = visibility === opt.value;
          return (
            <motion.button
              key={opt.value}
              type="button"
              whileHover={{ y: -1 }}
              transition={{ duration: 0.25, ease: EASE }}
              onClick={() => onChangeVisibility(opt.value)}
              aria-pressed={active}
              className={[
                "flex flex-col items-start rounded-2xl border px-5 py-5 text-left transition-[border-color,background-color,color] duration-300",
                active
                  ? "border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-[hsl(var(--page))]"
                  : "border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--ink))] hover:border-[hsl(var(--ink))]",
              ].join(" ")}
            >
              <span
                className="font-medium"
                style={{
                  fontSize: "1rem",
                  letterSpacing: "-0.005em",
                }}
              >
                {opt.label}
              </span>
              <span
                className={[
                  "mt-2 text-[12.5px] leading-[1.55]",
                  active
                    ? "text-[hsl(var(--page))]/75"
                    : "text-[hsl(var(--ink-muted))]",
                ].join(" ")}
              >
                {opt.helper}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-10">
        <Label>Reply window</Label>
        <div>
          <div className="grid grid-cols-4 gap-3">
            {PRESET_DAYS.map((d) => {
              const active = replyWindowDays === d && !customActive;
              return (
                <motion.button
                  key={d}
                  type="button"
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  onClick={() => onPreset(d)}
                  aria-pressed={active}
                  className={[
                    "rounded-2xl border px-4 py-4 text-center transition-[border-color,background-color,color] duration-300",
                    active
                      ? "border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-[hsl(var(--page))]"
                      : "border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--ink))] hover:border-[hsl(var(--ink))]",
                  ].join(" ")}
                >
                  <span
                    className="font-serif"
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: 500,
                      letterSpacing: "-0.025em",
                    }}
                  >
                    {d} day{d > 1 ? "s" : ""}
                  </span>
                </motion.button>
              );
            })}
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              transition={{ duration: 0.25, ease: EASE }}
              onClick={onCustomToggle}
              aria-pressed={customActive}
              className={[
                "rounded-2xl border px-4 py-4 text-center transition-[border-color,background-color,color] duration-300",
                customActive
                  ? "border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-[hsl(var(--page))]"
                  : "border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--ink))] hover:border-[hsl(var(--ink))]",
              ].join(" ")}
            >
              {customActive ? (
                <div className="flex items-center justify-center gap-1">
                  <input
                    ref={customInputRef}
                    type="text"
                    inputMode="numeric"
                    className="w-10 bg-transparent text-center font-serif text-[1.3rem] font-medium tracking-[-0.025em] outline-none"
                    value={customStr}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      if (raw === "") {
                        setCustomStr("");
                        return;
                      }
                      const n = Math.min(
                        MAX_REPLY_WINDOW,
                        Math.max(1, parseInt(raw, 10)),
                      );
                      setCustomStr(String(n));
                      onChangeReplyWindow(n);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        onPreset(2);
                        setCustomActive(false);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Custom reply window days"
                  />
                  <span className="text-[12px] opacity-60">days</span>
                </div>
              ) : (
                <span
                  className="font-serif"
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: 500,
                    letterSpacing: "-0.025em",
                  }}
                >
                  Custom
                </span>
              )}
            </motion.button>
          </div>
          <p className="mt-3 text-[12.5px] leading-[1.55] text-[hsl(var(--ink-subtle))]">
            A tighter window signals attentiveness. Max {MAX_REPLY_WINDOW}{" "}
            days.
          </p>
        </div>
      </div>
    </div>
  );
}
