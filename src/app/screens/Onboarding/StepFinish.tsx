import { useEffect, useState } from "react";
import { Button } from "../../ui/Button";
import { Reveal } from "../../ui/Reveal";
import { useRouter } from "../../router";
import { OnboardingShell, OnboardingTitle } from "./OnboardingShell";
import { clearDraft, useDraft } from "../../store/draft";
import { setAccount, setProfile } from "../../store/session";
import { seedDemoForOwner } from "../../store/requests";
import type { Profile } from "../../types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Step 7 — Launch.
 *
 * The decisive ending. "Go live" is the absolute final action of
 * onboarding: it commits the account and the profile, seeds demo
 * data, clears the draft, and routes directly into the live
 * dashboard where the welcome overlay offers "View my public page"
 * — that's the moment the user actually sees their card.
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
    avatarUrl: draft.avatarUrl,
    minAmountCents: draft.minAmountCents ?? 15000,
    replyWindowDays: draft.replyWindowDays ?? 5,
    categories: draft.categories ?? [],
    socials: draft.socials,
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

    const profile: Profile = { ...previewProfile, verified: false };
    setAccount({
      email: draft.email!,
      displayName: previewProfile.displayName,
      hasProfile: true,
    });
    setProfile(profile);
    seedDemoForOwner(profile);
    clearDraft();

    navigate("/dashboard?welcome=1", { replace: true });
  };

  return (
    <OnboardingShell step={8} total={8} back="/claim/visibility">
      <OnboardingTitle
        title="Go live."
        description="Your page is set. When you're ready, launch it."
      />

      <Reveal delay={0.32} duration={0.85} axis="x" blur={5}>
        <div className="mt-14 max-w-[640px]">
          <div className="flex items-center gap-4">
            <Button
              size="lg"
              trailingArrow
              loading={submitting}
              onClick={launch}
            >
              Launch my page
            </Button>
          </div>
        </div>
      </Reveal>
    </OnboardingShell>
  );
}
