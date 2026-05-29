import type { Category } from "../types";

/** Default catalogue offered during onboarding. The owner can
 *  add/remove and reorder. Persisted on the profile. */
export const DEFAULT_CATEGORIES: readonly Category[] = [
  { id: "business", label: "Business opportunity" },
  { id: "partnership", label: "Partnership" },
  { id: "intro", label: "Intro request" },
  { id: "advice", label: "Advice request" },
  { id: "general", label: "General inquiry" },
];

export const SUGGESTED_EXTRAS: readonly Category[] = [
  { id: "hiring", label: "Hiring / recruiting" },
  { id: "press", label: "Press / interview" },
  { id: "speaking", label: "Speaking" },
  { id: "consulting", label: "Consulting" },
  { id: "investment", label: "Investment" },
  { id: "collab", label: "Collaboration" },
  { id: "fan", label: "Fan message" },
];

export function makeCategoryId(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || `cat-${Date.now()}`
  );
}
