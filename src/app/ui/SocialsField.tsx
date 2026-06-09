import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { EASE } from "@/components/motion";
import { Button } from "./Button";
import { Label } from "./Field";
import { SOCIAL_PLATFORMS, SocialIcon } from "./SocialIcons";
import { extractSocialHandle, setSocial } from "../store/socials";
import type { SocialPlatform, Socials } from "../types";

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
 * SocialsField — the shared "connected rows + picker" editor
 * used by both onboarding (Step 6) and the My Page editor.
 *
 * Only platforms the owner has already added are rendered, and
 * new platforms are added by clicking an icon in a compact
 * picker that appears beneath the list. The cap is 5.
 */
export function SocialsField({
  value,
  onChange,
}: {
  value: Socials;
  onChange: (v: Socials) => void;
}) {
  const [connected, setConnected] = useState<SocialPlatform[]>(() =>
    buildConnectedList(value),
  );

  const [handles, setHandles] = useState<Drafts>(() => {
    const initial: Drafts = {};
    for (const id of EDITOR_PLATFORMS) {
      initial[id] = extractSocialHandle(id, value[id]);
    }
    return initial;
  });

  const [pickerOpen, setPickerOpen] = useState(false);

  const inputRefs = useRef<
    Partial<Record<SocialPlatform, HTMLInputElement | null>>
  >({});
  const justAddedRef = useRef<SocialPlatform | null>(null);
  const suppressSyncRef = useRef(false);

  // Resync from the upstream value when it changes from outside.
  useEffect(() => {
    if (suppressSyncRef.current) {
      suppressSyncRef.current = false;
      return;
    }
    const v = value ?? {};
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
  }, [JSON.stringify(value)]);

  // Auto-focus the input of a newly added row.
  useEffect(() => {
    if (!justAddedRef.current) return;
    const id = justAddedRef.current;
    justAddedRef.current = null;
    const t = setTimeout(() => inputRefs.current[id]?.focus(), 80);
    return () => clearTimeout(t);
  });

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
    onChange(setSocial(value, id, ""));
  };

  const updateHandle = (id: SocialPlatform, raw: string) => {
    setHandles((h) => ({ ...h, [id]: raw }));
    suppressSyncRef.current = true;
    onChange(setSocial(value, id, raw));
  };

  const onBlurHandle = (id: SocialPlatform) => {
    if (!(handles[id] ?? "").trim() && !value[id]) {
      removePlatform(id);
    }
  };

  return (
    <div>
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
    </div>
  );
}
