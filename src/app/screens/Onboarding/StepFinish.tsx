import { useEffect, useState } from "react";
import { Button } from "../../ui/Button";
import { TextField, Label } from "../../ui/Field";
import { Reveal } from "../../ui/Reveal";
import { useRouter } from "../../router";
import { OnboardingShell, OnboardingTitle } from "./OnboardingShell";
import { clearDraft, patchDraft, useDraft } from "../../store/draft";
import { setAccount, setProfile } from "../../store/session";
import { seedDemoForOwner } from "../../store/requests";
import type { Profile } from "../../types";
import { formatMoney } from "../../store/format";
import { ProfilePreviewCard } from "../Public/ProfilePreviewCard";
import { Pill } from "../../ui/Pill";

/**
 * Step 6 — Finish.
 *
 * The final review. Email is captured here (lightweight
 * authentication seam — a real flow drops a magic-link verifier
 * in this exact spot). Below the email, a live preview of the
 * profile reaffirms the decision. Pressing "Make my page live"
 * commits the profile, seeds a single welcome request, and
 * navigates into the dashboard with a celebratory beat.
 */
export function StepFinish() {
  const { navigate } = useRouter();
  const draft = useDraft();
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

  const goLive = async () => {
    if (!validEmail) return;
    setSubmitting(true);
    // A 600 ms beat — same easing the rest of the platform uses.
    // It earns its weight: this is a meaningful moment.
    await new Promise((r) => setTimeout(r, 600));

    setAccount({
      email,
      displayName: draft.displayName!,
      hasProfile: true,
    });
    setProfile(previewProfile);
    seedDemoForOwner(previewProfile);
    clearDraft();

    navigate("/dashboard?welcome=1", { replace: true });
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
                if (e.key === "Enter" && validEmail && !submitting) goLive();
              }}
              helper="Used to sign in to ReachMe. We'll send a confirmation here."
            />

            <div className="mt-10 rounded-3xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] px-6 py-6 sm:px-8 sm:py-7">
              <p className="mb-3 text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
                Your rules
              </p>
              <dl className="grid gap-5 sm:grid-cols-2">
                <SummaryRow
                  label="Public address"
                  value={`reachme.com/${draft.handle}`}
                />
                <SummaryRow
                  label="Minimum signal"
                  value={formatMoney(draft.minAmountCents ?? 15000)}
                />
                <SummaryRow
                  label="Reply window"
                  value={`${draft.replyWindowDays ?? 7} days`}
                />
                <SummaryRow
                  label="State"
                  value={draft.visibility === "paused" ? "Paused" : "Active"}
                />
              </dl>
              <div className="mt-5 border-t border-[hsl(var(--rule))] pt-5">
                <p className="mb-3 text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
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
                onClick={goLive}
              >
                Take my page live
              </Button>
            </div>
          </div>

          <div className="lg:pt-9">
            <Label>Live preview</Label>
            <div className="rounded-3xl border border-[hsl(var(--rule))] bg-[hsl(var(--page))] p-5">
              <ProfilePreviewCard profile={previewProfile} variant="preview" />
            </div>
            <p className="mt-3 text-[12.5px] text-[hsl(var(--ink-subtle))]">
              This is what people will see.
            </p>
          </div>
        </div>
      </Reveal>
    </OnboardingShell>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--ink-subtle))]">
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-[14.5px] text-[hsl(var(--ink))]">
        {value}
      </dd>
    </div>
  );
}
