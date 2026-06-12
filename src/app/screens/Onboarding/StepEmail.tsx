import { useEffect, useRef, useState } from "react";
import { Button } from "../../ui/Button";
import { TextField } from "../../ui/Field";
import { Reveal } from "../../ui/Reveal";
import { OnboardingShell, OnboardingTitle } from "./OnboardingShell";
import { patchDraft, useDraft } from "../../store/draft";
import { isEmailRegistered } from "../../store/directory";
import { Link, useRouter } from "../../router";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Step 2 — Link your email.
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
  const abortRef = useRef<AbortController | null>(null);

  const trimmed = email.trim();

  useEffect(() => {
    patchDraft({ email: trimmed });
  }, [trimmed]);

  // --- Layer 1: shape validation (sync, instant) ---
  const shapeValid = EMAIL_RE.test(trimmed);

  // --- Layer 2: availability check (async-ready) ---
  const [registered, setRegistered] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!shapeValid) {
      setRegistered(false);
      setChecking(false);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setChecking(true);

    // Backend integration point: replace with API call
    // e.g. fetch("/api/email/check", { signal: ctrl.signal, ... })
    const result = isEmailRegistered(trimmed);
    if (!ctrl.signal.aborted) {
      setRegistered(result);
      setChecking(false);
    }

    return () => ctrl.abort();
  }, [trimmed, shapeValid]);

  const errorText = registered ? "This email is already registered." : undefined;
  const showError = blurred && !!errorText;
  const canContinue = shapeValid && !registered && !checking;

  const proceed = () => {
    if (!canContinue) return;
    navigate("/claim/identity");
  };

  return (
    <OnboardingShell step={2} total={7} back="/claim">
      <OnboardingTitle
        title="Link your email."
        description="This is how you sign in and how we notify you when a request arrives. No spam, no sharing."
      />

      <Reveal delay={0.32} duration={0.85} axis="x" blur={5}>
        <div className="mt-12 max-w-[640px]">
          <TextField
            label="Email"
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
            errorText={showError ? errorText : undefined}
            aria-invalid={showError ? "true" : undefined}
            className="max-w-[440px]"
          />

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
