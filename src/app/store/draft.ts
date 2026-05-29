import { read, write, remove } from "./storage";
import type { Category, Visibility } from "../types";
import { DEFAULT_CATEGORIES } from "./categories";
import { useExternal } from "./useExternal";

/**
 * Onboarding draft — the in-progress profile a user is building
 * across the multi-step flow. Persisted so a refresh, a pause,
 * or a sign-out-and-back-in returns them exactly where they were.
 */

export interface OnboardingDraft {
  email?: string;
  handle?: string;
  displayName?: string;
  title?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  minAmountCents?: number;
  replyWindowDays?: number;
  categories?: Category[];
  visibility?: Visibility;
}

const KEY = "draft.onboarding";

const DEFAULTS: OnboardingDraft = {
  minAmountCents: 15000,
  replyWindowDays: 7,
  categories: [...DEFAULT_CATEGORIES],
  visibility: "public",
};

export function getDraft(): OnboardingDraft {
  return { ...DEFAULTS, ...read<OnboardingDraft>(KEY, {}) };
}

export function patchDraft(patch: Partial<OnboardingDraft>): void {
  const next = { ...getDraft(), ...patch };
  write(KEY, next);
}

export function clearDraft(): void {
  remove(KEY);
}

export function useDraft(): OnboardingDraft {
  return useExternal(KEY, getDraft);
}
