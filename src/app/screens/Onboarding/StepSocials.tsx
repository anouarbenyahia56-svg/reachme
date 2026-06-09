import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { EASE } from "@/components/motion";
import { Button } from "../../ui/Button";
import { Label } from "../../ui/Field";
import { Reveal } from "../../ui/Reveal";
import { useRouter } from "../../router";
import { OnboardingShell, OnboardingTitle } from "./OnboardingShell";
import { patchDraft, useDraft } from "../../store/draft";
import { SOCIAL_PLATFORMS, SocialIcon } from "../../ui/SocialIcons";
import {
  buildSocialUrl,
  extractSocialHandle,
} from "../../store/socials";
import type { SocialPlatform, Socials } from "../../types";

const MAX_SOCIALS = 5;

const EDITOR_PLATFORMS: SocialPlatform[] = [
  "instagram",
  "x",
  "tiktok",
  "youtube",
  "twitch",
  "snapchat",
  "linkedin",
  "spotify",
  "facebook",
  "kick",
  "github",
  "pinterest",
];

type Drafts = Partial<Record<SocialPlatform, string>>;

function platformLabel(id: SocialPlatform): string {
  return SOCIAL_PLATFORMS.find((p) => p.id === id)?.label ?? id;
}

function platformPlaceholder(id: SocialPlatform): string {
  return SOCIAL_PLATFORMS.find((p) => p.id === id)?.placeholder ?? "username";
}

/** Build the `connected` list from a saved Socials map. The
 *  owner's add order is preserved for platforms that are still
 *  supported in the editor; platforms the editor no longer
 *  offers (not in EDITOR_PLATFORMS) fall to the end in their
 *  original relative order. */
function buildConnectedList(socials: Socials | undefined): SocialPlatform[] {
  const v = socials ?? {};
  const inEditor: SocialPlatform[] = [];
  const legacy: SocialPlatform[] = [];
  for (const k of Object.keys(v)) {
    const id = k as SocialPlatform;
    if (!v[id]) continue;
    if (EDITOR_PLATFORMS.includes(id)) {
      inEditor.push(id);
    } else {
      legacy.push(id);
    }
  }
  return [...inEditor, ...legacy];
}

/**
 * Step 6 — Social links.
 *
 * Same "connected rows + picker" pattern as the My page editor:
 * only platforms the owner has added are rendered, and new
 * platforms are added by clicking an icon in a compact picker
 * that appears beneath the list. The picker only offers the
 * supported platforms in a fixed order; legacy platforms that
 * the user has already saved still display — they just can't
 * be re-added from the picker.
 *
 * The cap is 5. The picker hides (and the Add button hides
 * with it) when 5 are connected, and reappears the moment any
 * row is removed. No helper line, no "remove one to add another"
 * — the absence of the button is the signal.
 *
 * The owner is asked for the simplest thing they know: their
 * handle on each platform. The canonical https URL is built
 * per platform and persisted in the draft; the field keeps
 * showing the handle so the editor stays human, not technical.
 */
export function StepSocials() {
  const { navigate } = useRouter();
  const draft = useDraft();

  // Platforms currently shown in the editor, in the order the
  // owner added them. Platforms the editor no longer offers
  // (legacy) fall to the end.
  const [connected, setConnected] = useState<SocialPlatform[]>(() =>
    buildConnectedList(draft.socials),
  );

  // Per-platform handle draft. Canonical URLs are built from
  // the handle on every change and pushed to the draft; an
  // empty draft means "added but not yet typed", which the row
  // shows in place until the field is blurred empty.
  const [handles, setHandles] = useState<Drafts>(() => {
    const initial: Drafts = {};
    for (const id of EDITOR_PLATFORMS) {
      initial[id] = extractSocialHandle(id, draft.socials?.[id]);
    }
    return initial;
  });

  const [pickerOpen, setPickerOpen] = useState(false);

  const inputRefs = useRef<
    Partial<Record<SocialPlatform, HTMLInputElement | null>>
  >({});
  const justAddedRef = useRef<SocialPlatform | null>(null);
  // When the field itself caused the draft change (typing,
  // removing) we set this so the resync effect skips the
  // rebuild. Without it, clearing a handle would delete the
  // row — clearing should only empty the input, not the
  // platform. Only an outside change (a draft swap) should
  // resync.
  const suppressSyncRef = useRef(false);

  // Resync from the draft when it changes from outside.
  useEffect(() => {
    if (suppressSyncRef.current) {
      suppressSyncRef.current = false;
      return;
    }
    const v = draft.socials ?? {};
    setConnected(buildConnectedList(v));
    setHandles(() => {
      const next: Drafts = {};
      for (const k of Object.keys(v)) {
        const id = k as SocialPlatform;
        if (v[id]) next[id] = extractSocialHandle(id, v[id]);
      }
      return next;
    });
    setPickerOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(draft.socials)]);

  // Auto-focus the input of a newly added row.
  useEffect(() => {
    if (!justAddedRef.current) return;
    const id = justAddedRef.current;
    justAddedRef.current = null;
    const t = setTimeout(() => inputRefs.current[id]?.focus(), 80);
    return () => clearTimeout(t);
  });

  // Persist built URLs to the draft store so a refresh
  // restores what the user has typed.
  useEffect(() => {
    const next: Socials = {};
    for (const id of connected) {
      const url = buildSocialUrl(id, handles[id] ?? "");
      if (url) next[id] = url;
    }
    patchDraft({ socials: next });
  }, [connected, handles]);

  const atCap = connected.length >= MAX_SOCIALS;
  const available = EDITOR_PLATFORMS.filter((id) => !connected.includes(id));

  const addPlatform = (id: SocialPlatform) => {
    if (connected.includes(id) || atCap) return;
    setConnected((c) => [...c, id]);
    setHandles((h) => ({ ...h, [id]: h[id] ?? "" }));
    setPickerOpen(false);
    justAddedRef.current = id;
  };

  const removePlatform = (id: SocialPlatform) => {
    setConnected((c) => c.filter((x) => x !== id));
    setHandles((h) => {
      const next = { ...h };
      delete next[id];
      return next;
    });
    suppressSyncRef.current = true;
  };

  const updateHandle = (id: SocialPlatform, raw: string) => {
    setHandles((h) => ({ ...h, [id]: raw }));
    suppressSyncRef.current = true;
  };

  const onBlurHandle = (id: SocialPlatform) => {
    // The owner clicked "Add", never typed, then moved on. Drop
    // the row so the list stays clean — they can re-add it from
    // the picker. We only do this when the field is truly empty;
    // an explicit remove (the X button) is the way to drop a
    // platform that has a saved handle.
    if (!(handles[id] ?? "").trim()) {
      removePlatform(id);
    }
  };

  const isValid = (id: SocialPlatform, raw: string) => {
    const url = buildSocialUrl(id, raw);
    if (!url) return false;
    try {
      const u = new URL(url);
      if (!u.hostname.includes(".")) return false;
      // Reject a base URL with no handle attached.
      const path = u.pathname.replace(/^\/+/, "").replace(/^@+/, "");
      return path.length > 0;
    } catch {
      return false;
    }
  };
  const canContinue = connected.some((id) =>
    isValid(id, handles[id] ?? ""),
  );

  return (
    <OnboardingShell step={6} total={8} back="/claim/categories">
      <OnboardingTitle
        title="Link your socials."
        description="Add the profiles your audience already follows. Up to five — they sit as a quiet row on your public page."
      />

      <Reveal delay={0.32} duration={0.85} axis="x" blur={5}>
        <div className="mt-14 max-w-[780px]">
          <div className="flex items-baseline justify-between gap-4">
            <Label>Social links</Label>
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--ink-subtle))]">
              {connected.length} of {MAX_SOCIALS}
            </span>
          </div>
          <p className="mb-6 text-[12.5px] leading-[1.55] text-[hsl(var(--ink-muted))]">
            Link the profiles your audience already follows.
          </p>

          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {connected.map((id) => {
                const label = platformLabel(id);
                const placeholder = platformPlaceholder(id);
                return (
                  <motion.li
                    key={id}
                    layout="position"
                    initial={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
                    transition={{ duration: 0.3, ease: EASE }}
                  >
                    <div className="grid grid-cols-[auto_88px_1fr_auto] items-center gap-4 rounded-2xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] px-4 py-3.5">
                      <SocialIcon
                        platform={id}
                        className="h-[18px] w-[18px] shrink-0 text-[hsl(var(--ink))]"
                      />
                      <span className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--ink-subtle))]">
                        {label}
                      </span>
                      <input
                        ref={(el) => {
                          inputRefs.current[id] = el;
                        }}
                        type="text"
                        inputMode="text"
                        value={handles[id] ?? ""}
                        onChange={(e) => updateHandle(id, e.target.value)}
                        onBlur={() => onBlurHandle(id)}
                        placeholder={placeholder}
                        aria-label={`${label} handle`}
                        className="min-w-0 bg-transparent text-[14px] text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-subtle))] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removePlatform(id)}
                        aria-label={`Remove ${label}`}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[hsl(var(--ink-subtle))] transition-colors duration-200 hover:bg-[hsl(var(--rule))]/40 hover:text-[hsl(var(--ink))]"
                      >
                        <X size={14} strokeWidth={1.6} aria-hidden="true" />
                      </button>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>

          <AnimatePresence initial={false}>
            {pickerOpen && available.length > 0 && (
              <motion.div
                key="picker"
                initial={{ opacity: 0, y: -6, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -4, filter: "blur(6px)" }}
                transition={{ duration: 0.3, ease: EASE }}
                className="mt-4 flex flex-wrap items-center gap-2"
              >
                {available.map((id) => {
                  const label = platformLabel(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => addPlatform(id)}
                      aria-label={`Add ${label}`}
                      title={label}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--ink-muted))] transition-colors duration-200 hover:border-[hsl(var(--ink))] hover:text-[hsl(var(--ink))]"
                    >
                      <SocialIcon platform={id} className="h-4 w-4" />
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {!atCap && (
            <div className="mt-5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPickerOpen((v) => !v)}
                leadingIcon={<Plus size={14} strokeWidth={1.8} />}
              >
                Add platform
              </Button>
            </div>
          )}

          <p className="mt-7 text-[12.5px] leading-[1.55] text-[hsl(var(--ink-subtle))]">
            You can add or change these any time from your page settings.
          </p>

          <div className="mt-10 flex items-center gap-4">
            <Button
              size="lg"
              trailingArrow
              disabled={!canContinue}
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
