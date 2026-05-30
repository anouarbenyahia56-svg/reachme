import { useEffect, useState } from "react";
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
    label: "Active",
    helper: "Your page is live, public, searchable, and accepting requests.",
  },
  {
    value: "paused",
    label: "Paused",
    helper: "Your page exists but is not accepting new requests.",
  },
];

const REPLY_WINDOWS: ReadonlyArray<{ days: number; label: string }> = [
  { days: 3, label: "3 days" },
  { days: 7, label: "7 days" },
  { days: 14, label: "14 days" },
];

/**
 * Step 5 — Visibility and reply window.
 *
 * Two binary states for visibility (Active or Paused) and a
 * three-way selector for the reply window. Both write through
 * to the draft on change so a refresh never loses the choice.
 */
export function StepVisibility() {
  const { navigate } = useRouter();
  const draft = useDraft();
  const [v, setV] = useState<Visibility>(draft.visibility ?? "public");
  const [replyDays, setReplyDays] = useState<number>(
    draft.replyWindowDays ?? 7,
  );

  useEffect(() => {
    patchDraft({ visibility: v });
  }, [v]);

  useEffect(() => {
    patchDraft({ replyWindowDays: replyDays });
  }, [replyDays]);

  return (
    <OnboardingShell step={5} total={6} back="/claim/categories">
      <OnboardingTitle
        eyebrow="Availability"
        title="Decide if you're open."
        description="Change this whenever you like. Being active doesn't mean being open to everyone — your rules still decide what reaches you."
      />

      <Reveal delay={0.32} duration={0.85} axis="x">
        <div className="mt-14 max-w-[780px]">
          <Label>State</Label>
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
            <div className="grid grid-cols-3 gap-3">
              {REPLY_WINDOWS.map((w) => {
                const active = replyDays === w.days;
                return (
                  <motion.button
                    key={w.days}
                    type="button"
                    whileHover={{ y: -1 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    onClick={() => setReplyDays(w.days)}
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
                      {w.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
            <p className="mt-3 text-[12.5px] leading-[1.55] text-[hsl(var(--ink-subtle))]">
              If you don't reply within your window, the request expires and
              the amount is refunded automatically.
            </p>
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
