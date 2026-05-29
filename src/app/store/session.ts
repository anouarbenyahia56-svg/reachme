import type { Account, Profile } from "../types";
import { read, write, remove } from "./storage";
import { upsertDirectory } from "./directory";
import { useExternal } from "./useExternal";

/**
 * Session store — the active account and its profile.
 *
 * `Account` exists from the moment a person starts onboarding.
 * `Profile` exists once the page is created. The two are kept
 * separate so logging back in on a fresh device shows the right
 * resume point: claim handle → set up profile → live.
 */

const ACCOUNT_KEY = "account";
const PROFILE_KEY = "profile";

export function getAccount(): Account | null {
  return read<Account | null>(ACCOUNT_KEY, null);
}

export function setAccount(account: Account | null): void {
  if (!account) {
    remove(ACCOUNT_KEY);
    return;
  }
  write(ACCOUNT_KEY, account);
}

export function getProfile(): Profile | null {
  return read<Profile | null>(PROFILE_KEY, null);
}

export function setProfile(profile: Profile | null): void {
  if (!profile) {
    remove(PROFILE_KEY);
    return;
  }
  write(PROFILE_KEY, profile);
  upsertDirectory(profile);

  // Mark the account as having a profile so the resume path is
  // deterministic on reload.
  const account = getAccount();
  if (account && !account.hasProfile) {
    setAccount({ ...account, hasProfile: true });
  }
}

export function signOut(): void {
  remove(ACCOUNT_KEY);
  remove(PROFILE_KEY);
}

// ─── Reactive bindings ────────────────────────────────────────────

export function useAccount(): Account | null {
  return useExternal(ACCOUNT_KEY, getAccount);
}

export function useProfile(): Profile | null {
  return useExternal(PROFILE_KEY, getProfile);
}
