import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { EASE } from "@/components/motion";
import { Button } from "../../ui/Button";
import { Label } from "../../ui/Field";
import { Reveal } from "../../ui/Reveal";
import { useRouter } from "../../router";
import { OnboardingShell, OnboardingTitle } from "./OnboardingShell";
import { patchDraft, useDraft } from "../../store/draft";
import type { Visibility } from "../../types";

const STATE_OPTIONS: ReadonlyArray<{
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
 * Step 6 — Visibility and reply window.
 *
 * Two binary states for visibility (Open or Closed) and a
 * three-way selector for the reply window. Both write through
 * to the draft on change so a refresh never loses the choice.
 */
export function StepVisibility() {
  const { navigate } = useRouter();
  const draft = useDraft();
  const [v, setV] = useState<Visibility>(draft.visibility ?? "public");
  const [replyDays, setReplyDays] = useState<number>(
    draft.replyWindowDays ?? 2,
  );
  const isCustomDay = !PRESET_DAYS.includes(replyDays as 1 | 2 | 3);
  const [customActive, setCustomActive] = useState(isCustomDay);
  const [customStr, setCustomStr] = useState(
    isCustomDay ? String(replyDays) : "",
  );
  const customInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    patchDraft({ visibility: v });
  }, [v]);

  useEffect(() => {
    patchDraft({ replyWindowDays: replyDays });
  }, [replyDays]);

  const onPreset = (days: number) => {
    setReplyDays(days);
    setCustomActive(false);
    setCustomStr("");
  };

  const onCustomToggle = () => {
    if (!customActive) {
      setCustomActive(true);
      setCustomStr("4");
      setReplyDays(4);
      requestAnimationFrame(() => customInputRef.current?.focus());
    }
  };

  return (
    <OnboardingShell step={7} total={8} back="/claim/socials">
      <OnboardingTitle
        title="Control who can reach you."
        description="Change this whenever you like. Being open doesn't mean accepting everyone — your rules still decide what reaches you."
      />

      <Reveal delay={0.32} duration={0.85} axis="x" blur={5}>
        <div className="mt-14 max-w-[780px]">
          <Label>Status</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {STATE_OPTIONS.map((opt) => {
              const active = v === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  onClick={() => setV(opt.value)}
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
                  const active = replyDays === d && !customActive;
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
                          const last = raw.replace(/^0+/, "").slice(-1);
                          if (last === "") return;
                          const n = Math.min(MAX_REPLY_WINDOW, Math.max(1, parseInt(last, 10)));
                          setCustomStr(String(n));
                          setReplyDays(n);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" || e.key === "Delete") {
                            e.preventDefault();
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
                A tighter window signals attentiveness. Max {MAX_REPLY_WINDOW} days.
              </p>
            </div>
          </div>

          <div className="mt-10 flex items-center gap-4">
            <Button
              size="lg"
              trailingArrow
              onClick={() => navigate("/claim/finish")}
            >
              Continue
            </Button>
          </div>
        </div>
      </Reveal>
    </OnboardingShell>
  );
}
