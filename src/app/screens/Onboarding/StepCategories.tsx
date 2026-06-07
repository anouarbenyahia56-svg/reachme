import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { EASE } from "@/components/motion";
import { Button } from "../../ui/Button";
import { Label } from "../../ui/Field";
import { Reveal } from "../../ui/Reveal";
import { useRouter } from "../../router";
import { OnboardingShell, OnboardingTitle } from "./OnboardingShell";
import { patchDraft, useDraft } from "../../store/draft";
import {
  DEFAULT_CATEGORIES,
  SUGGESTED_EXTRAS,
  makeCategoryId,
} from "../../store/categories";
import type { Category } from "../../types";

/**
 * Step 5 — What you're open to.
 *
 * Curated suggestions, an "add custom" affordance. Min 1, max 6.
 * Everything is fluid — categories animate in/out with the same
 * easing as the rest of the platform.
 */
export function StepCategories() {
  const { navigate } = useRouter();
  const draft = useDraft();
  const [items, setItems] = useState<Category[]>(
    draft.categories ?? [...DEFAULT_CATEGORIES],
  );
  const [custom, setCustom] = useState("");

  useEffect(() => {
    patchDraft({ categories: items });
  }, [items]);

  const has = (id: string) => items.some((c) => c.id === id);

  const remove = (id: string) =>
    setItems((arr) => arr.filter((c) => c.id !== id));

  const add = (cat: Category) => {
    if (has(cat.id) || items.length >= 6) return;
    setItems((arr) => [...arr, cat]);
  };

  const addCustom = () => {
    const label = custom.trim();
    if (!label) return;
    const id = makeCategoryId(label);
    if (has(id)) {
      setCustom("");
      return;
    }
    add({ id, label });
    setCustom("");
  };

  const canContinue = items.length >= 1;

  const remaining = [...DEFAULT_CATEGORIES, ...SUGGESTED_EXTRAS].filter(
    (s) => !has(s.id),
  );

  return (
    <OnboardingShell step={5} total={8} back="/claim/floor">
      <OnboardingTitle
        title="Choose what reaches you."
        description="People reaching out pick a category before they send. Choose the ones you're genuinely open to. Everything else self-selects out."
      />

      <Reveal delay={0.32} duration={0.85} axis="x" blur={5}>
        <div className="mt-14 max-w-[780px]">
          <Label>Your categories</Label>
          <div className="rounded-2xl border border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] p-4">
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
                    <span className="group inline-flex items-center gap-2 rounded-full bg-[hsl(var(--ink))] py-1.5 pl-4 pr-1.5 text-[12.5px] font-medium text-[hsl(var(--page))]">
                      {c.label}
                      <button
                        type="button"
                        onClick={() => remove(c.id)}
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full transition-colors duration-300 hover:bg-[hsl(var(--page))]/15"
                        aria-label={`Remove ${c.label}`}
                      >
                        <X size={11} strokeWidth={2} />
                      </button>
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
              {items.length === 0 && (
                <li className="px-2 py-1 text-[12.5px] text-[hsl(var(--ink-subtle))]">
                  Add at least one category. You can change them any time.
                </li>
              )}
            </ul>

            <div className="mt-7 border-t border-[hsl(var(--rule))] pt-6">
              <p className="mb-3 text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
                Suggestions
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

            <div className="mt-7 border-t border-[hsl(var(--rule))] pt-6">
              <p className="mb-3 text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
                Add your own
              </p>
              <div className="flex items-stretch gap-2">
                <input
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  placeholder="Studio collaboration, Editorial pitch…"
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

          <p className="mt-3 text-[12.5px] text-[hsl(var(--ink-subtle))]">
            Up to 6 categories. The same floor applies to all of them.
          </p>

          <div className="mt-10 flex items-center gap-4">
            <Button
              size="lg"
              trailingArrow
              disabled={!canContinue}
              onClick={() => navigate("/claim/socials")}
            >
              Continue
            </Button>
          </div>
        </div>
      </Reveal>
    </OnboardingShell>
  );
}
