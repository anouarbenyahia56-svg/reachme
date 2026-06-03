import { useEffect, useState } from "react";
import { useRouter } from "../../router";
import { Button } from "../../ui/Button";
import { Label } from "../../ui/Field";
import { Reveal } from "../../ui/Reveal";
import { OnboardingShell, OnboardingTitle } from "./OnboardingShell";
import { patchDraft, useDraft } from "../../store/draft";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Step 2 — Secure your handle.
 *
 * Email is collected here, not at the end, so the final step
 * stays a single decisive action. The button is dormant until
 * a valid address is entered; the draft is patched on every
 * change so back-and-forth never loses what was typed.
 */
export function StepEmail() {
  const { navigate } = useRouter();
  const draft = useDraft();
  const [email, setEmail] = useState(draft.email ?? "");

  useEffect(() => {
    patchDraft({ email });
  }, [email]);

  const canContinue = EMAIL_RE.test(email);

  return (
    <OnboardingShell step={2} total={7} back="/claim">
      <OnboardingTitle
        title="Secure your handle."
        description="We'll only use this to notify you when requests arrive. No spam, no sharing."
      />

      <Reveal delay={0.32} duration={0.85} axis="x">
        <div className="mt-14 max-w-[640px]">
          <Label htmlFor="email">Email</Label>
          <div className="relative flex items-stretch overflow-hidden rounded-2xl border border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] transition-[border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-within:border-[hsl(var(--ink))]">
            <input
              id="email"
              type="email"
              autoFocus
              autoComplete="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canContinue) {
                  navigate("/claim/identity");
                }
              }}
              className="w-full bg-transparent px-5 py-4 text-[15px] text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-subtle))] focus:outline-none"
            />
          </div>

          <div className="mt-10 flex items-center gap-4">
            <Button
              size="lg"
              trailingArrow
              disabled={!canContinue}
              onClick={() => navigate("/claim/identity")}
            >
              Continue
            </Button>
          </div>
        </div>
      </Reveal>
    </OnboardingShell>
  );
}
