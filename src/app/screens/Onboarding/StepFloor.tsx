import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { EASE } from "@/components/motion";
import { Button } from "../../ui/Button";
import { Label } from "../../ui/Field";
import { Reveal } from "../../ui/Reveal";
import { useRouter } from "../../router";
import { OnboardingShell, OnboardingTitle } from "./OnboardingShell";
import { patchDraft, useDraft } from "../../store/draft";
import { formatMoney, parseMoneyToCents } from "../../store/format";

const PRESETS = [
  { cents: 5000, label: "$50", helper: "Light filter" },
  { cents: 15000, label: "$150", helper: "Recommended" },
  { cents: 50000, label: "$500", helper: "High signal" },
  { cents: 150000, label: "$1.5k", helper: "Very high signal" },
] as const;

/**
 * Step 3 — Set your floor.
 *
 * Presets, plus a free-form custom amount. Beneath the choice,
 * an explanation rendered as a quiet card: held on submit,
 * released on reply, refunded otherwise. The reply window is
 * disclosed and locked.
 */
export function StepFloor() {
  const { navigate } = useRouter();
  const draft = useDraft();
  const [cents, setCents] = useState<number>(
    draft.minAmountCents ?? 15000,
  );
  const [custom, setCustom] = useState<string>(() =>
    String((draft.minAmountCents ?? 15000) / 100),
  );

  useEffect(() => {
    patchDraft({ minAmountCents: cents });
  }, [cents]);

  const canContinue = cents >= 1000; // $10 floor minimum-of-minimums

  return (
    <OnboardingShell step={4} total={7} back="/claim/identity">
      <OnboardingTitle
        eyebrow="Your floor"
        title="Set your minimum signal."
        description="The floor is the minimum amount someone must attach to reach you. It is not a price for your time — it is a filter for whether someone means it."
      />

      <Reveal delay={0.32} duration={0.85} axis="x">
        <div className="mt-14 max-w-[780px]">
          <Label htmlFor="floor-custom">Minimum amount</Label>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PRESETS.map((p) => {
              const active = cents === p.cents;
              return (
                <motion.button
                  key={p.cents}
                  type="button"
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  onClick={() => {
                    setCents(p.cents);
                    setCustom(String(p.cents / 100));
                  }}
                  className={[
                    "flex flex-col items-start rounded-2xl border px-4 py-4 text-left transition-[border-color,background-color] duration-300",
                    active
                      ? "border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-[hsl(var(--page))]"
                      : "border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--ink))] hover:border-[hsl(var(--ink))]",
                  ].join(" ")}
                  aria-pressed={active}
                >
                  <span
                    className="font-serif"
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 500,
                      letterSpacing: "-0.025em",
                    }}
                  >
                    {p.label}
                  </span>
                  <span
                    className={[
                      "mt-1 text-[11.5px]",
                      active
                        ? "text-[hsl(var(--page))]/70"
                        : "text-[hsl(var(--ink-subtle))]",
                    ].join(" ")}
                  >
                    {p.helper}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <div className="mt-7">
            <Label htmlFor="floor-custom">
              Or set a custom amount{" "}
              <span className="ml-1 font-normal normal-case tracking-normal text-[hsl(var(--ink-subtle))]">
                ($10 is the lowest floor you can set)
              </span>
            </Label>
            <div className="flex items-center overflow-hidden rounded-2xl border border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] focus-within:border-[hsl(var(--ink))]">
              <span className="select-none border-r border-[hsl(var(--rule))] bg-[hsl(var(--page))] px-5 py-4 text-[15px] text-[hsl(var(--ink-muted))]">
                USD
              </span>
              <span className="pl-4 text-[15px] text-[hsl(var(--ink-muted))]">
                $
              </span>
              <input
                id="floor-custom"
                inputMode="decimal"
                value={custom}
                onChange={(e) => {
                  const v = e.target.value;
                  setCustom(v);
                  const c = parseMoneyToCents(v);
                  if (c > 0) setCents(c);
                }}
                placeholder="150"
                className="w-full bg-transparent px-3 py-4 text-[15px] text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-subtle))] focus:outline-none"
              />
            </div>
            <p className="mt-2.5 text-[12.5px] text-[hsl(var(--ink-subtle))]">
              You can change this any time. Anyone reaching out can attach more — they cannot attach less.
            </p>
          </div>

          <EscrowExplainer cents={cents} />

          <div className="mt-10 flex items-center gap-4">
            <Button
              size="lg"
              trailingArrow
              disabled={!canContinue}
              onClick={() => navigate("/claim/categories")}
            >
              Continue
            </Button>
          </div>
        </div>
      </Reveal>
    </OnboardingShell>
  );
}

function EscrowExplainer({ cents }: { cents: number }) {
  return (
    <div className="mt-10 grid grid-cols-1 gap-4 rounded-3xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] px-6 py-6 sm:grid-cols-3 sm:px-8 sm:py-7">
      <Row
        eyebrow="Held"
        title="On submit"
        body="The amount is held the moment someone attaches it. They have committed."
      />
      <Row
        eyebrow="Released"
        title="On your reply"
        body={`If you reply, the amount is released to you. Our 5% applies only here — ${formatMoney(
          Math.round(cents * 0.05),
        )} on a ${formatMoney(cents)} request.`}
      />
      <Row
        eyebrow="Refunded"
        title="On decline or expiry"
        body="Decline or let it expire. The person reaching out is refunded automatically. We earn nothing."
      />
    </div>
  );
}

function Row({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
        {eyebrow}
      </p>
      <p
        className="mt-2 font-serif text-[hsl(var(--ink))]"
        style={{
          fontSize: "1.05rem",
          fontWeight: 500,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </p>
      <p className="mt-2 text-[12.5px] leading-[1.55] text-[hsl(var(--ink-muted))]">
        {body}
      </p>
    </div>
  );
}
