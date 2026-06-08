import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Shield,
  Bell,
  Palette,
  LogOut,
  Trash2,
  Download,
  KeyRound,
  Smartphone,
  ChevronRight,
} from "lucide-react";
import { EASE } from "@/components/motion";
import { Card, CardHeader } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { Modal } from "../../ui/Modal";
import { TextField, Label } from "../../ui/Field";
import { Avatar } from "../../ui/Avatar";
import { Reveal } from "../../ui/Reveal";
import { setAccount, signOut, useAccount, useProfile } from "../../store/session";
import { useToast } from "../../ui/Toast";
import { cn } from "@/lib/utils";

/**
 * Settings — the owner's account, notifications, security,
 * preferences, and account management.
 *
 * Designed as a centered single-column layout (like MyPage)
 * with distinct card sections. Every section is wired for
 * backend integration — local store calls are isolated in
 * handlers and marked with TODO comments for the backend
 * developer to replace.
 *
 *   1. Account       — email, display name, avatar shortcut
 *   2. Notifications — email notification preferences
 *   3. Security      — password, two-factor authentication
 *   4. Preferences   — currency, timezone
 *   5. Session       — sign out
 *   6. Danger zone   — export data, delete account
 */
export function Settings() {
  return (
    <div className="mx-auto max-w-3xl space-y-14">
      <Reveal duration={0.7} blur={6} delay={0}>
        <AccountCard />
      </Reveal>

      <Reveal duration={0.7} blur={6} delay={0.06}>
        <NotificationsCard />
      </Reveal>

      <Reveal duration={0.7} blur={6} delay={0.12}>
        <SecurityCard />
      </Reveal>

      <Reveal duration={0.7} blur={6} delay={0.18}>
        <PreferencesCard />
      </Reveal>

      <Reveal duration={0.7} blur={6} delay={0.24}>
        <SessionCard />
      </Reveal>

      <Reveal duration={0.7} blur={6} delay={0.3}>
        <DangerZoneCard />
      </Reveal>
    </div>
  );
}

// ─── Account ────────────────────────────────────────────────────

function AccountCard() {
  const account = useAccount();
  const profile = useProfile();
  const toast = useToast();

  const [email, setEmail] = useState(account?.email ?? "");
  const [displayName, setDisplayName] = useState(account?.displayName ?? "");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!hydrated && account) {
      setEmail(account.email);
      setDisplayName(account.displayName);
      setHydrated(true);
    }
  }, [account, hydrated]);

  if (!account) return null;

  const emailDirty = account.email !== email.trim();
  const nameDirty = account.displayName !== displayName.trim();
  const dirty = emailDirty || nameDirty;
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const save = () => {
    if (!validEmail) return toast.show("Enter a valid email address.");
    setAccount({
      ...account,
      email: email.trim(),
      displayName: displayName.trim() || account.displayName,
    });
    toast.show("Account updated.");
  };

  const reset = () => {
    setEmail(account.email);
    setDisplayName(account.displayName);
  };

  return (
    <Card>
      <div className="px-8 py-10 md:px-11 md:py-12">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
              Account
            </p>
            <p
              className="mt-3 font-serif text-[hsl(var(--ink))]"
              style={{
                fontSize: "clamp(1.5rem, 2.4vw, 2.1rem)",
                fontWeight: 500,
                letterSpacing: "-0.025em",
                lineHeight: 1.1,
                textWrap: "balance",
              }}
            >
              Your details
            </p>
            <p className="mt-3 max-w-[50ch] text-[13.5px] leading-[1.6] text-[hsl(var(--ink-muted))]">
              The email you sign in with and the name people see when you reply.
            </p>
          </div>
          {profile && (
            <Avatar size="lg" src={profile.avatarUrl} name={profile.displayName} />
          )}
        </div>

        <div className="mt-10 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <TextField
              label="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={48}
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              errorText={!validEmail && email ? "Enter a valid email address." : undefined}
            />
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <Button onClick={save} disabled={!dirty || !validEmail} trailingArrow>
            Save changes
          </Button>
          {dirty && (
            <Button variant="ghost" onClick={reset}>
              Discard
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Notifications ──────────────────────────────────────────────

interface NotificationPref {
  id: string;
  label: string;
  description: string;
  defaultOn: boolean;
}

const NOTIFICATION_PREFS: NotificationPref[] = [
  {
    id: "serious-request",
    label: "A serious request arrives",
    description: "Get notified the moment someone sends a request with a high amount.",
    defaultOn: true,
  },
  {
    id: "reply-window",
    label: "A reply window is about to close",
    description: "Reminder before a pending request expires and the held amount is refunded.",
    defaultOn: true,
  },
  {
    id: "request-expired",
    label: "A request expires and refunds",
    description: "Know when a request you didn't reply to has been refunded to the sender.",
    defaultOn: true,
  },
  {
    id: "payment-received",
    label: "A payment is released to you",
    description: "Confirmation when you reply to a request and funds land in your balance.",
    defaultOn: true,
  },
  {
    id: "weekly-summary",
    label: "Weekly earnings summary",
    description: "A once-a-week digest of your earnings, withdrawals, and pending requests.",
    defaultOn: false,
  },
];

function NotificationsCard() {
  // TODO: wire to backend — GET /settings/notifications
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const p of NOTIFICATION_PREFS) initial[p.id] = p.defaultOn;
    return initial;
  });

  const toggle = (id: string) => {
    setPrefs((prev) => ({ ...prev, [id]: !prev[id] }));
    // TODO: wire to backend — PUT /settings/notifications { [id]: !prefs[id] }
  };

  return (
    <Card>
      <div className="px-8 py-10 md:px-11 md:py-12">
        <div className="flex items-start gap-4">
          <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--page))] text-[hsl(var(--ink-muted))] ring-1 ring-[hsl(var(--rule))]">
            <Bell size={16} strokeWidth={1.6} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
              Notifications
            </p>
            <p
              className="mt-3 font-serif text-[hsl(var(--ink))]"
              style={{
                fontSize: "clamp(1.5rem, 2.4vw, 2.1rem)",
                fontWeight: 500,
                letterSpacing: "-0.025em",
                lineHeight: 1.1,
                textWrap: "balance",
              }}
            >
              Pick what reaches your inbox.
            </p>
            <p className="mt-3 max-w-[50ch] text-[13.5px] leading-[1.6] text-[hsl(var(--ink-muted))]">
              Control the emails you receive. You can change these any time.
            </p>
          </div>
        </div>

        <ul className="mt-10 divide-y divide-[hsl(var(--rule))]">
          {NOTIFICATION_PREFS.map((pref) => (
            <NotificationToggle
              key={pref.id}
              pref={pref}
              on={prefs[pref.id]}
              onToggle={() => toggle(pref.id)}
            />
          ))}
        </ul>
      </div>
    </Card>
  );
}

function NotificationToggle({
  pref,
  on,
  onToggle,
}: {
  pref: NotificationPref;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="flex items-start justify-between gap-6 py-5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-[hsl(var(--ink))]">
          {pref.label}
        </p>
        <p className="mt-1 text-[12.5px] leading-[1.55] text-[hsl(var(--ink-muted))]">
          {pref.description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onToggle}
        className={cn(
          "relative mt-0.5 inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer rounded-full transition-colors duration-300",
          on ? "bg-[hsl(var(--ink))]" : "bg-[hsl(var(--rule-strong))]",
        )}
      >
        <span
          className={cn(
            "inline-block h-[18px] w-[18px] translate-y-[2px] rounded-full bg-[hsl(var(--page))] transition-transform duration-300",
            on ? "translate-x-[20px]" : "translate-x-[2px]",
          )}
        />
      </button>
    </li>
  );
}

// ─── Security ───────────────────────────────────────────────────

function SecurityCard() {
  const toast = useToast();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordsMatch = newPassword === confirmPassword;
  const validNewPassword = newPassword.length >= 8;

  const closePasswordModal = () => {
    setPasswordOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handlePasswordChange = () => {
    if (!validNewPassword) return toast.show("Password must be at least 8 characters.");
    if (!passwordsMatch) return toast.show("Passwords don't match.");
    // TODO: wire to backend — POST /settings/password { currentPassword, newPassword }
    toast.show("Password updated.");
    closePasswordModal();
  };

  const toggleTwoFactor = () => {
    // TODO: wire to backend — POST /settings/2fa/toggle
    setTwoFactorEnabled((v) => !v);
    toast.show(twoFactorEnabled ? "Two-factor authentication disabled." : "Two-factor authentication enabled.");
  };

  return (
    <>
      <Card>
        <div className="px-8 py-10 md:px-11 md:py-12">
          <div className="flex items-start gap-4">
            <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--page))] text-[hsl(var(--ink-muted))] ring-1 ring-[hsl(var(--rule))]">
              <Shield size={16} strokeWidth={1.6} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
                Security
              </p>
              <p
                className="mt-3 font-serif text-[hsl(var(--ink))]"
                style={{
                  fontSize: "clamp(1.5rem, 2.4vw, 2.1rem)",
                  fontWeight: 500,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.1,
                  textWrap: "balance",
                }}
              >
                Keep your account safe.
              </p>
              <p className="mt-3 max-w-[50ch] text-[13.5px] leading-[1.6] text-[hsl(var(--ink-muted))]">
                Manage your password and two-factor authentication.
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-0 divide-y divide-[hsl(var(--rule))]">
            <SecurityRow
              icon={<KeyRound size={16} strokeWidth={1.6} />}
              label="Password"
              description="Change your sign-in password."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPasswordOpen(true)}
                >
                  Change
                </Button>
              }
            />
            <SecurityRow
              icon={<Smartphone size={16} strokeWidth={1.6} />}
              label="Two-factor authentication"
              description={
                twoFactorEnabled
                  ? "Extra verification when you sign in."
                  : "Add an extra layer of security to your account."
              }
              action={
                <button
                  type="button"
                  role="switch"
                  aria-checked={twoFactorEnabled}
                  onClick={toggleTwoFactor}
                  className={cn(
                    "relative inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer rounded-full transition-colors duration-300",
                    twoFactorEnabled
                      ? "bg-[hsl(var(--ink))]"
                      : "bg-[hsl(var(--rule-strong))]",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-[18px] w-[18px] translate-y-[2px] rounded-full bg-[hsl(var(--page))] transition-transform duration-300",
                      twoFactorEnabled
                        ? "translate-x-[20px]"
                        : "translate-x-[2px]",
                    )}
                  />
                </button>
              }
            />
          </div>
        </div>
      </Card>

      <Modal
        open={passwordOpen}
        onClose={closePasswordModal}
        title="Change password"
        description="Enter your current password and choose a new one."
        size="sm"
      >
        <div className="space-y-5">
          <TextField
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
          <TextField
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helper="At least 8 characters."
            autoComplete="new-password"
          />
          <TextField
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            errorText={
              confirmPassword && !passwordsMatch
                ? "Passwords don't match."
                : undefined
            }
            autoComplete="new-password"
          />
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={closePasswordModal}>
              Cancel
            </Button>
            <Button
              onClick={handlePasswordChange}
              disabled={!currentPassword || !validNewPassword || !passwordsMatch}
              trailingArrow
            >
              Update password
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function SecurityRow({
  icon,
  label,
  description,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-5 first:pt-0 last:pb-0">
      <div className="flex items-start gap-4">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--page))] text-[hsl(var(--ink-muted))] ring-1 ring-[hsl(var(--rule))]">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-[hsl(var(--ink))]">
            {label}
          </p>
          <p className="mt-1 text-[12.5px] leading-[1.55] text-[hsl(var(--ink-muted))]">
            {description}
          </p>
        </div>
      </div>
      {action}
    </div>
  );
}

// ─── Preferences ────────────────────────────────────────────────

const CURRENCIES = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "\u20AC" },
  { code: "GBP", label: "British Pound", symbol: "\u00A3" },
] as const;

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Kolkata",
  "Australia/Sydney",
] as const;

function PreferencesCard() {
  // TODO: wire to backend — GET /settings/preferences
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("America/New_York");

  // TODO: wire to backend — PUT /settings/preferences
  const handleCurrencyChange = (code: string) => {
    setCurrency(code);
    // toast.show("Currency updated.");
  };

  const handleTimezoneChange = (tz: string) => {
    setTimezone(tz);
    // toast.show("Timezone updated.");
  };

  return (
    <Card>
      <div className="px-8 py-10 md:px-11 md:py-12">
        <div className="flex items-start gap-4">
          <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--page))] text-[hsl(var(--ink-muted))] ring-1 ring-[hsl(var(--rule))]">
            <Palette size={16} strokeWidth={1.6} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
              Preferences
            </p>
            <p
              className="mt-3 font-serif text-[hsl(var(--ink))]"
              style={{
                fontSize: "clamp(1.5rem, 2.4vw, 2.1rem)",
                fontWeight: 500,
                letterSpacing: "-0.025em",
                lineHeight: 1.1,
                textWrap: "balance",
              }}
            >
              Your defaults.
            </p>
            <p className="mt-3 max-w-[50ch] text-[13.5px] leading-[1.6] text-[hsl(var(--ink-muted))]">
              Currency shown on your page and timezone for notifications.
            </p>
          </div>
        </div>

        <div className="mt-10 space-y-8">
          {/* Currency */}
          <div>
            <Label>Currency</Label>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {CURRENCIES.map((c) => {
                const active = currency === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCurrencyChange(c.code)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col items-start rounded-2xl border px-4 py-4 text-left transition-[border-color,background-color,color] duration-300",
                      active
                        ? "border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-[hsl(var(--page))]"
                        : "border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] text-[hsl(var(--ink))] hover:border-[hsl(var(--ink))]",
                    )}
                  >
                    <span className="font-serif text-[1.15rem] font-medium tracking-[-0.025em]">
                      {c.symbol} {c.code}
                    </span>
                    <span
                      className={cn(
                        "mt-1 text-[11.5px]",
                        active
                          ? "text-[hsl(var(--page))]/75"
                          : "text-[hsl(var(--ink-subtle))]",
                      )}
                    >
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timezone */}
          <div>
            <Label>Timezone</Label>
            <div className="mt-3">
              <select
                value={timezone}
                onChange={(e) => handleTimezoneChange(e.target.value)}
                className="w-full rounded-2xl border border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] px-4 py-3.5 text-[15px] text-[hsl(var(--ink))] transition-[border-color] duration-300 focus:border-[hsl(var(--ink))] focus:outline-none"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, " ").replace("America/", "Americas / ").replace("Europe/", "Europe / ").replace("Asia/", "Asia / ").replace("Australia/", "Australia / ")}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-2.5 text-[12.5px] leading-[1.55] text-[hsl(var(--ink-subtle))]">
              Used for reply-window countdowns and notification timing.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Session ────────────────────────────────────────────────────

function SessionCard() {
  const [signoutOpen, setSignoutOpen] = useState(false);

  return (
    <>
      <Card>
        <div className="px-8 py-10 md:px-11 md:py-12">
          <div className="flex items-start gap-4">
            <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--page))] text-[hsl(var(--ink-muted))] ring-1 ring-[hsl(var(--rule))]">
              <LogOut size={16} strokeWidth={1.6} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
                Session
              </p>
              <p
                className="mt-3 font-serif text-[hsl(var(--ink))]"
                style={{
                  fontSize: "clamp(1.5rem, 2.4vw, 2.1rem)",
                  fontWeight: 500,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.1,
                  textWrap: "balance",
                }}
              >
                You're signed in.
              </p>
              <p className="mt-3 max-w-[50ch] text-[13.5px] leading-[1.6] text-[hsl(var(--ink-muted))]">
                Your page stays live. Sign back in any time with your email.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Button variant="outline" onClick={() => setSignoutOpen(true)}>
              Sign out
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        open={signoutOpen}
        onClose={() => setSignoutOpen(false)}
        title="Sign out of ReachMe?"
        description="Your page stays live. Sign back in any time with this email."
        size="sm"
      >
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={() => setSignoutOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="solid"
            onClick={() => {
              signOut();
              window.location.href = "/";
            }}
          >
            Sign out
          </Button>
        </div>
      </Modal>
    </>
  );
}

// ─── Danger Zone ────────────────────────────────────────────────

function DangerZoneCard() {
  const toast = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    // TODO: wire to backend — GET /settings/export (returns JSON with all user data)
    toast.show("Export started.", "We'll email you a link to download your data.");
  };

  const handleDelete = () => {
    if (deleteConfirm !== "delete") return;
    // TODO: wire to backend — DELETE /settings/account
    toast.show("Account deleted.");
    signOut();
    window.location.href = "/";
  };

  const closeDeleteModal = () => {
    setDeleteOpen(false);
    setDeleteConfirm("");
  };

  return (
    <>
      <Card variant="dark">
        <div className="px-8 py-10 md:px-11 md:py-12">
          <div className="flex items-start gap-4">
            <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--page))]/10 text-[hsl(var(--page))]/70 ring-1 ring-[hsl(var(--page))]/15">
              <Trash2 size={16} strokeWidth={1.6} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--page))]/50">
                Danger zone
              </p>
              <p
                className="mt-3 font-serif text-[hsl(var(--page))]"
                style={{
                  fontSize: "clamp(1.5rem, 2.4vw, 2.1rem)",
                  fontWeight: 500,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.1,
                  textWrap: "balance",
                }}
              >
                Irreversible actions.
              </p>
              <p className="mt-3 max-w-[50ch] text-[13.5px] leading-[1.6] text-[hsl(var(--page))]/60">
                Export your data or permanently delete your account. This cannot be undone.
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-0 divide-y divide-[hsl(var(--page))]/10">
            <DangerRow
              icon={<Download size={16} strokeWidth={1.6} />}
              label="Export your data"
              description="Download a copy of all your account data, requests, and earnings."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="border-[hsl(var(--page))]/20 text-[hsl(var(--page))] hover:bg-[hsl(var(--page))]/10 hover:text-[hsl(var(--page))]"
                >
                  Export
                </Button>
              }
            />
            <DangerRow
              icon={<Trash2 size={16} strokeWidth={1.6} />}
              label="Delete your account"
              description="Permanently remove your account, profile, and all associated data."
              action={
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete account
                </Button>
              }
            />
          </div>
        </div>
      </Card>

      <Modal
        open={deleteOpen}
        onClose={closeDeleteModal}
        title="Delete your account?"
        description="This will permanently remove your profile, request history, earnings, and all associated data. This action cannot be undone."
        size="sm"
      >
        <div className="space-y-5">
          <div>
            <Label>Type "delete" to confirm</Label>
            <input
              ref={inputRef}
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value.toLowerCase())}
              placeholder="delete"
              autoFocus
              className="mt-2 w-full rounded-2xl border border-[hsl(var(--rule-strong))] bg-[hsl(var(--surface))] px-4 py-3.5 text-[15px] text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-subtle))] transition-[border-color] duration-300 focus:border-[hsl(var(--ink))] focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleteConfirm !== "delete"}
            >
              Delete account
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function DangerRow({
  icon,
  label,
  description,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-5 first:pt-0 last:pb-0">
      <div className="flex items-start gap-4">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--page))]/10 text-[hsl(var(--page))]/60 ring-1 ring-[hsl(var(--page))]/10">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-[hsl(var(--page))]">
            {label}
          </p>
          <p className="mt-1 text-[12.5px] leading-[1.55] text-[hsl(var(--page))]/60">
            {description}
          </p>
        </div>
      </div>
      {action}
    </div>
  );
}
