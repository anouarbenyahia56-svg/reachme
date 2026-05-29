import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Image as ImageIcon, Plus, Trash2, X } from "lucide-react";
import { EASE } from "@/components/motion";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { TextField, TextArea, Label } from "../../ui/Field";
import { Avatar } from "../../ui/Avatar";
import { Reveal } from "../../ui/Reveal";
import { setProfile, useProfile } from "../../store/session";
import { ProfilePreviewCard } from "../Public/ProfilePreviewCard";
import {
  formatMoney,
  parseMoneyToCents,
} from "../../store/format";
import {
  SUGGESTED_EXTRAS,
  makeCategoryId,
} from "../../store/categories";
import type { Category, Profile, Visibility } from "../../types";
import { useToast } from "../../ui/Toast";

/**
 * My page — the live editor.
 *
 * Two columns: edit on the left, the public preview on the right
 * (sticks below the page header on desktop). Changes don't commit
 * until "Save changes" is pressed; an unsaved-changes pill makes
 * the state explicit.
 */
export function MyPage() {
  const profile = useProfile();
  const toast = useToast();
  const [draft, setDraft] = useState<Profile | null>(profile);
  const [savedTick, setSavedTick] = useState(0);

  useEffect(() => {
    if (profile && !draft) setDraft(profile);
  }, [profile, draft]);

  if (!profile || !draft) return null;

  const dirty = JSON.stringify(profile) !== JSON.stringify(draft);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  const save = () => {
    setProfile(draft);
    setSavedTick((t) => t + 1);
    toast.show("Page updated.");
  };

  const reset = () => setDraft(profile);

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-7">
        <Card>
          <div className="flex items-center justify-between gap-4 border-b border-[hsl(var(--rule))] px-7 py-5 md:px-9">
            <div>
              <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
                Public page
              </p>
              <p className="mt-1 text-[14px] font-medium text-[hsl(var(--ink))]">
                Edit how you appear to senders.
              </p>
            </div>
            <AnimatePresence>
              {dirty ? (
                <motion.span
                  key="dirty"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--ink))] px-3 py-1 text-[11.5px] font-medium text-[hsl(var(--ink))]"
                >
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[hsl(var(--ink))]" />
                  Unsaved changes
                </motion.span>
              ) : (
                <motion.span
                  key={`saved-${savedTick}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[11.5px] uppercase tracking-[0.18em] text-[hsl(var(--ink-subtle))]"
                >
                  All saved
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-7 px-7 py-7 md:px-9 md:py-8">
            <BannerField
              value={draft.bannerUrl}
              onChange={(v) => set("bannerUrl", v)}
            />
            <AvatarField
              value={draft.avatarUrl}
              displayName={draft.displayName}
              onChange={(v) => set("avatarUrl", v)}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Display name"
                value={draft.displayName}
                onChange={(e) => set("displayName", e.target.value)}
                maxLength={48}
              />
              <TextField
                label="Role"
                value={draft.title}
                onChange={(e) => set("title", e.target.value)}
                maxLength={64}
              />
            </div>

            <TextArea
              label="Short bio"
              value={draft.bio}
              onChange={(e) => set("bio", e.target.value)}
              maxChars={240}
              optional
            />
          </div>
        </Card>

        <Card>
          <div className="border-b border-[hsl(var(--rule))] px-7 py-5 md:px-9">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
              Rules
            </p>
            <p className="mt-1 text-[14px] font-medium text-[hsl(var(--ink))]">
              Set what reaches you.
            </p>
          </div>
          <div className="space-y-7 px-7 py-7 md:px-9 md:py-8">
            <FloorField
              cents={draft.minAmountCents}
              onChange={(c) => set("minAmountCents", c)}
            />
            <CategoriesField
              items={draft.categories}
              onChange={(items) => set("categories", items)}
            />
            <VisibilityField
              value={draft.visibility}
              onChange={(v) => set("visibility", v)}
              replyWindowDays={draft.replyWindowDays}
              onChangeReplyWindow={(d) => set("replyWindowDays", d)}
            />
          </div>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={save} disabled={!dirty} trailingArrow>
            Save changes
          </Button>
          {dirty && (
            <Button variant="ghost" onClick={reset}>
              Discard
            </Button>
          )}
        </div>
      </div>

      <div className="lg:col-span-5">
        <Reveal>
          <div className="lg:sticky lg:top-[88px]">
            <Label>Live preview</Label>
            <div className="rounded-3xl border border-[hsl(var(--rule))] bg-[hsl(var(--page))] p-5">
              <ProfilePreviewCard profile={draft} variant="preview" />
            </div>
            <p className="mt-3 text-[12.5px] text-[hsl(var(--ink-subtle))]">
              Changes appear immediately here. They go live the moment you save.
            </p>
          </div>
        </Reveal>
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

function BannerField({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v?: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div>
      <Label optional>Banner image</Label>
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
            <span className="text-[12.5px]">Replace banner</span>
          </span>
        )}
      </button>
      {value && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
        >
          <Trash2 size={12} strokeWidth={1.6} aria-hidden="true" /> Remove banner
        </button>
      )}
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
  return (
    <div className="flex items-center gap-5">
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
              onClick={() => onChange(undefined)}
              type="button"
            >
              Remove
            </Button>
          )}
        </div>
        <p className="text-[12px] text-[hsl(var(--ink-subtle))]">
          A square crop, ideally 800 × 800.
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

const PRESETS = [5000, 15000, 50000, 150000] as const;

function FloorField({
  cents,
  onChange,
}: {
  cents: number;
  onChange: (c: number) => void;
}) {
  const [custom, setCustom] = useState(String(cents / 100));
  useEffect(() => setCustom(String(cents / 100)), [cents]);
  return (
    <div>
      <Label>Minimum signal</Label>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {PRESETS.map((p) => {
          const active = cents === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-pressed={active}
              className={[
                "rounded-2xl border px-3 py-3 text-left transition-[border-color,background-color,color] duration-300",
                active
                  ? "border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-[hsl(var(--page))]"
                  : "border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--ink))] hover:border-[hsl(var(--ink))]",
              ].join(" ")}
            >
              <span className="font-serif text-[1.15rem] font-medium">
                {formatMoney(p)}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center overflow-hidden rounded-2xl border border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] focus-within:border-[hsl(var(--ink))]">
        <span className="select-none border-r border-[hsl(var(--rule))] bg-[hsl(var(--page))] px-4 py-3 text-[14px] text-[hsl(var(--ink-muted))]">
          USD
        </span>
        <span className="pl-3 text-[14px] text-[hsl(var(--ink-muted))]">$</span>
        <input
          inputMode="decimal"
          value={custom}
          onChange={(e) => {
            setCustom(e.target.value);
            const c = parseMoneyToCents(e.target.value);
            if (c >= 1000) onChange(c);
          }}
          className="w-full bg-transparent px-3 py-3 text-[14px] text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-subtle))] focus:outline-none"
        />
      </div>
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
      <Label>Request categories</Label>
      <div className="rounded-2xl border border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] p-4">
        <ul className="flex flex-wrap gap-2">
          <AnimatePresence initial={false}>
            {items.map((c) => (
              <motion.li
                key={c.id}
                initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: EASE }}
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
          <div className="mt-4 border-t border-[hsl(var(--rule))] pt-4">
            <p className="mb-3 text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
              Suggested
            </p>
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
          </div>
        )}
        <div className="mt-4 border-t border-[hsl(var(--rule))] pt-4">
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
              className="w-full rounded-full border border-[hsl(var(--rule-strong))] bg-[hsl(var(--page))] px-4 py-2.5 text-[13.5px] text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-subtle))] focus:border-[hsl(var(--ink))] focus:outline-none"
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
      <p className="mt-2.5 text-[12.5px] text-[hsl(var(--ink-subtle))]">
        1–6 categories. The same minimum applies to all of them.
      </p>
    </div>
  );
}

const VIS: ReadonlyArray<{ value: Visibility; label: string; helper: string }> = [
  {
    value: "public",
    label: "Active",
    helper: "Live, public, searchable, accepting requests.",
  },
  {
    value: "paused",
    label: "Paused",
    helper: "Visible, but not accepting new requests.",
  },
];

const REPLY_WINDOWS: ReadonlyArray<{ days: number; label: string }> = [
  { days: 3, label: "3 days" },
  { days: 7, label: "7 days" },
  { days: 14, label: "14 days" },
];

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
  return (
    <div>
      <Label>State</Label>
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

      <div className="mt-7">
        <Label>Reply window</Label>
        <div className="grid grid-cols-3 gap-3">
          {REPLY_WINDOWS.map((w) => {
            const active = replyWindowDays === w.days;
            return (
              <button
                key={w.days}
                type="button"
                onClick={() => onChangeReplyWindow(w.days)}
                aria-pressed={active}
                className={[
                  "rounded-2xl border px-3 py-3 text-center transition-[border-color,background-color,color] duration-300",
                  active
                    ? "border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-[hsl(var(--page))]"
                    : "border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--ink))] hover:border-[hsl(var(--ink))]",
                ].join(" ")}
              >
                <span
                  className="font-serif"
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 500,
                    letterSpacing: "-0.025em",
                  }}
                >
                  {w.label}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2.5 text-[12.5px] leading-[1.55] text-[hsl(var(--ink-subtle))]">
          If you don't reply within your window, the request expires and the
          amount is refunded automatically.
        </p>
      </div>
    </div>
  );
}
