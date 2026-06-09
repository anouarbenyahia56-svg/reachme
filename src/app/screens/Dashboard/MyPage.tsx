import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Plus, Trash2, X } from "lucide-react";
import { EASE } from "@/components/motion";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { TextField, Label } from "../../ui/Field";
import { Avatar } from "../../ui/Avatar";
import { setProfile, useProfile } from "../../store/session";
import {
  formatMoney,
  parseMoneyToCents,
} from "../../store/format";
import {
  SUGGESTED_EXTRAS,
  makeCategoryId,
} from "../../store/categories";
import {
  SOCIAL_PLATFORMS,
  SocialIcon,
} from "../../ui/SocialIcons";
import { setSocial, extractSocialHandle } from "../../store/socials";
import type {
  Category,
  Profile,
  SocialPlatform,
  Socials,
  Visibility,
} from "../../types";
import { useToast } from "../../ui/Toast";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * My page — the live editor.
 *
 * Centered single column of cards (identity, socials, amount,
 * categories, status). Changes don't commit until "Save changes"
 * is pressed; a Discard button appears when there are unsaved
 * changes.
 */
export function MyPage() {
  const profile = useProfile();
  const toast = useToast();
  const [draft, setDraft] = useState<Profile | null>(profile);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (profile && !draft) setDraft(profile);
  }, [profile, draft]);

  if (!profile || !draft) return null;

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => {
    setDraft((d) => (d ? { ...d, [k]: v } : d));
    setHasChanges(true);
  };

  const save = () => {
    setProfile(draft);
    setHasChanges(false);
    toast.show("Page updated.");
  };

  const reset = () => {
    setDraft(profile);
    setHasChanges(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-14">
      <Card>
        <div className="px-10 py-12 md:px-14 md:py-16">
          <div className="space-y-10">
            <AvatarField
              value={draft.avatarUrl}
              displayName={draft.displayName}
              onChange={(v) => set("avatarUrl", v)}
            />

            <div className="grid gap-6 sm:grid-cols-2">
              <TextField
                label="Display name"
                value={draft.displayName}
                onChange={(e) => set("displayName", e.target.value)}
                maxLength={48}
              />
              <TextField
                label="Title"
                value={draft.title}
                onChange={(e) => set("title", e.target.value)}
                maxLength={64}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="px-10 py-12 md:px-14 md:py-16">
          <SocialsField
            value={draft.socials ?? {}}
            onChange={(v) => set("socials", v)}
          />
        </div>
      </Card>

      <Card>
        <div className="px-10 py-12 md:px-14 md:py-16">
          <FloorField
            cents={draft.minAmountCents}
            onChange={(c) => set("minAmountCents", c)}
          />
        </div>
      </Card>

      <Card>
        <div className="px-10 py-12 md:px-14 md:py-16">
          <CategoriesField
            items={draft.categories}
            onChange={(items) => set("categories", items)}
          />
        </div>
      </Card>

      <Card>
        <div className="px-10 py-12 md:px-14 md:py-16">
          <VisibilityField
            value={draft.visibility}
            onChange={(v) => set("visibility", v)}
            replyWindowDays={draft.replyWindowDays}
            onChangeReplyWindow={(d) => set("replyWindowDays", d)}
          />
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={!hasChanges} trailingArrow>
          Save changes
        </Button>
        {hasChanges && (
          <Button variant="ghost" onClick={reset}>
            Discard
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Field subcomponents ───────────────────────────────────────────

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function AvatarField({
  value,
  displayName,
  onChange,
}: {
  value?: string;
  displayName: string;
  onChange: (v?: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  return (
    <div className="flex items-center gap-7">
      <Avatar size="xl" src={value} name={displayName} />
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
              onClick={() => {
                onChange(undefined);
                if (input.current) input.current.value = "";
              }}
              type="button"
            >
              Remove
            </Button>
          )}
        </div>
        <p className="text-[12px] text-[hsl(var(--ink-subtle))]">
          A square crop, ideally 800 × 800. Max 5MB.
        </p>
      </div>
      <input
        key={value ? "has-image" : "no-image"}
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.size > MAX_AVATAR_BYTES) {
            toast.show("Image too large. Max 5MB.");
            e.target.value = "";
            return;
          }
          const url = await readFileAsDataURL(f);
          onChange(url);
          e.target.value = "";
        }}
      />
    </div>
  );
}

const PRESETS = [
  { cents: 5000, label: "$50", helper: "Light filter" },
  { cents: 15000, label: "$150", helper: "Recommended" },
  { cents: 50000, label: "$500", helper: "High signal" },
  { cents: 150000, label: "$1,500", helper: "Very high signal" },
] as const;

// ─── Social links ───────────────────────────────────────────────────
//
// The editor follows a "connected rows + picker" pattern:
// only platforms the owner has already added are rendered, and
// new platforms are added by clicking an icon in a compact
// picker that appears beneath the list. The picker only offers
// the seven platforms the product supports (in a fixed order);
// legacy profiles that carry other platform ids still display
// in the editor — they just can't be re-added from the picker.
//
// The limit is 5. The picker hides (and the Add button hides
// with it) when 5 are connected, and reappears the moment any
// row is removed. No helper line, no "remove one to add another"
// — the absence of the button is the signal.
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

function platformLabel(id: SocialPlatform): string {
  return SOCIAL_PLATFORMS.find((p) => p.id === id)?.label ?? id;
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

function SocialsField({
  value,
  onChange,
}: {
  value: Socials;
  onChange: (v: Socials) => void;
}) {
  // The list of platforms currently shown in the editor. Order
  // is the order the owner added them, so the list reads as
  // their flow rather than a forced sequence. Platforms the
  // editor no longer offers (legacy) fall to the end.
  const [connected, setConnected] = useState<SocialPlatform[]>(() =>
    buildConnectedList(value),
  );

  // Per-platform handle draft. The canonical https URL is built
  // from the handle on every change and pushed up; an empty
  // draft means "added but not yet typed", which the row shows
  // in place until the field is blurred empty.
  const [handles, setHandles] = useState<
    Partial<Record<SocialPlatform, string>>
  >(() => {
    const initial: Partial<Record<SocialPlatform, string>> = {};
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
  // When the field itself caused the upstream value change
  // (typing, removing) we set this so the resync effect skips
  // the rebuild. Without it, clearing a handle would delete
  // the row — clearing should only empty the input, not the
  // platform. Only an outside change (Discard, profile swap)
  // should resync.
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
      const next: Partial<Record<SocialPlatform, string>> = {};
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
    // The owner clicked "Add", never typed, then moved on. Drop
    // the row so the list stays clean — they can re-add it from
    // the picker. We only do this when the field is truly empty
    // and the platform has no URL upstream; an explicit remove
    // (the X button) is the way to drop a platform that has a
    // saved handle.
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
                    placeholder="username"
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

function FloorField({
  cents,
  onChange,
}: {
  cents: number;
  onChange: (c: number) => void;
}) {
  const [custom, setCustom] = useState(String(cents / 100));
  useEffect(() => setCustom(String(cents / 100)), [cents]);

  const customCents = parseMoneyToCents(custom);
  const belowFloor =
    custom.trim() !== "" && customCents > 0 && customCents < 1000;

  return (
    <div>
      <Label>Amount</Label>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {PRESETS.map((p) => {
          const active = cents === p.cents;
          return (
            <button
              key={p.cents}
              type="button"
              onClick={() => onChange(p.cents)}
              aria-pressed={active}
              className={[
                "flex flex-col items-start rounded-2xl border px-5 py-5 text-left transition-[border-color,background-color,color] duration-300",
                active
                  ? "border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-[hsl(var(--page))]"
                  : "border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--ink))] hover:border-[hsl(var(--ink))]",
              ].join(" ")}
            >
              <span className="font-serif text-[1.25rem] font-medium tracking-[-0.025em]">
                {p.label}
              </span>
              <span
                className={[
                  "mt-1 text-[11.5px]",
                  active
                    ? "text-[hsl(var(--page))]/75"
                    : "text-[hsl(var(--ink-subtle))]",
                ].join(" ")}
              >
                {p.helper}
              </span>
            </button>
          );
        })}
      </div>
      <div
        className={[
          "mt-4 flex items-center rounded-2xl border bg-[hsl(var(--surface))] transition-[border-color] duration-300",
          belowFloor
            ? "border-[hsl(var(--danger))] focus-within:border-[hsl(var(--danger))]"
            : "border-[hsl(var(--rule-strong))] focus-within:border-[hsl(var(--ink))]",
        ].join(" ")}
      >
        <span className="pl-4 text-[15px] text-[hsl(var(--ink-muted))]">$</span>
        <input
          inputMode="decimal"
          value={custom}
          onChange={(e) => {
            setCustom(e.target.value);
            const c = parseMoneyToCents(e.target.value);
            if (c >= 1000) onChange(c);
          }}
          aria-invalid={belowFloor}
          aria-describedby="myfloor-custom-help"
          className="w-full bg-transparent px-3 py-3.5 text-[15px] text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-subtle))] focus:outline-none"
        />
      </div>
      <p
        id="myfloor-custom-help"
        className={[
          "mt-2.5 text-[12.5px] leading-[1.55]",
          belowFloor
            ? "text-[hsl(var(--danger))]"
            : "text-[hsl(var(--ink-subtle))]",
        ].join(" ")}
      >
        {belowFloor
          ? "Floor must be at least $10."
          : "You can change this any time. Anyone reaching out can attach more — they cannot attach less."}
      </p>
    </div>
  );
}

function CategoriesField({
  items,
  onChange,
}: {
  items: Category[];
  onChange: (items: Category[]) => void;
}) {
  const [custom, setCustom] = useState("");
  const has = (id: string) => items.some((c) => c.id === id);
  const add = (c: Category) => {
    if (has(c.id) || items.length >= 6) return;
    onChange([...items, c]);
  };
  const remove = (id: string) => onChange(items.filter((c) => c.id !== id));
  const addCustom = () => {
    const label = custom.trim();
    if (!label) return;
    const id = makeCategoryId(label);
    if (has(id)) return setCustom("");
    add({ id, label });
    setCustom("");
  };
  const remaining = SUGGESTED_EXTRAS.filter((s) => !has(s.id));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <Label>What you're open to</Label>
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--ink-subtle))]">
          {items.length} of 6
        </span>
      </div>
      <div className="space-y-6">
        <ul className="flex flex-wrap gap-2">
          <AnimatePresence initial={false} mode="popLayout">
            {items.map((c) => (
              <motion.li
                key={c.id}
                layout
                initial={{ opacity: 0, y: 6, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -4, filter: "blur(6px)" }}
                transition={{
                  duration: 0.2,
                  ease: EASE,
                  layout: { duration: 0.3, ease: EASE },
                }}
              >
                <span className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--ink))] py-1.5 pl-4 pr-1.5 text-[12.5px] font-medium text-[hsl(var(--page))]">
                  {c.label}
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    aria-label={`Remove ${c.label}`}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full transition-colors duration-300 hover:bg-[hsl(var(--page))]/15"
                  >
                    <X size={11} strokeWidth={2} />
                  </button>
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {remaining.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {remaining.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => add(s)}
                  disabled={items.length >= 6}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--rule-strong))] bg-transparent px-3.5 py-1.5 text-[12.5px] text-[hsl(var(--ink))] transition-[border-color,background-color] duration-300 hover:border-[hsl(var(--ink))] disabled:opacity-40"
                >
                  <Plus size={11} strokeWidth={1.8} aria-hidden="true" />
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-stretch gap-2">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Add a custom category"
            maxLength={32}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            className="w-full rounded-full border border-[hsl(var(--rule-strong))] bg-[hsl(var(--page))] px-4 py-3 text-[15px] text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-subtle))] focus:border-[hsl(var(--ink))] focus:outline-none"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCustom}
            disabled={!custom.trim() || items.length >= 6}
            leadingIcon={<Plus size={13} strokeWidth={1.8} />}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

const VIS: ReadonlyArray<{ value: Visibility; label: string; helper: string }> = [
  {
    value: "public",
    label: "Live",
    helper: "Live and accepting requests.",
  },
  {
    value: "paused",
    label: "Paused",
    helper: "Visible, but not accepting new requests.",
  },
];

const PRESET_DAYS = [1, 2, 3] as const;
const MAX_REPLY_WINDOW = 7;

function VisibilityField({
  value,
  onChange,
  replyWindowDays,
  onChangeReplyWindow,
}: {
  value: Visibility;
  onChange: (v: Visibility) => void;
  replyWindowDays: number;
  onChangeReplyWindow: (d: number) => void;
}) {
  const isCustomDay = !PRESET_DAYS.includes(replyWindowDays as 1 | 2 | 3);
  const [customActive, setCustomActive] = useState(isCustomDay);
  const [customStr, setCustomStr] = useState(
    isCustomDay ? String(replyWindowDays) : "",
  );
  const customInputRef = useRef<HTMLInputElement>(null);

  const onPreset = (days: number) => {
    onChangeReplyWindow(days);
    setCustomActive(false);
    setCustomStr("");
  };

  const onCustomToggle = () => {
    if (!customActive) {
      const defaultVal = "4";
      setCustomActive(true);
      setCustomStr(defaultVal);
      onChangeReplyWindow(4);
      requestAnimationFrame(() => customInputRef.current?.focus());
    }
  };

  return (
    <div>
      <Label>Status</Label>
      <div className="grid gap-3 sm:grid-cols-2">
        {VIS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={active}
              className={[
                "flex flex-col items-start rounded-2xl border px-4 py-4 text-left transition-[border-color,background-color,color] duration-300",
                active
                  ? "border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-[hsl(var(--page))]"
                  : "border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--ink))] hover:border-[hsl(var(--ink))]",
              ].join(" ")}
            >
              <span className="text-[14px] font-medium">{opt.label}</span>
              <span
                className={[
                  "mt-1.5 text-[12px] leading-[1.55]",
                  active
                    ? "text-[hsl(var(--page))]/75"
                    : "text-[hsl(var(--ink-muted))]",
                ].join(" ")}
              >
                {opt.helper}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-10">
        <Label>Reply window</Label>
        <div className="grid grid-cols-4 gap-3">
          {PRESET_DAYS.map((d) => {
            const active = replyWindowDays === d && !customActive;
            return (
              <button
                key={d}
                type="button"
                onClick={() => onPreset(d)}
                aria-pressed={active}
                className={[
                  "rounded-2xl border px-4 py-3.5 text-center transition-[border-color,background-color,color] duration-300",
                  active
                    ? "border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-[hsl(var(--page))]"
                    : "border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--ink))] hover:border-[hsl(var(--ink))]",
                ].join(" ")}
              >
                <span
                  className="font-serif"
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 500,
                    letterSpacing: "-0.025em",
                  }}
                >
                  {d === 1 ? "1 day" : `${d} days`}
                </span>
              </button>
            );
          })}
          <div
            role="button"
            tabIndex={0}
            onClick={customActive ? undefined : onCustomToggle}
            aria-pressed={customActive}
            className={[
              "relative rounded-2xl border px-4 py-3.5 text-center transition-[border-color,background-color,color] duration-300",
              customActive
                ? "border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-[hsl(var(--page))]"
                : "border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--ink))] hover:border-[hsl(var(--ink))] cursor-pointer",
            ].join(" ")}
          >
            {customActive ? (
              <span className="inline-flex items-center justify-center gap-1">
                <input
                  ref={customInputRef}
                  inputMode="numeric"
                  type="text"
                  value={customStr}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    if (!digits) return;
                    const last = parseInt(digits[digits.length - 1], 10);
                    const clamped = Math.min(
                      Math.max(last, 4),
                      MAX_REPLY_WINDOW,
                    );
                    setCustomStr(String(clamped));
                    onChangeReplyWindow(clamped);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setCustomActive(false);
                      setCustomStr("");
                      onChangeReplyWindow(3);
                    }
                  }}
                  placeholder="days"
                  className={[
                    "w-8 bg-transparent text-center font-serif focus:outline-none",
                    "placeholder:text-[hsl(var(--page))]/50",
                  ].join(" ")}
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 500,
                    letterSpacing: "-0.025em",
                  }}
                />
                {customStr && (
                  <span
                    className="font-serif"
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 500,
                      letterSpacing: "-0.025em",
                    }}
                  >
                    days
                  </span>
                )}
              </span>
            ) : (
              <span
                className="font-serif"
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 500,
                  letterSpacing: "-0.025em",
                }}
              >
                Custom
              </span>
            )}
          </div>
        </div>
        {customActive && (
          <p className="mt-2.5 text-[12px] leading-[1.55] text-[hsl(var(--ink-subtle))]">
            A tighter window signals attentiveness. Max {MAX_REPLY_WINDOW} days.
          </p>
        )}
      </div>
    </div>
  );
}
