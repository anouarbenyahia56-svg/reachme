"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { Button, GhostButton } from "@/components/Button";
import {
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@/components/Field";
import { EASE } from "@/components/layout";
import {
  Screen,
  ScreenEyebrow,
  ScreenLede,
  ScreenTitle,
} from "@/components/Screen";
import {
  type HandleAvailability,
  validateHandleSyntax,
} from "@/lib/domain";
import { useStore } from "@/lib/session";

/**
 * Claim flow — the first screen after the landing page CTA.
 *
 * Two steps in one composition:
 *   1. Handle. The only irreversible commitment. Real-time availability.
 *   2. Email. We send a magic link. Step is revealed after the handle
 *      is confirmed — the page transforms in place rather than routing.
 *
 * Reading order is the design: a single editorial column, the question,
 * the input, the next moment. Nothing competes for attention.
 */
export function ClaimScreen() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const { store } = useStore();

  const [step, setStep] = useState<"handle" | "email">("handle");

  // Handle state
  const [handleInput, setHandleInput] = useState("");
  const [availability, setAvailability] = useState<HandleAvailability>({
    state: "idle",
  });
  const [confirmedHandle, setConfirmedHandle] = useState<string | null>(null);
  const checkRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced availability check.
  useEffect(() => {
    const value = handleInput.trim().toLowerCase();
    if (checkRef.current) clearTimeout(checkRef.current);
    if (value === "") {
      setAvailability({ state: "idle" });
      return;
    }
    const syntax = validateHandleSyntax(value);
    if (syntax.state !== "available") {
      setAvailability(syntax);
      return;
    }
    setAvailability({ state: "checking" });
    checkRef.current = setTimeout(async () => {
      const result = await store.checkHandleAvailability(value);
      setAvailability(result);
    }, 320);
  }, [handleInput, store]);

  function handleConfirmHandle() {
    if (availability.state !== "available") return;
    setConfirmedHandle(handleInput.trim().toLowerCase());
    setStep("email");
  }

  // Email state
  const [emailInput, setEmailInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    const email = emailInput.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setEmailError("Enter a valid email so we can send your sign-in link.");
      return;
    }
    if (!confirmedHandle) return;
    setSubmitting(true);
    try {
      const { token } = await store.beginSignIn(email, confirmedHandle);
      // Magic-link UX: in dev/local mode we expose the token via the
      // verify URL the next page links to. The check-email page reads
      // pending state from the store and shows the dev shortcut.
      router.push(
        `/claim/check-email?h=${encodeURIComponent(
          confirmedHandle,
        )}&e=${encodeURIComponent(email)}&t=${encodeURIComponent(token)}`,
      );
    } catch (err) {
      setSubmitting(false);
      setEmailError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    }
  }

  const canConfirm = availability.state === "available" && !!handleInput.trim();
  const canSendLink = !!emailInput.trim() && !submitting;

  return (
    <>
      <AppNav />
      <Screen>
        <div className="flex flex-col gap-3">
          <ScreenEyebrow>Step {step === "handle" ? "01" : "02"} · Claim</ScreenEyebrow>
          <ScreenTitle>
            {step === "handle"
              ? "Pick your handle."
              : "Where should we send your sign-in link?"}
          </ScreenTitle>
          <ScreenLede>
            {step === "handle" ? (
              <>
                Your handle is the address of your ReachMe page. It’s yours
                from the moment you claim it.
              </>
            ) : (
              <>
                One link, one click. We’ll set you up at{" "}
                <span className="text-[hsl(var(--ink))]">
                  reachme.com/{confirmedHandle}
                </span>
                .
              </>
            )}
          </ScreenLede>
        </div>

        <div className="mt-12">
          <AnimatePresence mode="wait" initial={false}>
            {step === "handle" ? (
              <motion.div
                key="handle"
                initial={
                  reduced
                    ? { opacity: 1 }
                    : { opacity: 0, y: 14, filter: "blur(8px)" }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={
                  reduced
                    ? { opacity: 0 }
                    : { opacity: 0, y: -10, filter: "blur(6px)" }
                }
                transition={{ duration: 0.55, ease: EASE }}
              >
                <HandleStep
                  value={handleInput}
                  onChange={setHandleInput}
                  availability={availability}
                  onConfirm={handleConfirmHandle}
                  canConfirm={canConfirm}
                />
              </motion.div>
            ) : (
              <motion.div
                key="email"
                initial={
                  reduced
                    ? { opacity: 1 }
                    : { opacity: 0, y: 14, filter: "blur(8px)" }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={
                  reduced
                    ? { opacity: 0 }
                    : { opacity: 0, y: -10, filter: "blur(6px)" }
                }
                transition={{ duration: 0.55, ease: EASE }}
              >
                <form onSubmit={handleSendLink} noValidate>
                  <FieldGroup>
                    <div>
                      <FieldLabel htmlFor="claim-email">Your email</FieldLabel>
                      <Input
                        id="claim-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        spellCheck={false}
                        autoFocus
                        placeholder="you@domain.com"
                        value={emailInput}
                        onChange={(e) => {
                          setEmailInput(e.target.value);
                          setEmailError(null);
                        }}
                        invalid={!!emailError}
                      />
                      <FieldError>{emailError}</FieldError>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
                      <Button
                        type="submit"
                        loading={submitting}
                        disabled={!canSendLink}
                      >
                        {submitting ? "Sending…" : "Send sign-in link"}
                      </Button>
                      <GhostButton
                        type="button"
                        onClick={() => setStep("handle")}
                      >
                        Pick a different handle
                      </GhostButton>
                    </div>
                  </FieldGroup>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Screen>
    </>
  );
}

// ─── Handle step ──────────────────────────────────────────────────────────

function HandleStep({
  value,
  onChange,
  availability,
  onConfirm,
  canConfirm,
}: {
  value: string;
  onChange: (v: string) => void;
  availability: HandleAvailability;
  onConfirm: () => void;
  canConfirm: boolean;
}) {
  const errorMessage = useMemo(() => {
    if (availability.state === "invalid") return availability.reason;
    if (availability.state === "taken")
      return "That handle isn’t available. Try another.";
    return null;
  }, [availability]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canConfirm) onConfirm();
      }}
      noValidate
    >
      <FieldGroup>
        <div>
          <FieldLabel
            htmlFor="claim-handle"
            hint={
              <span className="font-mono">reachme.com/{value || "—"}</span>
            }
          >
            Your handle
          </FieldLabel>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-3 select-none text-[hsl(var(--ink-subtle))]"
              style={{
                fontSize: "max(16px, 1.1rem)",
                letterSpacing: "-0.01em",
              }}
            >
              /
            </span>
            <Input
              id="claim-handle"
              name="handle"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="yourname"
              value={value}
              onChange={(e) =>
                onChange(e.target.value.toLowerCase().replace(/\s+/g, ""))
              }
              autoFocus
              maxLength={24}
              inputMode="text"
              invalid={
                availability.state === "invalid" ||
                availability.state === "taken"
              }
              className="pl-5"
            />
            {/* Status indicator on the right edge of the field. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-3 flex h-6 items-center text-[hsl(var(--ink-muted))]"
            >
              {availability.state === "checking" ? (
                <Loader2 size={16} strokeWidth={1.6} className="animate-spin" />
              ) : availability.state === "available" && value.length > 0 ? (
                <Check size={16} strokeWidth={1.8} />
              ) : null}
            </div>
          </div>
          <FieldError>{errorMessage}</FieldError>
          {availability.state === "available" && value.length > 0 ? (
            <p
              className="mt-2 text-[hsl(var(--ink-muted))]"
              style={{
                fontSize: "0.85rem",
                fontStyle: "italic",
                letterSpacing: "-0.005em",
              }}
            >
              Available. Yours when you continue.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
          <Button type="submit" disabled={!canConfirm}>
            Continue
          </Button>
          <span
            className="text-[hsl(var(--ink-subtle))]"
            style={{
              fontSize: "0.7rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            Letters, numbers, underscores
          </span>
        </div>
      </FieldGroup>
    </form>
  );
}
