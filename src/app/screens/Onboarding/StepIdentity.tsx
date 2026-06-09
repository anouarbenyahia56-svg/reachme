import { useEffect, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "../../ui/Button";
import { TextField } from "../../ui/Field";
import { Avatar } from "../../ui/Avatar";
import { Reveal } from "../../ui/Reveal";
import { useRouter } from "../../router";
import { OnboardingShell, OnboardingTitle } from "./OnboardingShell";
import { patchDraft, useDraft } from "../../store/draft";
import { readFileAsDataURL } from "../../store/format";

/**
 * Step 3 — Identity.
 *
 * Display name, title, and an avatar. The fields write through
 * to the draft on every change — no save button, no anxious
 * commit. Continue is enabled the moment the required fields
 * are present.
 */
export function StepIdentity() {
  const { navigate } = useRouter();
  const draft = useDraft();
  const [displayName, setDisplayName] = useState(draft.displayName ?? "");
  const [title, setTitle] = useState(draft.title ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(draft.avatarUrl);

  // Persist on every change so a refresh doesn't lose work.
  useEffect(() => {
    patchDraft({ displayName, title, avatarUrl });
  }, [displayName, title, avatarUrl]);

  const canContinue =
    displayName.trim().length > 0 && title.trim().length > 0;

  return (
    <OnboardingShell step={3} total={8} back="/claim/email">
      <OnboardingTitle
        title="Set the tone."
        description="This is what people see before they decide to reach out. Make it count — quietly."
      />

      <Reveal delay={0.32} duration={0.85} axis="x" blur={5}>
        <div className="mt-14 max-w-[760px]">
          <AvatarUploader
            value={avatarUrl}
            displayName={displayName}
            handle={draft.handle ?? ""}
            onChange={setAvatarUrl}
          />

          <div className="mt-10 grid gap-7 md:grid-cols-2">
            <TextField
              label="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Jordan Smith"
              maxLength={48}
              helper="Shown at the top of your page."
            />
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Music Producer"
              maxLength={64}
              helper="A single line. Specific is good."
            />
          </div>

          <div className="mt-10 flex items-center gap-4">
            <Button
              size="lg"
              trailingArrow
              disabled={!canContinue}
              onClick={() => navigate("/claim/floor")}
            >
              Continue
            </Button>
          </div>
        </div>
      </Reveal>
    </OnboardingShell>
  );
}

function AvatarUploader({
  value,
  displayName,
  handle,
  onChange,
}: {
  value?: string;
  displayName: string;
  handle: string;
  onChange: (v?: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | undefined>(undefined);
  const [buttonKey, setButtonKey] = useState(0);
  // The initial is locked to the handle (claimed in step 1) so it
  // doesn't flicker as the user types in the display name field.
  const initialSource = handle.trim();
  const firstInitial = initialSource.charAt(0).toUpperCase();
  const hasInitial = firstInitial.length > 0;
  return (
    <div className="flex items-center gap-5">
      {value ? (
        <Avatar size="xl" src={value} name={displayName || handle} />
      ) : hasInitial ? (
        <span
          aria-hidden="true"
          className="inline-flex h-24 w-24 shrink-0 select-none items-center justify-center rounded-full bg-[hsl(var(--rule))] font-serif text-[28px] font-medium text-[hsl(var(--ink-muted))]"
          style={{ letterSpacing: "-0.02em" }}
        >
          {firstInitial}
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="h-24 w-24 shrink-0 rounded-full bg-[hsl(var(--rule))]"
        />
      )}
      <div className="flex flex-col items-start gap-2">
        <div className="flex items-center gap-2">
          <Button
            key={buttonKey}
            variant="outline"
            size="sm"
            leadingIcon={<Camera size={14} strokeWidth={1.6} />}
            onClick={() => {
              setUploadError(undefined);
              if (input.current) input.current.value = "";
              input.current?.click();
            }}
            type="button"
          >
            {value ? "Replace photo" : "Upload photo"}
          </Button>
          {value && (
            <Button
              variant="ghost"
              size="sm"
              leadingIcon={<Trash2 size={14} strokeWidth={1.6} />}
              onClick={() => onChange(undefined)}
              type="button"
            >
              Remove
            </Button>
          )}
        </div>
        <p className="text-[12.5px] text-[hsl(var(--ink-subtle))]">
          A square crop, ideally 800 × 800. Max 5MB.
        </p>
        {uploadError && (
          <p
            role="alert"
            className="text-[12.5px] leading-[1.55] text-[hsl(var(--danger))]"
          >
            {uploadError}
          </p>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.size > 1024 * 1024) {
            setUploadError("File is too large. Please upload an image under 1 MB.");
            e.target.value = "";
            return;
          }
          setUploadError(undefined);
          try {
            const url = await readFileAsDataURL(f);
            onChange(url);
            setButtonKey((k) => k + 1);
          } catch {
            setUploadError("Something went wrong reading the file. Please try again.");
            e.target.value = "";
          }
        }}
      />
    </div>
  );
}
