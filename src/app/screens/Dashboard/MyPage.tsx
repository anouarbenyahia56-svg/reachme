import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Plus, Trash2, X } from "lucide-react";
import { EASE } from "@/components/motion";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { TextField, Label } from "../../ui/Field";
import { Avatar } from "../../ui/Avatar";
import { SocialsField } from "../../ui/SocialsField";
import { VisibilityField } from "../../ui/VisibilityField";
import { setProfile, useProfile } from "../../store/session";
import {
  formatMoney,
  parseMoneyToCents,
  readFileAsDataURL,
  FLOOR_PRESETS,
} from "../../store/format";
import {
  SUGGESTED_EXTRAS,
  makeCategoryId,
} from "../../store/categories";
import type {
  Category,
  Profile,
} from "../../types";
import { useToast } from "../../ui/Toast";
import { cn } from "@/lib/utils";
import { CardSkeleton, ScreenError } from "../../ui/ScreenStates";

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

  // TODO: wire to backend — set `loading` to `true` while the
  // profile fetch is in flight; set `error` to the caught error.
  const loading = false;
  const error: string | null = null;

  useEffect(() => {
    if (profile && !draft) setDraft(profile);
  }, [profile, draft]);

  if (!profile || !draft) return null;

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-14">
        <Card>
          <div className="px-8 py-9 md:px-11 md:py-11">
            <CardSkeleton rows={4} />
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <ScreenError
          title="Couldn't load your page settings."
          message={error}
          onRetry={() => window.location.reload()}
        />
      </Card>
    );
  }

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
        <div className="px-8 py-9 md:px-11 md:py-11">
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
        <div className="px-8 py-9 md:px-11 md:py-11">
          <SocialsField
            value={draft.socials ?? {}}
            onChange={(v) => set("socials", v)}
            description="Link the profiles your audience already follows."
          />
        </div>
      </Card>

      <Card>
        <div className="px-8 py-9 md:px-11 md:py-11">
          <FloorField
            cents={draft.minAmountCents}
            onChange={(c) => set("minAmountCents", c)}
          />
        </div>
      </Card>

      <Card>
        <div className="px-8 py-9 md:px-11 md:py-11">
          <CategoriesField
            items={draft.categories}
            onChange={(items) => set("categories", items)}
          />
        </div>
      </Card>

      <Card>
        <div className="px-8 py-9 md:px-11 md:py-11">
          <VisibilityField
            visibility={draft.visibility}
            onChangeVisibility={(v) => set("visibility", v)}
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
          try {
            const url = await readFileAsDataURL(f);
            onChange(url);
          } catch {
            toast.show("Couldn't read the file. Please try again.");
          }
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── Socials ───────────────────────────────────────────────────
// (Shared SocialsField component imported from ui/SocialsField)

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
      <Label>Floor</Label>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {FLOOR_PRESETS.map((p) => {
          const active = cents === p.cents;
          return (
            <button
              key={p.cents}
              type="button"
              onClick={() => onChange(p.cents)}
              aria-pressed={active}
              className={cn(
                "flex flex-col items-start rounded-2xl border px-5 py-5 text-left transition-[border-color,background-color,color] duration-300",
                active
                  ? "border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-[hsl(var(--page))]"
                  : "border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--ink))] hover:border-[hsl(var(--ink))]",
              )}
            >
              <span className="font-serif text-[1.25rem] font-medium tracking-[-0.025em]">
                {p.label}
              </span>
              <span
                className={cn(
                  "mt-1 text-[11.5px]",
                  active
                    ? "text-[hsl(var(--page))]/75"
                    : "text-[hsl(var(--ink-subtle))]",
                )}
              >
                {p.helper}
              </span>
            </button>
          );
        })}
      </div>
      <div
        className={cn(
          "mt-4 flex items-center rounded-2xl border bg-[hsl(var(--surface))] transition-[border-color] duration-300",
          belowFloor
            ? "border-[hsl(var(--danger))] focus-within:border-[hsl(var(--danger))]"
            : "border-[hsl(var(--rule-strong))] focus-within:border-[hsl(var(--ink))]",
        )}
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
        className={cn(
          "mt-2.5 text-[12.5px] leading-[1.55]",
          belowFloor
            ? "text-[hsl(var(--danger))]"
            : "text-[hsl(var(--ink-subtle))]",
        )}
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
          <AnimatePresence initial={false}>
            {items.map((c) => (
              <motion.li
                key={c.id}
                initial={{ opacity: 0, y: 6, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -4, filter: "blur(6px)" }}
                transition={{
                  duration: 0.2,
                  ease: EASE,
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

