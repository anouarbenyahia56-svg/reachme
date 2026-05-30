import { useEffect, useState } from "react";
import { Button } from "../../ui/Button";
import { TextField, Label } from "../../ui/Field";
import { Reveal } from "../../ui/Reveal";
import { useRouter } from "../../router";
import { OnboardingShell, OnboardingTitle } from "./OnboardingShell";
import { patchDraft, useDraft } from "../../store/draft";
import type { Profile } from "../../types";
import { formatMoney } from "../../store/format";
import { ProfilePreviewCard } from "../Public/ProfilePreviewCard";
import { Pill } from "../../ui/Pill";
import { requestVerification } from "../../store/verification";
import { useToast } from "../../ui/Toast";

/**
 * Step 6 — Finish.
 *
 * The final review. The CTA does not take the page live directly:
 * it issues an email verification challenge and hands off to the
 * verify screen (/claim/verify). The page only goes live once the
 * code is confirmed there — a real auth gate that a production
 * verifier can slot into cleanly.
 */
export function StepFinish() {
  const { navigate } = useRouter();
  const draft = useDraft();
  const toast = useToast();
  const [email, setEmail] = useState(draft.email ?? "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    patchDraft({ email });
  }, [email]);

  // If essential pieces are missing, kick back to the first
  // missing step rather than render a half-built preview.
  useEffect(() => {
    if (!draft.handle) navigate("/claim", { replace: true });
    else if (!draft.displayName || !draft.title)
      navigate("/claim/identity", { replace: true });
  }, [draft, navigate]);

  if (!draft.handle || !draft.displayName || !draft.title) return null;

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const previewProfile: Profile = {
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

  // Issue a verification challenge, then hand off to the verify
  // screen. The page is NOT committed here — that happens only
  // after the emailed code is confirmed on /claim/verify.
  const startVerification = async () => {
    if (!validEmail) return;
    setSubmitting(true);
    patchDraft({ email });
    await new Promise((r) => setTimeout(r, 500));

    const { code } = requestVerification(email);
    // No mail server in this build, so the code surfaces here. A
    // real backend emails it and returns nothing sensitive.
    toast.show("Verification code sent.", `Demo code: ${code}`);

    navigate("/claim/verify");
  };

  return (
    <OnboardingShell step={6} total={6} back="/claim/visibility">
      <OnboardingTitle
        eyebrow="Almost there"
        title="One last thing."
        description="We'll email you when a request arrives — and only then. No marketing, no digests, nothing else."
      />

      <Reveal delay={0.32} duration={0.85} axis="x">
        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <div>
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && validEmail && !submitting)
                  startVerification();
              }}
              helper="Used to sign in to ReachMe. We'll send a confirmation code here."
            />

            <div className="mt-10 rounded-3xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] px-7 py-8 sm:px-9 sm:py-9">
              <p className="mb-6 text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
                The terms you set
              </p>

              <div className="rounded-2xl border border-[hsl(var(--rule))] bg-[hsl(var(--page))] px-5 py-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--ink-subtle))]">
                  Public address
                </p>
                <p className="mt-2.5 text-[15px] leading-snug">
                  <span className="text-[hsl(var(--ink-subtle))]">
                    reachme.com/
                  </span>
                  <span className="break-all font-medium text-[hsl(var(--ink))]">
                    {draft.handle}
                  </span>
                </p>
              </div>

              <dl className="mt-7 divide-y divide-[hsl(var(--rule))]">
                <TermRow
                  label="Minimum signal"
                  value={formatMoney(draft.minAmountCents ?? 15000)}
                />
                <TermRow
                  label="Reply window"
                  value={`${draft.replyWindowDays ?? 7} days`}
                />
                <TermRow
                  label="State"
                  value={draft.visibility === "paused" ? "Paused" : "Active"}
                />
              </dl>

              <div className="mt-7 border-t border-[hsl(var(--rule))] pt-7">
                <p className="mb-4 text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
                  Categories
                </p>
                <div className="flex flex-wrap gap-2">
                  {(draft.categories ?? []).map((c) => (
                    <Pill key={c.id} size="sm">
                      {c.label}
                    </Pill>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 flex items-center gap-4">
              <Button
                size="lg"
                trailingArrow
                disabled={!validEmail}
                loading={submitting}
                onClick={startVerification}
              >
                Take my page live
              </Button>
            </div>
          </div>

          <div className="lg:pt-9">
            <Label>
              Live preview{" "}
              <span className="font-normal normal-case tracking-normal text-[hsl(var(--ink-subtle))]">
                (This is what people will see.)
              </span>
            </Label>
            <div className="rounded-3xl border border-[hsl(var(--rule))] bg-[hsl(var(--page))] p-5">
              <ProfilePreviewCard profile={previewProfile} variant="preview" />
            </div>
          </div>
        </div>
      </Reveal>
    </OnboardingShell>
  );
}

function TermRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3.5 first:pt-0 last:pb-0">
      <dt className="text-[11px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--ink-subtle))]">
        {label}
      </dt>
      <dd className="whitespace-nowrap text-[15px] font-medium text-[hsl(var(--ink))]">
        {value}
      </dd>
    </div>
  );
}
