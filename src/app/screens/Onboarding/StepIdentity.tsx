import { useEffect, useRef, useState } from "react";
import { Camera, Image as ImageIcon, Trash2 } from "lucide-react";
import { Button } from "../../ui/Button";
import { TextField, TextArea } from "../../ui/Field";
import { Avatar } from "../../ui/Avatar";
import { Reveal } from "../../ui/Reveal";
import { useRouter } from "../../router";
import { OnboardingShell, OnboardingTitle } from "./OnboardingShell";
import { patchDraft, useDraft } from "../../store/draft";

/**
 * Step 2 — Identity.
 *
 * Display name, role, short bio. Optional banner and avatar.
 * Uploads are read as data URLs so the experience is end-to-end
 * functional locally; the same shape works against a CDN later.
 *
 * The title/bio fields write through to the draft on every change
 * — no save button, no anxious commit. Continue is enabled the
 * moment the required fields are present.
 */
export function StepIdentity() {
  const { navigate } = useRouter();
  const draft = useDraft();
  const [displayName, setDisplayName] = useState(draft.displayName ?? "");
  const [title, setTitle] = useState(draft.title ?? "");
  const [bio, setBio] = useState(draft.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(draft.avatarUrl);
  const [bannerUrl, setBannerUrl] = useState<string | undefined>(draft.bannerUrl);

  // Persist on every change so a refresh doesn't lose work.
  useEffect(() => {
    patchDraft({ displayName, title, bio, avatarUrl, bannerUrl });
  }, [displayName, title, bio, avatarUrl, bannerUrl]);

  const canContinue =
    displayName.trim().length > 0 && title.trim().length > 0;

  return (
    <OnboardingShell step={2} total={6} back="/claim">
      <OnboardingTitle
        eyebrow="Identity"
        title="Show people who you are."
        description="This is what people see before they decide to reach out. Make it count — quietly."
      />

      <Reveal delay={0.32} duration={0.85} axis="x">
        <div className="mt-14 max-w-[760px] space-y-8">
          <BannerUploader value={bannerUrl} onChange={setBannerUrl} />

          <AvatarUploader
            value={avatarUrl}
            displayName={displayName || "Y"}
            onChange={setAvatarUrl}
          />

          <div className="grid gap-7 md:grid-cols-2">
            <TextField
              label="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Jordan Smith"
              autoFocus
              maxLength={48}
              helper="Shown at the top of your page."
            />
            <TextField
              label="Role"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Founder, Investor, Author…"
              maxLength={64}
              helper="A single line. Specific is good."
            />
          </div>

          <TextArea
            label="Short bio"
            optional
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="I review business, partnership, and acquisition opportunities."
            maxChars={240}
            helper="Two sentences at most. Set the tone for what reaches you."
          />

          <div className="flex items-center gap-4">
            <Button
              size="lg"
              trailingArrow
              disabled={!canContinue}
              onClick={() => navigate("/claim/floor")}
            >
              Continue
            </Button>
            <p className="text-[12.5px] text-[hsl(var(--ink-subtle))]">
              Display name and role are required. Everything else can wait.
            </p>
          </div>
        </div>
      </Reveal>
    </OnboardingShell>
  );
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function AvatarUploader({
  value,
  displayName,
  onChange,
}: {
  value?: string;
  displayName: string;
  onChange: (v?: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-5">
      {value ? (
        <Avatar size="xl" src={value} name={displayName} />
      ) : (
        <span
          aria-hidden="true"
          className="h-24 w-24 shrink-0 rounded-full bg-[hsl(var(--rule))]"
        />
      )}
      <div className="flex flex-col items-start gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leadingIcon={<Camera size={14} strokeWidth={1.6} />}
            onClick={() => input.current?.click()}
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
        <p className="text-[12px] text-[hsl(var(--ink-subtle))]">
          A square crop, ideally 800 × 800. Up to 1 MB.
        </p>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const url = await readFileAsDataURL(f);
          onChange(url);
        }}
      />
    </div>
  );
}

function BannerUploader({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v?: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--ink-subtle))]">
        Banner <span className="ml-2 normal-case tracking-normal">— optional</span>
      </p>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className={[
          "group relative block aspect-[4/1] w-full overflow-hidden rounded-3xl border border-dashed transition-colors duration-300",
          value
            ? "border-transparent"
            : "border-[hsl(var(--rule-strong))] hover:border-[hsl(var(--ink))]",
        ].join(" ")}
        aria-label="Upload banner"
      >
        {value ? (
          <img
            src={value}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[hsl(var(--ink-subtle))] transition-colors duration-300 group-hover:text-[hsl(var(--ink))]">
            <ImageIcon size={18} strokeWidth={1.6} />
            <span className="text-[12.5px]">
              Upload a banner image — subtle is good.
            </span>
          </span>
        )}
      </button>

      {value ? (
        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leadingIcon={<ImageIcon size={14} strokeWidth={1.6} />}
            onClick={() => input.current?.click()}
            type="button"
          >
            Replace banner
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={<Trash2 size={14} strokeWidth={1.6} />}
            onClick={() => onChange(undefined)}
            type="button"
          >
            Remove
          </Button>
        </div>
      ) : null}

      <p className="mt-3 text-[12px] text-[hsl(var(--ink-subtle))]">
        A wide crop, ideally 1600 × 400. Up to 2 MB.
      </p>

      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const url = await readFileAsDataURL(f);
          onChange(url);
        }}
      />
    </div>
  );
}
