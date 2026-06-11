import { useEffect, useState } from "react";
import { Button } from "../../ui/Button";
import { Reveal } from "../../ui/Reveal";
import { useRouter } from "../../router";
import { OnboardingShell, OnboardingTitle } from "./OnboardingShell";
import { patchDraft, useDraft } from "../../store/draft";
import { buildSocialUrl } from "../../store/socials";
import { SocialsField } from "../../ui/SocialsField";
import type { Socials } from "../../types";

/**
 * Step 6 — Social links.
 *
 * Wraps the shared SocialsField with onboarding-specific logic:
 * drafts are synced to the onboarding store, and at least one
 * valid social URL is required to continue.
 */
export function StepSocials() {
  const { navigate } = useRouter();
  const draft = useDraft();
  const [socials, setSocials] = useState<Socials>(draft.socials ?? {});

  useEffect(() => {
    patchDraft({ socials });
  }, [socials]);

  const hasValidSocial = Object.entries(socials).some(([platform, url]) => {
    if (!url) return false;
    try {
      const u = new URL(url);
      if (!u.hostname.includes(".")) return false;
      const path = u.pathname.replace(/^\/+/, "").replace(/^@+/, "");
      return path.length > 0;
    } catch {
      return false;
    }
  });

  return (
    <OnboardingShell step={6} total={8} back="/claim/categories">
      <OnboardingTitle
        title="Link your socials."
        description="Add the profiles your audience already follows. Up to five — they sit as a quiet row on your public page."
      />

      <Reveal delay={0.32} duration={0.85} axis="x" blur={5}>
        <div className="mt-14 max-w-[780px]">
          <SocialsField value={socials} onChange={setSocials} />

          {Object.keys(socials).length === 0 && (
            <p className="mt-4 text-[12.5px] leading-[1.55] text-[hsl(var(--ink-subtle))]">
              Add at least one social link.
            </p>
          )}

          <p className="mt-7 text-[12.5px] leading-[1.55] text-[hsl(var(--ink-subtle))]">
            You can add or change these any time from your page settings.
          </p>

          <div className="mt-10 flex items-center gap-4">
            <Button
              size="lg"
              trailingArrow
              disabled={!hasValidSocial}
              onClick={() => navigate("/claim/visibility")}
            >
              Continue
            </Button>
          </div>
        </div>
      </Reveal>
    </OnboardingShell>
  );
}
