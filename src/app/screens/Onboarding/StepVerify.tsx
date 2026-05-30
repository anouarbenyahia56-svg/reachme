import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "../../ui/Button";
import { Reveal } from "../../ui/Reveal";
import { useRouter } from "../../router";
import { OnboardingShell, OnboardingTitle } from "./OnboardingShell";
import { clearDraft, useDraft } from "../../store/draft";
import { setAccount, setProfile } from "../../store/session";
import { seedDemoForOwner } from "../../store/requests";
import {
  clearVerification,
  getChallenge,
  requestVerification,
  resendCooldownRemaining,
  verifyCode,
  VERIFICATION_CONSTANTS,
} from "../../store/verification";
import type { Profile } from "../../types";
import { useToast } from "../../ui/Toast";

const { CODE_LENGTH } = VERIFICATION_CONSTANTS;

type Phase = "entry" | "verifying" | "success";

/**
 * The verification gate — the final handshake before a page goes
 * live. Reached only from StepFinish, which has already issued a
 * challenge for the draft email.
 *
 * States, all designed:
 *   • entry      — the default waiting state with the code inputs.
 *   • error      — a wrong/expired code; message sits under the
 *                  inputs, inputs flag ink, never a dead end.
 *   • resend     — available after a 30s cooldown, with a live
 *                  countdown while it's locked.
 *   • verifying  — the brief confirming beat.
 *   • success    — the code is accepted; the page commits and we
 *                  move into the dashboard.
 *
 * Guards: if there's no draft or no active challenge, we route the
 * person back to the right resume point rather than render a
 * gate with nothing behind it.
 */
export function StepVerify() {
  const { navigate } = useRouter();
  const draft = useDraft();
  const toast = useToast();

  const [digits, setDigits] = useState<string[]>(
    Array(CODE_LENGTH).fill(""),
  );
  const [phase, setPhase] = useState<Phase>("entry");
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(() => resendCooldownRemaining());
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const email = draft.email ?? "";
  const code = digits.join("");
  const complete = code.length === CODE_LENGTH;

  // Guard: no draft email or no live challenge → go back to finish.
  useEffect(() => {
    if (!draft.handle || !draft.displayName || !draft.title) {
      navigate("/claim/finish", { replace: true });
      return;
    }
    if (!getChallenge()) {
      navigate("/claim/finish", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Focus the first input on mount.
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Live resend countdown.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(() => {
      setCooldown(resendCooldownRemaining());
    }, 250);
    return () => window.clearInterval(t);
  }, [cooldown]);

  const previewProfile: Profile | null = useMemo(() => {
    if (!draft.handle || !draft.displayName || !draft.title) return null;
    return {
      handle: draft.handle,
      displayName: draft.displayName,
      title: draft.title,
      bio: draft.bio ?? "",
      avatarUrl: draft.avatarUrl,
      bannerUrl: draft.bannerUrl,
      minAmountCents: draft.minAmountCents ?? 15000,
      replyWindowDays: draft.replyWindowDays ?? 7,
      categories: draft.categories ?? [],
      visibility: draft.visibility ?? "public",
      verified: false,
      createdAt: new Date().toISOString(),
    };
  }, [draft]);

  const setDigit = (index: number, value: string) => {
    const clean = value.replace(/\D/g, "");
    setError(null);
    if (clean.length > 1) {
      // Paste / multi-char: distribute across inputs from here.
      const next = [...digits];
      for (let i = 0; i < clean.length && index + i < CODE_LENGTH; i++) {
        next[index + i] = clean[i];
      }
      setDigits(next);
      const land = Math.min(index + clean.length, CODE_LENGTH - 1);
      inputsRef.current[land]?.focus();
      return;
    }
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const onKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
    if (e.key === "Enter" && complete) {
      submit();
    }
  };

  const goLive = (p: Profile) => {
    setAccount({
      email,
      displayName: p.displayName,
      hasProfile: true,
    });
    setProfile({ ...p, verified: true });
    seedDemoForOwner({ ...p, verified: true });
    clearVerification();
    clearDraft();
    navigate("/dashboard?welcome=1", { replace: true });
  };

  const submit = async () => {
    if (!complete || !previewProfile) return;
    setPhase("verifying");
    setError(null);
    await new Promise((r) => setTimeout(r, 600));

    const result = verifyCode(code);
    if (!result.ok) {
      setPhase("entry");
      setError(result.message);
      setDigits(Array(CODE_LENGTH).fill(""));
      inputsRef.current[0]?.focus();
      return;
    }

    setPhase("success");
    // A short, earned beat on success before the page commits.
    await new Promise((r) => setTimeout(r, 850));
    goLive(previewProfile);
  };

  const resend = () => {
    if (cooldown > 0) return;
    const { code: fresh } = requestVerification(email);
    setDigits(Array(CODE_LENGTH).fill(""));
    setError(null);
    setCooldown(resendCooldownRemaining());
    inputsRef.current[0]?.focus();
    toast.show("New code sent.", `Demo code: ${fresh}`);
  };

  if (!previewProfile) return null;

  const cooldownSec = Math.ceil(cooldown / 1000);

  return (
    <OnboardingShell step={6} total={6} back="/claim/finish">
      <OnboardingTitle
        eyebrow="One step from live"
        title="Confirm it's you."
        description={`We sent a ${CODE_LENGTH}-digit code to ${email}. Enter it below to take your page live.`}
      />

      <Reveal delay={0.32} duration={0.85} axis="x">
        <div className="mt-14 max-w-[560px]">
          {phase === "success" ? (
            <SuccessState handle={previewProfile.handle} />
          ) : (
            <>
              <div className="rounded-3xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] px-7 py-8 sm:px-9 sm:py-9">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--ink-subtle))]">
                  Verification code
                </p>

                <div className="mt-4 flex gap-2.5 sm:gap-3">
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        inputsRef.current[i] = el;
                      }}
                      inputMode="numeric"
                      autoComplete={i === 0 ? "one-time-code" : "off"}
                      maxLength={i === 0 ? CODE_LENGTH : 1}
                      value={d}
                      disabled={phase === "verifying"}
                      onChange={(e) => setDigit(i, e.target.value)}
                      onKeyDown={(e) => onKeyDown(i, e)}
                      aria-label={`Digit ${i + 1}`}
                      className={[
                        "h-14 w-full rounded-2xl border bg-[hsl(var(--page))] text-center font-serif text-[22px] font-medium text-[hsl(var(--ink))] transition-[border-color] duration-300 focus:outline-none",
                        error
                          ? "border-[hsl(var(--ink))]"
                          : "border-[hsl(var(--rule-strong))] focus:border-[hsl(var(--ink))]",
                      ].join(" ")}
                    />
                  ))}
                </div>

                <div className="mt-3 min-h-[18px]">
                  {error && (
                    <p className="text-[12.5px] leading-[1.5] text-[hsl(var(--ink))]">
                      {error}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <Button
                    size="lg"
                    trailingArrow
                    disabled={!complete}
                    loading={phase === "verifying"}
                    onClick={submit}
                  >
                    Verify &amp; go live
                  </Button>

                  {cooldown > 0 ? (
                    <p className="text-[12.5px] text-[hsl(var(--ink-subtle))]">
                      Resend code in {cooldownSec}s
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={resend}
                      className="text-[12.5px] text-[hsl(var(--ink-muted))] underline-offset-4 transition-colors duration-300 hover:text-[hsl(var(--ink))] hover:underline"
                    >
                      Didn't get it? Resend code
                    </button>
                  )}
                </div>
              </div>

              <p className="mt-5 text-[12.5px] leading-[1.6] text-[hsl(var(--ink-subtle))]">
                Wrong email?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/claim/finish")}
                  className="text-[hsl(var(--ink-muted))] underline-offset-4 transition-colors duration-300 hover:text-[hsl(var(--ink))] hover:underline"
                >
                  Go back and change it
                </button>
                .
              </p>
            </>
          )}
        </div>
      </Reveal>
    </OnboardingShell>
  );
}

function SuccessState({ handle }: { handle: string }) {
  return (
    <div className="rounded-3xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] px-7 py-12 text-center sm:px-10 sm:py-14">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--ink))] text-[hsl(var(--page))]">
        <Check size={20} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <h2
        className="mt-7 font-serif text-[hsl(var(--ink))]"
        style={{
          fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
          fontWeight: 500,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          textWrap: "balance",
        }}
      >
        You're verified. Taking your page live…
      </h2>
      <p className="mx-auto mt-3 max-w-[36ch] text-[13.5px] leading-[1.6] text-[hsl(var(--ink-muted))]">
        reachme.com/{handle} is going up now.
      </p>
    </div>
  );
}
