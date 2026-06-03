import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { useRouter } from "../../router";
import { Button } from "../../ui/Button";
import { Label } from "../../ui/Field";
import { Reveal } from "../../ui/Reveal";
import { OnboardingShell, OnboardingTitle } from "./OnboardingShell";
import { isHandleAvailable, isHandleValid } from "../../store/format";
import { isHandleTaken } from "../../store/directory";
import { patchDraft, useDraft } from "../../store/draft";

/**
 * Step 1 — Claim your handle.
 *
 * The handle is the public address. We validate as the person
 * types: shape first (letters/numbers/hyphens/underscores), then
 * availability (against reserved + directory). Both checks share
 * one row of microcopy beneath the field — green on available,
 * neutral on empty, ink on rejected.
 *
 * Continue commits the handle and advances to Step 2 (Email).
 */
export function StepHandle() {
  const { navigate } = useRouter();
  const draft = useDraft();
  const [value, setValue] = useState<string>(draft.handle ?? "");
  const [touched, setTouched] = useState(false);
  const [checking, setChecking] = useState(false);

  const normalized = value.trim().toLowerCase();

  const status = useMemo(() => {
    if (!normalized) return "empty" as const;
    if (!isHandleValid(normalized)) return "invalid" as const;
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

  const canContinue = status === "ok" && !checking;

  return (
    <OnboardingShell step={1} total={7}>
      <OnboardingTitle
        eyebrow="Claim"
        title="Claim your handle."
        description="Your handle becomes the public page where people can reach you. Choose something short, memorable, and yours."
      />

      <Reveal delay={0.32} duration={0.85} axis="x">
        <div className="mt-14 max-w-[640px]">
          <Label htmlFor="handle">This is where people will find you</Label>
          <div
            className={[
              "relative flex items-stretch overflow-hidden rounded-2xl border bg-[hsl(var(--surface))] transition-[border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              status === "ok"
                ? "border-[hsl(var(--ink))]"
                : status === "invalid" ||
                    status === "taken" ||
                    status === "reserved"
                  ? "border-[hsl(var(--ink))]"
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
              placeholder="yourname"
              value={value}
              onChange={(e) => {
                setTouched(true);
                setValue(e.target.value.replace(/\s+/g, ""));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canContinue) {
                  patchDraft({ handle: normalized });
                  navigate("/claim/email");
                }
              }}
              className="w-full bg-transparent px-5 py-4 text-[15px] text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-subtle))] focus:outline-none"
            />
            <span className="flex items-center pr-5">
              {touched && normalized && (
                <StatusIcon status={status} checking={checking} />
              )}
            </span>
          </div>

          <p className="mt-2.5 text-[12px] leading-[1.55] text-[hsl(var(--ink-subtle))]">
            Lowercase letters, numbers, hyphens, and underscores.
          </p>
          <div className="mt-1.5 min-h-[18px]">
            <StatusMessage status={status} value={normalized} />
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
}: {
  status: "empty" | "invalid" | "reserved" | "taken" | "ok";
  checking: boolean;
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
  if (status === "ok") {
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
        className="text-[hsl(var(--ink))]"
        aria-label="Unavailable"
      />
    );
  }
  return null;
}

function StatusMessage({
  status,
  value,
}: {
  status: "empty" | "invalid" | "reserved" | "taken" | "ok";
  value: string;
}) {
  const text =
    status === "empty"
      ? ""
      : status === "invalid"
        ? "Two characters or more, please."
        : status === "reserved"
          ? "That handle is reserved. Pick another."
          : status === "taken"
            ? `reachme.com/${value} is taken. Try a variation.`
            : `reachme.com/${value} is yours.`;
  return (
    <p
      className={[
        "text-[12.5px] leading-[1.55] transition-colors duration-300",
        status === "ok"
          ? "text-[hsl(var(--ink))]"
          : "text-[hsl(var(--ink-muted))]",
      ].join(" ")}
    >
      {text || "\u00A0"}
    </p>
  );
}
