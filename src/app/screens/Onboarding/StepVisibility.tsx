import { useEffect, useState } from "react";
import { Button } from "../../ui/Button";
import { Reveal } from "../../ui/Reveal";
import { useRouter } from "../../router";
import { OnboardingShell, OnboardingTitle } from "./OnboardingShell";
import { patchDraft, useDraft } from "../../store/draft";
import { VisibilityField } from "../../ui/VisibilityField";
import type { Visibility } from "../../types";

/**
 * Step 7 — Visibility and reply window.
 *
 * Wraps the shared VisibilityField with onboarding-specific logic:
 * values are synced to the draft on every change.
 */
export function StepVisibility() {
  const { navigate } = useRouter();
  const draft = useDraft();
  const [visibility, setVisibility] = useState<Visibility>(
    draft.visibility ?? "public",
  );
  const [replyDays, setReplyDays] = useState<number>(
    draft.replyWindowDays ?? 2,
  );

  useEffect(() => {
    patchDraft({ visibility });
  }, [visibility]);

  useEffect(() => {
    patchDraft({ replyWindowDays: replyDays });
  }, [replyDays]);

  return (
    <OnboardingShell step={7} total={8} back="/claim/socials">
      <OnboardingTitle
        title="Control who can reach you."
        description="Change this whenever you like. Being open doesn't mean accepting everyone — your rules still decide what reaches you."
      />

      <Reveal delay={0.32} duration={0.85} axis="x" blur={5}>
        <div className="mt-14 max-w-[780px]">
          <VisibilityField
            visibility={visibility}
            onChangeVisibility={setVisibility}
            replyWindowDays={replyDays}
            onChangeReplyWindow={setReplyDays}
          />

          <div className="mt-10 flex items-center gap-4">
            <Button
              size="lg"
              trailingArrow
              onClick={() => navigate("/claim/finish")}
            >
              Continue
            </Button>
          </div>
        </div>
      </Reveal>
    </OnboardingShell>
  );
}
