"use client";

import Link from "next/link";
import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Eye } from "lucide-react";
import { Button, GhostButton } from "@/components/Button";
import { EASE } from "@/components/layout";
import {
  ALL_CATEGORIES,
  type Category,
  type Profile,
} from "@/lib/domain";

/**
 * Owner view — the public profile, with every text element editable
 * in place. Changes save on blur. The "Publish" pill sits at the
 * top of the page and only solid-fills once the page is live.
 *
 * Architectural notes:
 *  - We keep a local working copy of the profile and call `onChange`
 *    on field commit; the parent owns the canonical state.
 *  - Each in-place field is a contenteditable-style controlled input
 *    rendered as inline text — the type itself is the layout, no boxes.
 */

export interface CategoryOption {
  value: Category;
  label: string;
}

export function OwnerView({
  profile,
  categoryOptions,
  onChange,
}: {
  profile: Profile;
  categoryOptions: CategoryOption[];
  onChange: (next: Profile) => Promise<void> | void;
}) {
  const reduced = useReducedMotion();
  const [draft, setDraft] = useState<Profile>(profile);
  const [savingState, setSavingState] = useState<
    "idle" | "saving" | "saved"
  >("idle");
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep local draft in sync if the parent profile changes (e.g. after
  // the publish round-trip).
  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const commit = useCallback(
    async (next: Profile) => {
      setDraft(next);
      setSavingState("saving");
      await onChange(next);
      setSavingState("saved");
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSavingState("idle"), 1500);
    },
    [onChange],
  );

  const handlePublish = useCallback(async () => {
    await commit({ ...draft, published: !draft.published });
  }, [commit, draft]);

  const toggleCategory = useCallback(
    (cat: Category) => {
      const has = draft.categories.includes(cat);
      const next = has
        ? draft.categories.filter((c) => c !== cat)
        : [...draft.categories, cat];
      // Preserve canonical order.
      const ordered = ALL_CATEGORIES.filter((c) => next.includes(c));
      void commit({ ...draft, categories: ordered });
    },
    [commit, draft],
  );

  return (
    <div className="mx-auto w-full max-w-[1080px] px-6 pb-32 pt-32 md:px-10 md:pt-36">
      {/* Owner control bar — sticky-feeling status row at the top. */}
      <div className="mb-12 flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <p
          className="text-[hsl(var(--ink-muted))]"
          style={{
            fontSize: "0.7rem",
            fontWeight: 500,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
          }}
        >
          {draft.published ? "Live" : "Draft"} · You are editing this page
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <SaveIndicator state={savingState} />
          <Link
            href={`/${draft.handle}?preview=1`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
            style={{ fontSize: "0.92rem" }}
          >
            <Eye size={14} strokeWidth={1.6} aria-hidden="true" />
            <span>Preview</span>
          </Link>
          <Button
            type="button"
            onClick={handlePublish}
            trailingArrow={false}
            className={
              draft.published
                ? "bg-transparent text-[hsl(var(--ink))] outline outline-1 outline-[hsl(var(--rule-strong))] hover:bg-[hsl(var(--surface))]"
                : undefined
            }
          >
            {draft.published ? "Unpublish" : "Make it live"}
          </Button>
        </div>
      </div>

      {/* Display name */}
      <EditableHeading
        value={draft.displayName}
        placeholder="Your name"
        onCommit={(v) => commit({ ...draft, displayName: v })}
      />

      {/* Handle (read-only). */}
      <p
        className="mt-2 text-[hsl(var(--ink-muted))]"
        style={{ fontSize: "1rem", letterSpacing: "-0.005em" }}
      >
        reachme.com/{draft.handle}
      </p>

      {/* Bio */}
      <div className="mt-12 max-w-[640px]">
        <EyebrowLabel>Bio</EyebrowLabel>
        <EditableParagraph
          value={draft.bio}
          placeholder="One line on what people can reach you about. Specific is better than broad."
          onCommit={(v) => commit({ ...draft, bio: v })}
        />
      </div>

      {/* Floor */}
      <div className="mt-16 max-w-[640px]">
        <EyebrowLabel>Floor</EyebrowLabel>
        <p
          className="mt-3 text-[hsl(var(--ink-muted))]"
          style={{ fontSize: "0.95rem", lineHeight: 1.55 }}
        >
          The minimum amount someone must attach to reach you. Senders see
          this on your page and cannot send less.
        </p>
        <FloorEditor
          value={draft.floor}
          onCommit={(v) => commit({ ...draft, floor: v })}
        />
      </div>

      {/* Categories */}
      <div className="mt-16 max-w-[640px]">
        <EyebrowLabel>Categories</EyebrowLabel>
        <p
          className="mt-3 text-[hsl(var(--ink-muted))]"
          style={{ fontSize: "0.95rem", lineHeight: 1.55 }}
        >
          The kinds of requests you accept. Senders pick from this list.
        </p>
        <div className="mt-7 flex flex-wrap gap-2.5">
          {categoryOptions.map((opt) => {
            const active = draft.categories.includes(opt.value);
            return (
              <motion.button
                key={opt.value}
                type="button"
                onClick={() => toggleCategory(opt.value)}
                aria-pressed={active}
                whileHover={reduced ? undefined : { y: -1 }}
                whileTap={reduced ? undefined : { y: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                className={
                  "rounded-full border px-4 py-2 text-[13px] tracking-[-0.005em] transition-[background-color,border-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] " +
                  (active
                    ? "border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-[hsl(var(--page))]"
                    : "border-[hsl(var(--rule-strong))] text-[hsl(var(--ink-muted))] hover:border-[hsl(var(--ink))] hover:text-[hsl(var(--ink))]")
                }
              >
                {opt.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Reply window — informational; locked at 7 days for now. */}
      <div className="mt-16 max-w-[640px]">
        <EyebrowLabel>Reply window</EyebrowLabel>
        <p
          className="mt-3 text-[hsl(var(--ink-muted))]"
          style={{ fontSize: "0.95rem", lineHeight: 1.55 }}
        >
          Senders are auto-refunded after{" "}
          <span className="text-[hsl(var(--ink))]">
            {draft.replyWindowDays} days
          </span>{" "}
          if you don’t reply. Fixed for now; configurable soon.
        </p>
      </div>

      {/* Footer note for unpublished pages. */}
      {!draft.published ? (
        <div className="mt-20 max-w-[640px] border-t border-[hsl(var(--rule))] pt-8">
          <p
            className="font-serif italic text-[hsl(var(--ink))]"
            style={{
              fontSize: "clamp(1.2rem, 2vw, 1.45rem)",
              lineHeight: 1.4,
              letterSpacing: "-0.015em",
              fontWeight: 400,
            }}
          >
            Your page is private until you make it live.
          </p>
          <p
            className="mt-3 text-[hsl(var(--ink-muted))]"
            style={{ fontSize: "0.95rem", lineHeight: 1.55 }}
          >
            Take your time. Save what you want, preview what you want. Click{" "}
            <span className="text-[hsl(var(--ink))]">Make it live</span> when
            you’re ready.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ─── Save indicator ───────────────────────────────────────────────────────

function SaveIndicator({
  state,
}: {
  state: "idle" | "saving" | "saved";
}) {
  if (state === "idle") return null;
  return (
    <span
      className="inline-flex items-center gap-2 text-[hsl(var(--ink-muted))]"
      style={{
        fontSize: "0.78rem",
        fontStyle: "italic",
        letterSpacing: "-0.005em",
      }}
    >
      {state === "saving" ? (
        <>
          <span
            aria-hidden="true"
            className="inline-block h-1 w-1 rounded-full bg-[hsl(var(--ink-muted))]"
          />
          Saving…
        </>
      ) : (
        <>
          <Check size={13} strokeWidth={1.8} aria-hidden="true" />
          Saved
        </>
      )}
    </span>
  );
}

// ─── Editable primitives ──────────────────────────────────────────────────

function EditableHeading({
  value,
  placeholder,
  onCommit,
}: {
  value: string;
  placeholder: string;
  onCommit: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);

  return (
    <input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        const next = local.trim();
        if (next !== value) onCommit(next);
      }}
      onKeyDown={handleEnterBlur}
      placeholder={placeholder}
      aria-label="Display name"
      maxLength={80}
      className="block w-full bg-transparent font-serif text-[hsl(var(--ink))] outline-none placeholder:text-[hsl(var(--ink-subtle))]"
      style={{
        fontSize: "clamp(2.4rem, 5vw, 4.2rem)",
        fontWeight: 500,
        lineHeight: 1.04,
        letterSpacing: "-0.035em",
      }}
    />
  );
}

function EditableParagraph({
  value,
  placeholder,
  onCommit,
}: {
  value: string;
  placeholder: string;
  onCommit: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);

  return (
    <textarea
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        const next = local.trim();
        if (next !== value) onCommit(next);
      }}
      placeholder={placeholder}
      rows={3}
      maxLength={240}
      className="mt-3 block w-full resize-none bg-transparent text-[hsl(var(--ink))] outline-none placeholder:text-[hsl(var(--ink-subtle))]"
      style={{
        fontSize: "1.1rem",
        lineHeight: 1.55,
        letterSpacing: "-0.005em",
      }}
    />
  );
}

function FloorEditor({
  value,
  onCommit,
}: {
  value: number;
  onCommit: (v: number) => void;
}) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => setLocal(String(value)), [value]);

  return (
    <div
      className="mt-7 flex items-baseline gap-3 border-b border-[hsl(var(--rule-strong))] pb-3"
      style={{ width: "max-content" }}
    >
      <span
        className="text-[hsl(var(--ink-muted))]"
        style={{ fontSize: "1.4rem", letterSpacing: "-0.01em" }}
      >
        $
      </span>
      <input
        value={local}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          // Strip non-digits as the user types.
          setLocal(e.target.value.replace(/[^0-9]/g, ""));
        }}
        onBlur={() => {
          const parsed = parseInt(local, 10);
          const next = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
          if (next !== value) onCommit(next);
          setLocal(String(next));
        }}
        onKeyDown={handleEnterBlur}
        inputMode="numeric"
        aria-label="Floor amount in USD"
        className="w-[8ch] bg-transparent font-serif text-[hsl(var(--ink))] outline-none"
        style={{
          fontSize: "clamp(2rem, 3.4vw, 2.8rem)",
          fontWeight: 500,
          lineHeight: 1,
          letterSpacing: "-0.025em",
          fontVariantNumeric: "lining-nums tabular-nums",
        }}
      />
      <span
        className="text-[hsl(var(--ink-subtle))]"
        style={{
          fontSize: "0.7rem",
          fontWeight: 500,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
        }}
      >
        USD min
      </span>
    </div>
  );
}

function EyebrowLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[hsl(var(--ink-muted))]"
      style={{
        fontSize: "0.7rem",
        fontWeight: 500,
        letterSpacing: "0.24em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </p>
  );
}

function handleEnterBlur(e: KeyboardEvent<HTMLInputElement>) {
  if (e.key === "Enter") {
    e.preventDefault();
    e.currentTarget.blur();
  }
}
