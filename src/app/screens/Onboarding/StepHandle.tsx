import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { useRouter } from "../../router";
import { Button } from "../../ui/Button";
import { Label } from "../../ui/Field";
import { Reveal } from "../../ui/Reveal";
import { OnboardingShell, OnboardingTitle } from "./OnboardingShell";
import { isHandleAvailable } from "../../store/format";
import { isHandleTaken } from "../../store/directory";
import { patchDraft, useDraft } from "../../store/draft";

// Handle shape: first char a-z/0-9, the rest in the allowed
// set (a-z, 0-9, hyphen, underscore), 1-30 chars total. No
// 2-char minimum — a single letter that isn't taken is just
// as claimable as a long name. The 30-char ceiling keeps a
// claimed handle a sensible URL segment.
const HANDLE_SHAPE = /^[a-z0-9][a-z0-9_-]{0,29}$/;

/**
 * Step 1 — Claim your handle.
 *
 * The handle is the public address. We validate as the person
 * types: shape first (a-z, 0-9, -, _; 1-30 chars), then
 * availability (against reserved + directory). The "is yours"
 * message and the Continue button share the same predicate —
 * shape-valid, not reserved, not taken — so a single letter
 * that's open is just as claimable as a long one.
 *
 * Continue commits the handle and advances to Step 2 (Email).
 */
export function StepHandle() {
  const { navigate } = useRouter();
  const draft = useDraft();
  const [value, setValue] = useState<string>(draft.handle ?? "");
  const [blurred, setBlurred] = useState(false);
  const [checking, setChecking] = useState(false);

  const normalized = value.trim().toLowerCase();

  const status = useMemo(() => {
    if (!normalized) return "empty" as const;
    if (!HANDLE_SHAPE.test(normalized)) return "invalid" as const;
    if (!isHandleAvailable(normalized)) return "reserved" as const;
    if (isHandleTaken(normalized)) return "taken" as const;
    return "ok" as const;
  }, [normalized]);

  // Tiny debounce on the "checking" UI so it doesn't blink.
  useEffect(() => {
    if (status !== "ok") {
      setChecking(false);
      return;
    }
    setChecking(true);
    const t = window.setTimeout(() => setChecking(false), 280);
    return () => window.clearTimeout(t);
  }, [status, normalized]);

  // "is yours" — the handle is shape-valid, not reserved, and
  // not taken. Single character or long, a handle that's open
  // is open. The Continue button shares this same predicate
  // (plus the debounce), so the message and the affordance
  // never disagree.
  const isAvailable = status === "ok";
  const canContinue = isAvailable && !checking;

  // Errors are gated on blur. While the user is still typing
  // (focused, never blurred) we keep the field neutral. The
  // "invalid" status (bad characters) is never surfaced as an
  // error message — the disabled Continue button is the cue.
  // Only reserved/taken (real conflicts) get the full error
  // treatment, and only after the user has left the field.
  // Once blurred is true, the latch stays true and those
  // errors update live as the user types to fix them.
  const showError =
    blurred && (status === "reserved" || status === "taken");

  return (
    <OnboardingShell step={1} total={8}>
      <OnboardingTitle
        title="Claim your handle."
        description="Your handle becomes the public page where people can reach you. Choose something short, memorable, and yours."
      />

      <Reveal delay={0.32} duration={0.85} axis="x" blur={5}>
        <div className="mt-14 max-w-[640px]">
          <Label htmlFor="handle">This is where people will find you</Label>
          <div
            className={[
                "relative flex w-full max-w-[440px] items-stretch overflow-hidden rounded-2xl border bg-[hsl(var(--surface))] transition-[border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              isAvailable
                ? "border-[hsl(var(--ink))]"
                : showError
                  ? "border-[hsl(var(--danger))]"
                  : "border-[hsl(var(--rule-strong))] focus-within:border-[hsl(var(--ink))]",
            ].join(" ")}
          >
            <span className="select-none border-r border-[hsl(var(--rule))] bg-[hsl(var(--page))] px-5 py-4 text-[15px] text-[hsl(var(--ink-muted))]">
              reachme.com/
            </span>
            <input
              id="handle"
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={30}
              placeholder="yourname"
              value={value}
              onChange={(e) => {
                setValue(e.target.value.replace(/\s+/g, ""));
              }}
              onBlur={() => setBlurred(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canContinue) {
                  patchDraft({ handle: normalized });
                  navigate("/claim/email");
                }
              }}
              className="w-full bg-transparent px-5 py-4 text-[15px] text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-subtle))] focus:outline-none"
            />
            <span className="flex items-center pr-5">
              {normalized && (checking || isAvailable || showError) && (
                <StatusIcon
                  status={status}
                  checking={checking}
                  isAvailable={isAvailable}
                />
              )}
            </span>
          </div>

          <div className="mt-2.5 min-h-[18px]">
            <StatusMessage
              status={status}
              value={normalized}
              blurred={blurred}
              isAvailable={isAvailable}
            />
          </div>

          <div className="mt-10 flex items-center gap-4">
            <Button
              size="lg"
              trailingArrow
              disabled={!canContinue}
              loading={checking}
              onClick={() => {
                patchDraft({ handle: normalized });
                navigate("/claim/email");
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      </Reveal>
    </OnboardingShell>
  );
}

function StatusIcon({
  status,
  checking,
  isAvailable,
}: {
  status: "empty" | "invalid" | "reserved" | "taken" | "ok";
  checking: boolean;
  isAvailable: boolean;
}) {
  if (checking) {
    return (
      <Loader2
        size={16}
        strokeWidth={1.6}
        className="animate-spin text-[hsl(var(--ink-muted))]"
        aria-hidden="true"
      />
    );
  }
  if (isAvailable) {
    return (
      <Check
        size={18}
        strokeWidth={1.8}
        className="text-[hsl(var(--ink))]"
        aria-label="Available"
      />
    );
  }
  if (status === "invalid" || status === "reserved" || status === "taken") {
    return (
      <X
        size={18}
        strokeWidth={1.8}
        className="text-[hsl(var(--danger))]"
        aria-label="Not available"
      />
    );
  }
  return null;
}

function StatusMessage({
  status,
  value,
  blurred,
  isAvailable,
}: {
  status: "empty" | "invalid" | "reserved" | "taken" | "ok";
  value: string;
  blurred: boolean;
  isAvailable: boolean;
}) {
  // Available — including a single character that isn't taken
  // or reserved. The "is yours" claim is about availability, not
  // format; the hint text and the disabled Continue button
  // cover the format side.
  if (isAvailable) {
    return (
      <p
        className={[
          "text-[12.5px] leading-[1.55] transition-colors duration-300",
          "text-[hsl(var(--ink))]",
        ].join(" ")}
      >
        {`reachme.com/${value} is yours.`}
      </p>
    );
  }
  // reserved or taken — but the user is still typing.
  // Don't surface the error until they've left the field.
  if (status === "reserved" || status === "taken") {
    if (!blurred) {
      return (
        <p className="text-[12.5px] leading-[1.55] transition-colors duration-300">
          {"\u00A0"}
        </p>
      );
    }
    const text =
      status === "reserved"
        ? "That handle is reserved. Pick another."
        : "This handle is already taken.";
    return (
      <p
        className={[
          "text-[12.5px] leading-[1.55] transition-colors duration-300",
          "text-[hsl(var(--danger))]",
        ].join(" ")}
      >
        {text}
      </p>
    );
  }
  // empty (or any other unhandled state) — show a helpful hint.
  if (!value) {
    return (
      <p className="text-[12.5px] leading-[1.55] text-[hsl(var(--ink-subtle))]">
        Type a handle to check availability.
      </p>
    );
  }
  return (
    <p className="text-[12.5px] leading-[1.55] transition-colors duration-300">
      {"\u00A0"}
    </p>
  );
}
