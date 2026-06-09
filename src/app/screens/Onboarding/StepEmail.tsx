import { useEffect, useState } from "react";
import { Button } from "../../ui/Button";
import { Label } from "../../ui/Field";
import { Reveal } from "../../ui/Reveal";
import { OnboardingShell, OnboardingTitle } from "./OnboardingShell";
import { patchDraft, useDraft } from "../../store/draft";
import { isEmailRegistered } from "../../store/directory";
import { Link, useRouter } from "../../router";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Step 2 — Secure your handle.
 *
 * A single, clean beat. The user types their email, accepts the
 * terms, and continues to step 3. No in-place detour: email
 * verification lives in the dashboard (VerifyEmailBanner), so
 * the onboarding flow stays forward-only and uninterrupted.
 */
export function StepEmail() {
  const draft = useDraft();
  const { navigate } = useRouter();
  const [email, setEmail] = useState(draft.email ?? "");
  const [blurred, setBlurred] = useState(false);

  useEffect(() => {
    patchDraft({ email });
  }, [email]);

  const trimmed = email.trim();
  const shapeValid = EMAIL_RE.test(trimmed);
  const registered = shapeValid && isEmailRegistered(trimmed);

  // Invalid format is not an error here — the disabled Continue
  // button and the live trimmed input already tell the user what's
  // missing. The only message worth surfacing in red is a real,
  // unfixable conflict: this email is already on another account.
  const errorText = registered ? "This email is already registered." : undefined;

  const showError = blurred && !!errorText;

  const canContinue = shapeValid && !registered;

  const proceed = () => {
    if (!canContinue) return;
    navigate("/claim/identity");
  };

  return (
    <OnboardingShell step={2} total={8} back="/claim">
      <OnboardingTitle
        title="Link your email."
        description="This is how you sign in and how we notify you when a request arrives. No spam, no sharing."
      />

      <Reveal delay={0.32} duration={0.85} axis="x" blur={5}>
        <div className="mt-14 max-w-[640px]">
          <Label htmlFor="email">Email</Label>
          <div
            className={[
              "relative flex w-full max-w-[440px] items-stretch overflow-hidden rounded-2xl border bg-[hsl(var(--surface))] transition-[border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              showError
                ? "border-[hsl(var(--danger))] focus-within:border-[hsl(var(--danger))]"
                : "border-[hsl(var(--rule-strong))] focus-within:border-[hsl(var(--ink))]",
            ].join(" ")}
          >
            <input
              id="email"
              type="email"
              autoFocus
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setBlurred(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canContinue) {
                  proceed();
                }
              }}
              className="w-full bg-transparent px-5 py-4 text-[15px] text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-subtle))] focus:outline-none"
            />
          </div>
          {showError && (
            <p className="mt-2.5 text-[12.5px] leading-[1.55] text-[hsl(var(--danger))]" aria-live="assertive">
              {errorText}
            </p>
          )}

          <p className="mt-3 text-[12.5px] leading-[1.55] text-[hsl(var(--ink-subtle))]">
            By continuing, you agree to our{" "}
            <Link
              href="/terms"
              className="underline underline-offset-2 transition-colors duration-300 hover:text-[hsl(var(--ink))]"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-2 transition-colors duration-300 hover:text-[hsl(var(--ink))]"
            >
              Privacy Policy
            </Link>.
          </p>

          <div className="mt-10 flex items-center gap-4">
            <Button
              size="lg"
              trailingArrow
              disabled={!canContinue}
              onClick={proceed}
            >
              Continue
            </Button>
          </div>
        </div>
      </Reveal>
    </OnboardingShell>
  );
}
