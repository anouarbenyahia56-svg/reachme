import { useEffect, useState } from "react";
import { Button } from "../../ui/Button";
import { Label } from "../../ui/Field";
import { Reveal } from "../../ui/Reveal";
import { useRouter } from "../../router";
import { OnboardingShell, OnboardingTitle } from "./OnboardingShell";
import { clearDraft, useDraft } from "../../store/draft";
import { setAccount, setProfile } from "../../store/session";
import { seedDemoForOwner } from "../../store/requests";
import { clearVerification } from "../../store/verification";
import type { Profile } from "../../types";
import { ProfilePreviewCard } from "../Public/ProfilePreviewCard";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Step 7 — Launch.
 *
 * The Live Preview is the hero. "Go live" is the absolute final
 * action of onboarding: it commits the account and the profile
 * (mirroring the old verify handoff), seeds demo data, clears
 * the draft, and routes directly into the live dashboard.
 */
export function StepFinish() {
  const { navigate } = useRouter();
  const draft = useDraft();
  const [submitting, setSubmitting] = useState(false);

  // If essential pieces are missing, kick back to the first
  // missing step rather than render a half-built preview.
  useEffect(() => {
    if (!draft.handle) navigate("/claim", { replace: true });
    else if (!draft.displayName || !draft.title)
      navigate("/claim/identity", { replace: true });
    else if (!draft.email || !EMAIL_RE.test(draft.email))
      navigate("/claim/email", { replace: true });
  }, [draft, navigate]);

  if (
    !draft.handle ||
    !draft.displayName ||
    !draft.title ||
    !draft.email ||
    !EMAIL_RE.test(draft.email)
  )
    return null;

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

  // Commit the page, then hand off to the live dashboard.
  // The 250ms beat gives the button a deliberate, premium
  // weight before the route changes.
  const launch = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 250));

    const profile: Profile = { ...previewProfile, verified: true };
    setAccount({
      email: draft.email!,
      displayName: previewProfile.displayName,
      hasProfile: true,
    });
    setProfile(profile);
    seedDemoForOwner(profile);
    clearVerification();
    clearDraft();

    navigate("/dashboard?welcome=1", { replace: true });
  };

  return (
    <OnboardingShell step={7} total={7} back="/claim/visibility">
      <OnboardingTitle
        eyebrow="Almost there"
        title="One last thing."
        description="We'll email you when a request arrives — and only then. No marketing, no digests, nothing else."
      />

      <Reveal delay={0.32} duration={0.85} axis="x">
        <div className="mx-auto mt-14 w-full max-w-[640px]">
          <Label>
            Live preview{" "}
            <span className="font-normal normal-case tracking-normal text-[hsl(var(--ink-subtle))]">
              (This is what people will see.)
            </span>
          </Label>
          <div className="mt-3 rounded-3xl border border-[hsl(var(--rule))] bg-[hsl(var(--page))] p-5 breathing">
            <ProfilePreviewCard profile={previewProfile} variant="preview" />
          </div>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button
              size="lg"
              trailingArrow
              loading={submitting}
              onClick={launch}
            >
              Go live
            </Button>
          </div>
        </div>
      </Reveal>
    </OnboardingShell>
  );
}
