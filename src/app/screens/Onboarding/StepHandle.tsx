import { useEffect, useRef, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { useRouter } from "../../router";
import { Button } from "../../ui/Button";
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
 * The handle is the public address. Validation is split into two
 * layers:
 *
 *   1. Shape — instant, local. Regex test on the normalized input.
 *      The Continue button stays disabled while shape is invalid.
 *   2. Availability — async-ready. Triggered by a useEffect when
 *      shape is valid. Currently synchronous (local checks), but
 *      structured so that swapping in a backend API call requires
 *      changing only the useEffect body — the UI, state, and
 *      derived values remain untouched.
 *
 * The "is yours" message and the Continue button share the same
 * predicate — shape-valid AND available — so a single letter
 * that's open is just as claimable as a long one.
 *
 * Continue commits the handle and advances to Step 2 (Email).
 */
export function StepHandle() {
  const { navigate } = useRouter();
  const draft = useDraft();
  const [value, setValue] = useState<string>(draft.handle ?? "");
  const [blurred, setBlurred] = useState(false);

  // Availability state: "unknown" | "checking" | "available" | "reserved" | "taken"
  const [availability, setAvailability] = useState<"unknown" | "checking" | "available" | "reserved" | "taken">("unknown");

  const normalized = value.trim().toLowerCase();

  // Persist on every change so a refresh doesn't lose work.
  useEffect(() => {
    if (normalized) patchDraft({ handle: normalized });
  }, [normalized]);

  // Layer 1: Shape validation — instant, local, synchronous.
  const shapeValid = normalized.length > 0 && HANDLE_SHAPE.test(normalized);

  // Layer 2: Availability check — async-ready.
  // When the backend ships, replace the body of this useEffect with
  // a fetch call. The controller pattern (abort on cleanup) ensures
  // stale responses are discarded when the user keeps typing.
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Not shape-valid or empty — reset to unknown.
    if (!shapeValid) {
      setAvailability("unknown");
      return;
    }

    // Shape is valid — check availability.
    // Abort any in-flight check from a previous keystroke.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setAvailability("checking");

    // ─── Backend integration point ──────────────────────────────
    // Replace this block with:
    //   const res = await fetch(`/api/handles/${normalized}/check`, {
    //     signal: controller.signal,
    //   });
    //   const { available, reason } = await res.json();
    //   if (!controller.signal.aborted) {
    //     setAvailability(available ? "available" : reason ?? "taken");
    //   }
    //
    // For now, run the local checks synchronously (they're instant)
    // and simulate a brief network delay for UI polish.
    const checkLocal = () => {
      if (!isHandleAvailable(normalized)) return "reserved" as const;
      if (isHandleTaken(normalized)) return "taken" as const;
      return "available" as const;
    };

    const t = window.setTimeout(() => {
      if (!controller.signal.aborted) {
        setAvailability(checkLocal());
      }
    }, 280);

    return () => {
      window.clearTimeout(t);
      controller.abort();
    };
  }, [shapeValid, normalized]);

  const isAvailable = availability === "available";
  const canContinue = isAvailable;

  // Errors are gated on blur. While the user is still typing
  // (focused, never blurred) we keep the field neutral. The
  // "invalid" status (bad characters) is never surfaced as an
  // error message — the disabled Continue button is the cue.
  // Only reserved/taken (real conflicts) get the full error
  // treatment, and only after the user has left the field.
  // Once blurred is true, the latch stays true and those
  // errors update live as the user types to fix them.
  const showError =
    blurred && (availability === "reserved" || availability === "taken");

  return (
    <OnboardingShell step={1} total={7}>
      <OnboardingTitle
        title="Claim your handle."
        description="Your handle becomes the public page where people can reach you. Choose something short, memorable, and yours."
      />

      <Reveal delay={0.32} duration={0.85} axis="x" blur={5}>
        <div className="mt-12 max-w-[640px]">
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
                  navigate("/claim/email");
                }
              }}
              className="w-full bg-transparent px-5 py-4 text-[15px] text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-subtle))] focus:outline-none"
            />
            <span className="flex items-center pr-5">
              {normalized && (availability === "checking" || isAvailable || showError) && (
                <StatusIcon
                  availability={availability}
                  isAvailable={isAvailable}
                />
              )}
            </span>
          </div>

          <div className="mt-2.5 min-h-[18px]" aria-live="polite">
            <StatusMessage
              availability={availability}
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
              loading={availability === "checking"}
              onClick={() => {
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
  availability,
  isAvailable,
}: {
  availability: "unknown" | "checking" | "available" | "reserved" | "taken";
  isAvailable: boolean;
}) {
  if (availability === "checking") {
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
  if (availability === "reserved" || availability === "taken") {
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
  availability,
  value,
  blurred,
  isAvailable,
}: {
  availability: "unknown" | "checking" | "available" | "reserved" | "taken";
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
  if (availability === "reserved" || availability === "taken") {
    if (!blurred) {
      return (
        <p className="text-[12.5px] leading-[1.55] transition-colors duration-300">
          {"\u00A0"}
        </p>
      );
    }
    const text =
      availability === "reserved"
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
