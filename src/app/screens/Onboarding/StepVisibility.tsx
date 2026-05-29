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
import { Lock } from "lucide-react";

const OPTIONS: ReadonlyArray<{
  value: Visibility;
  label: string;
  helper: string;
}> = [
  {
    value: "public",
    label: "Public + searchable",
    helper: "Indexed in ReachMe search and shareable by link.",
  },
  {
    value: "link-only",
    label: "Link only",
    helper: "Reachable only by people who already have your link.",
  },
  {
    value: "paused",
    label: "Paused",
    helper: "Visible to anyone, but not accepting new requests.",
  },
];

/**
 * Step 5 — Visibility.
 *
 * Three options as horizontal cards. Selected one fills with ink;
 * the others stay surface. The reply window is disclosed here as
 * fixed platform policy — no toggle, no false choice.
 */
export function StepVisibility() {
  const { navigate } = useRouter();
  const draft = useDraft();
  const [v, setV] = useState<Visibility>(draft.visibility ?? "public");

  useEffect(() => {
    patchDraft({ visibility: v });
  }, [v]);

  return (
    <OnboardingShell step={5} total={6} back="/claim/categories">
      <OnboardingTitle
        eyebrow="Visibility"
        title="Decide who can find you."
        description="You can change this any time. Even at its most public, your page only forwards requests that meet your rules."
      />

      <Reveal delay={0.32} duration={0.85} axis="x">
        <div className="mt-14 max-w-[780px]">
          <Label>Public visibility</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            {OPTIONS.map((opt) => {
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

          <div className="mt-7 flex items-start gap-3 rounded-2xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] px-5 py-4">
            <Lock
              size={15}
              strokeWidth={1.6}
              className="mt-0.5 shrink-0 text-[hsl(var(--ink-muted))]"
              aria-hidden="true"
            />
            <div>
              <p className="text-[13.5px] font-medium text-[hsl(var(--ink))]">
                7-day reply window
              </p>
              <p className="mt-1 max-w-[60ch] text-[12.5px] leading-[1.6] text-[hsl(var(--ink-muted))]">
                Fixed platform policy. If you don't reply within seven
                days, the request expires and the sender is refunded
                automatically. We take nothing.
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
