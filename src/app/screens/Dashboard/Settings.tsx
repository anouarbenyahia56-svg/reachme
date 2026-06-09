import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Shield,
  Bell,
  Smartphone,
  Trash2,
  AlertTriangle,
  Monitor,
  MapPin,
  LogOut,
  LinkIcon,
} from "lucide-react";
import { EASE } from "@/components/motion";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { Modal } from "../../ui/Modal";
import { TextField, Label } from "../../ui/Field";
import { Avatar } from "../../ui/Avatar";
import { Pill } from "../../ui/Pill";
import { Reveal } from "../../ui/Reveal";
import { setAccount, signOut, useAccount, useProfile } from "../../store/session";
import { useToast } from "../../ui/Toast";
import { cn } from "@/lib/utils";

/**
 * Settings — the owner's account configuration, security,
 * and account management surface.
 *
 * Four sections, in order:
 *   1. Account       — email, password, connected social logins
 *   2. Notifications — email notification preferences
 *   3. Security      — two-factor auth, active sessions
 *   4. Danger zone   — deactivate and delete account
 *
 * Every handler is a named function with a TODO for backend
 * wiring. No decorative elements — everything earns its place.
 */
export function Settings() {
  return (
    <div className="mx-auto max-w-3xl space-y-14">
      <Reveal duration={0.45} blur={5} delay={0}>
        <AccountCard />
      </Reveal>

      <Reveal duration={0.45} blur={5} delay={0.06}>
        <NotificationsCard />
      </Reveal>

      <Reveal duration={0.45} blur={5} delay={0.12}>
        <SecurityCard />
      </Reveal>

      <Reveal duration={0.45} blur={5} delay={0.18}>
        <DangerZoneCard />
      </Reveal>
    </div>
  );
}

// ─── Toggle switch ──────────────────────────────────────────────

function Toggle({
  on,
  onToggle,
  disabled,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "relative mt-0.5 inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer rounded-full transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50",
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
  );
}

// ─── Section header ─────────────────────────────────────────────

function SectionHeader({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--page))] text-[hsl(var(--ink-muted))] ring-1 ring-[hsl(var(--rule))]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
          {eyebrow}
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
          {title}
        </p>
        <p className="mt-3 max-w-[50ch] text-[13.5px] leading-[1.6] text-[hsl(var(--ink-muted))]">
          {description}
        </p>
      </div>
    </div>
  );
}

// ─── Account ────────────────────────────────────────────────────

type ConnectedProvider = "google" | "apple";

interface ConnectedSocial {
  provider: ConnectedProvider;
  email: string;
  connected: boolean;
}

function AccountCard() {
  const account = useAccount();
  const profile = useProfile();
  const toast = useToast();

  const [email, setEmail] = useState(account?.email ?? "");
  const [hydrated, setHydrated] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // TODO: wire to backend — GET /settings/account/connections
  const [connectedSocials, setConnectedSocials] = useState<ConnectedSocial[]>([
    { provider: "google", email: "user@gmail.com", connected: true },
    { provider: "apple", email: "", connected: false },
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated && account) {
      setEmail(account.email);
      setHydrated(true);
      // TODO: wire to backend — fetch connected social providers
      setLoading(false);
    }
  }, [account, hydrated]);

  if (!account) return null;

  const emailDirty = account.email !== email.trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const saveEmail = () => {
    if (!validEmail) return toast.show("Enter a valid email address.");
    // TODO: wire to backend — PUT /settings/account/email
    setAccount({ ...account, email: email.trim() });
    setEditingEmail(false);
    toast.show("Email updated.");
  };

  const cancelEditEmail = () => {
    setEmail(account.email);
    setEditingEmail(false);
  };

  const openPasswordModal = () => {
    setPasswordOpen(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const closePasswordModal = () => {
    setPasswordOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordLoading(false);
  };

  const passwordsMatch = newPassword === confirmPassword;
  const validNewPassword = newPassword.length >= 8;

  const changePassword = async () => {
    if (!validNewPassword) return toast.show("Password must be at least 8 characters.");
    if (!passwordsMatch) return toast.show("Passwords don't match.");
    setPasswordLoading(true);
    // TODO: wire to backend — POST /settings/account/password
    await new Promise((r) => setTimeout(r, 800));
    // Mark the account as having a password so the modal
    // switches to "Change password" on next open.
    if (!account.hasPassword) {
      setAccount({ ...account, hasPassword: true });
    }
    toast.show(account.hasPassword ? "Password updated." : "Password set.");
    setPasswordLoading(false);
    closePasswordModal();
  };

  const connectSocial = (provider: ConnectedProvider) => {
    // TODO: wire to backend — POST /settings/account/connect/{provider}
    setConnectedSocials((prev) =>
      prev.map((s) =>
        s.provider === provider
          ? { ...s, connected: true, email: `user@${provider === "google" ? "gmail.com" : "icloud.com"}` }
          : s,
      ),
    );
    toast.show(`${provider === "google" ? "Google" : "Apple"} connected.`);
  };

  const disconnectSocial = (provider: ConnectedProvider) => {
    // TODO: wire to backend — DELETE /settings/account/connect/{provider}
    setConnectedSocials((prev) =>
      prev.map((s) =>
        s.provider === provider ? { ...s, connected: false, email: "" } : s,
      ),
    );
    toast.show(`${provider === "google" ? "Google" : "Apple"} disconnected.`);
  };

  const PROVIDER_LABELS: Record<ConnectedProvider, string> = {
    google: "Google",
    apple: "Apple",
  };

  return (
    <>
      <Card>
        <div className="px-8 py-10 md:px-11 md:py-12">
          <div className="flex items-start justify-between gap-6">
            <SectionHeader
              icon={<Mail size={16} strokeWidth={1.6} aria-hidden="true" />}
              eyebrow="Account"
              title="Your details."
              description="How you sign in and who to reach if something goes wrong."
            />
            {profile && (
              <Avatar size="lg" src={profile.avatarUrl} name={profile.displayName} />
            )}
          </div>

          {loading ? (
            <div className="mt-10 space-y-6">
              <div className="h-20 animate-pulse rounded-2xl bg-[hsl(var(--rule))]" />
              <div className="h-20 animate-pulse rounded-2xl bg-[hsl(var(--rule))]" />
            </div>
          ) : (
            <div className="mt-10 space-y-0 divide-y divide-[hsl(var(--rule))]">
              {/* Email row */}
              <div className="py-5 first:pt-0">
                <div className="flex items-center justify-between gap-6">
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-[hsl(var(--ink))]">
                      Email
                    </p>
                    {editingEmail ? (
                      <div className="mt-3 max-w-sm space-y-3">
                        <TextField
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          errorText={
                            !validEmail && email ? "Enter a valid email address." : undefined
                          }
                          autoFocus
                        />
                        <div className="flex items-center gap-3">
                          <Button size="sm" onClick={saveEmail} disabled={!emailDirty || !validEmail}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEditEmail}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-[13px] text-[hsl(var(--ink-muted))]">
                        {account.email}
                      </p>
                    )}
                  </div>
                  {!editingEmail && (
                    <Button variant="outline" size="sm" onClick={() => setEditingEmail(true)}>
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              {/* Password row */}
              <div className="py-5">
                <div className="flex items-center justify-between gap-6">
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-[hsl(var(--ink))]">
                      Password
                    </p>
                    <p className="mt-1 text-[13px] text-[hsl(var(--ink-muted))]">
                      {account.hasPassword
                        ? "Used to sign in to your account."
                        : "Set a password so you can also sign in with a password."}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={openPasswordModal}>
                    {account.hasPassword ? "Change" : "Set"}
                  </Button>
                </div>
              </div>

              {/* Connected social logins */}
              {connectedSocials.map((social) => (
                <div key={social.provider} className="py-5 last:pb-0">
                  <div className="flex items-center justify-between gap-6">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <p className="text-[14px] font-medium text-[hsl(var(--ink))]">
                          {PROVIDER_LABELS[social.provider]}
                        </p>
                        {social.connected && (
                          <Pill tone="ink" size="sm">
                            <LinkIcon size={10} strokeWidth={2} className="shrink-0" />
                            Connected
                          </Pill>
                        )}
                      </div>
                      <p className="mt-1 text-[13px] text-[hsl(var(--ink-muted))]">
                        {social.connected
                          ? social.email
                          : `Sign in with ${PROVIDER_LABELS[social.provider]}`}
                      </p>
                    </div>
                    {social.connected ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => disconnectSocial(social.provider)}
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => connectSocial(social.provider)}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Password modal */}
      <Modal
        open={passwordOpen}
        onClose={closePasswordModal}
        title={account.hasPassword ? "Change password" : "Set a password"}
        description={
          account.hasPassword
            ? "Enter your current password and choose a new one."
            : "Choose a password so you can sign in with a password."
        }
        size="sm"
      >
        <div className="space-y-5">
          {account.hasPassword && (
            <TextField
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          )}
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
              confirmPassword && !passwordsMatch ? "Passwords don't match." : undefined
            }
            autoComplete="new-password"
          />
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={closePasswordModal}>
              Cancel
            </Button>
            <Button
              onClick={changePassword}
              disabled={
                account.hasPassword
                  ? !currentPassword || !validNewPassword || !passwordsMatch
                  : !validNewPassword || !passwordsMatch
              }
              loading={passwordLoading}
              trailingArrow
            >
              {account.hasPassword ? "Update password" : "Set password"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
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
    id: "new-request",
    label: "New request received",
    description: "Get notified the moment someone sends you a request.",
    defaultOn: true,
  },
  {
    id: "request-expiring",
    label: "Request about to expire",
    description: "Reminder before a pending request expires and the held amount is refunded.",
    defaultOn: true,
  },
  {
    id: "payment-released",
    label: "Payment released",
    description: "Confirmation when you reply to a request and funds land in your balance.",
    defaultOn: true,
  },
  {
    id: "weekly-digest",
    label: "Weekly summary digest",
    description: "A once-a-week summary of your earnings, withdrawals, and pending requests.",
    defaultOn: true,
  },
];

function NotificationsCard() {
  // TODO: wire to backend — GET /settings/notifications
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const p of NOTIFICATION_PREFS) initial[p.id] = p.defaultOn;
    return initial;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: wire to backend — fetch notification preferences
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  const toggle = (id: string) => {
    setPrefs((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      // TODO: wire to backend — PUT /settings/notifications { [id]: next[id] }
      return next;
    });
  };

  return (
    <Card>
      <div className="px-8 py-10 md:px-11 md:py-12">
        <SectionHeader
          icon={<Bell size={16} strokeWidth={1.6} aria-hidden="true" />}
          eyebrow="Notifications"
          title="Pick what reaches your inbox."
          description="Control the emails you receive. Changes take effect immediately."
        />

        {error && (
          <div className="mt-8 rounded-2xl border border-[hsl(var(--danger))]/20 bg-[hsl(var(--danger))]/5 px-5 py-4 text-[13px] text-[hsl(var(--danger))]">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-10 space-y-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start justify-between gap-6 py-5 first:pt-0 last:pb-0">
                <div className="space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-[hsl(var(--rule))]" />
                  <div className="h-3.5 w-64 animate-pulse rounded bg-[hsl(var(--rule))]" />
                </div>
                <div className="h-[22px] w-[40px] shrink-0 animate-pulse rounded-full bg-[hsl(var(--rule))]" />
              </div>
            ))}
          </div>
        ) : (
          <ul className="mt-10 divide-y divide-[hsl(var(--rule))]">
            {NOTIFICATION_PREFS.map((pref) => (
              <li
                key={pref.id}
                className="flex items-start justify-between gap-6 py-5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-[hsl(var(--ink))]">
                    {pref.label}
                  </p>
                  <p className="mt-1 text-[12.5px] leading-[1.55] text-[hsl(var(--ink-muted))]">
                    {pref.description}
                  </p>
                </div>
                <Toggle
                  on={prefs[pref.id]}
                  onToggle={() => toggle(pref.id)}
                  label={pref.label}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

// ─── Security ───────────────────────────────────────────────────

interface ActiveSession {
  id: string;
  device: string;
  deviceType: "desktop" | "mobile" | "tablet";
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

const MOCK_SESSIONS: ActiveSession[] = [
  {
    id: "sess_01",
    device: "Chrome on macOS",
    deviceType: "desktop",
    location: "San Francisco, CA",
    lastActive: "Active now",
    isCurrent: true,
  },
  {
    id: "sess_02",
    device: "Safari on iPhone",
    deviceType: "mobile",
    location: "San Francisco, CA",
    lastActive: "2 hours ago",
    isCurrent: false,
  },
  {
    id: "sess_03",
    device: "Firefox on Windows",
    deviceType: "desktop",
    location: "New York, NY",
    lastActive: "3 days ago",
    isCurrent: false,
  },
];

const DEVICE_ICONS: Record<ActiveSession["deviceType"], React.ReactNode> = {
  desktop: <Monitor size={14} strokeWidth={1.6} />,
  mobile: <Smartphone size={14} strokeWidth={1.6} />,
  tablet: <Smartphone size={14} strokeWidth={1.6} />,
};

function SecurityCard() {
  const toast = useToast();

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(true);
  const [twoFactorSetupOpen, setTwoFactorSetupOpen] = useState(false);
  const [twoFactorDisableOpen, setTwoFactorDisableOpen] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<ActiveSession[]>(MOCK_SESSIONS);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ActiveSession | null>(null);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    // TODO: wire to backend — GET /settings/security
    const timer = setTimeout(() => {
      setTwoFactorLoading(false);
      setSessionsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const toggleTwoFactor = () => {
    if (twoFactorEnabled) {
      setTwoFactorDisableOpen(true);
    } else {
      setTwoFactorSetupOpen(true);
    }
  };

  const enableTwoFactor = () => {
    // TODO: wire to backend — POST /settings/security/2fa/enable
    setTwoFactorEnabled(true);
    setTwoFactorSetupOpen(false);
    toast.show("Two-factor authentication enabled.");
  };

  const disableTwoFactor = () => {
    // TODO: wire to backend — POST /settings/security/2fa/disable
    setTwoFactorEnabled(false);
    setTwoFactorDisableOpen(false);
    toast.show("Two-factor authentication disabled.");
  };

  const revokeSession = async (session: ActiveSession) => {
    setRevoking(true);
    // TODO: wire to backend — DELETE /settings/security/sessions/{session.id}
    await new Promise((r) => setTimeout(r, 600));
    setSessions((prev) => prev.filter((s) => s.id !== session.id));
    setRevokeTarget(null);
    setRevoking(false);
    toast.show(`Session on ${session.device} revoked.`);
  };

  return (
    <>
      <Card>
        <div className="px-8 py-10 md:px-11 md:py-12">
          <SectionHeader
            icon={<Shield size={16} strokeWidth={1.6} aria-hidden="true" />}
            eyebrow="Security"
            title="Keep your account safe."
            description="Manage two-factor authentication and review your active sessions."
          />

          {/* 2FA section */}
          <div className="mt-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--ink-subtle))]">
              Two-factor authentication
            </p>

            {twoFactorLoading ? (
              <div className="mt-4 flex items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="h-4 w-56 animate-pulse rounded bg-[hsl(var(--rule))]" />
                  <div className="h-3.5 w-72 animate-pulse rounded bg-[hsl(var(--rule))]" />
                </div>
                <div className="h-[22px] w-[40px] shrink-0 animate-pulse rounded-full bg-[hsl(var(--rule))]" />
              </div>
            ) : (
              <div className="mt-4 flex items-center justify-between gap-6">
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-[hsl(var(--ink))]">
                    {twoFactorEnabled ? "Enabled" : "Disabled"}
                  </p>
                  <p className="mt-1 text-[12.5px] leading-[1.55] text-[hsl(var(--ink-muted))]">
                    {twoFactorEnabled
                      ? "Extra verification is required when you sign in from a new device."
                      : "Add an extra layer of security to your account."}
                  </p>
                </div>
                <Toggle
                  on={twoFactorEnabled}
                  onToggle={toggleTwoFactor}
                  label="Two-factor authentication"
                />
              </div>
            )}
          </div>

          {/* Active sessions */}
          <div className="mt-10 border-t border-[hsl(var(--rule))] pt-8">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--ink-subtle))]">
              Active sessions
            </p>

            {sessionsError && (
              <div className="mt-4 rounded-2xl border border-[hsl(var(--danger))]/20 bg-[hsl(var(--danger))]/5 px-5 py-4 text-[13px] text-[hsl(var(--danger))]">
                {sessionsError}
              </div>
            )}

            {sessionsLoading ? (
              <div className="mt-5 space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between gap-4 rounded-2xl border border-[hsl(var(--rule))] p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 animate-pulse rounded-full bg-[hsl(var(--rule))]" />
                      <div className="space-y-2">
                        <div className="h-4 w-40 animate-pulse rounded bg-[hsl(var(--rule))]" />
                        <div className="h-3 w-28 animate-pulse rounded bg-[hsl(var(--rule))]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <p className="mt-5 text-[13px] text-[hsl(var(--ink-subtle))]">
                No active sessions.
              </p>
            ) : (
              <ul className="mt-5 space-y-3">
                {sessions.map((session) => (
                  <li
                    key={session.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-[hsl(var(--rule))] p-4 transition-colors duration-300 hover:border-[hsl(var(--rule-strong))]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--page))] text-[hsl(var(--ink-muted))] ring-1 ring-[hsl(var(--rule))]">
                        {DEVICE_ICONS[session.deviceType]}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13.5px] font-medium text-[hsl(var(--ink))] truncate">
                            {session.device}
                          </p>
                          {session.isCurrent && (
                            <Pill tone="ink" size="sm">
                              This device
                            </Pill>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[12px] text-[hsl(var(--ink-subtle))]">
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={10} strokeWidth={1.6} />
                            {session.location}
                          </span>
                          <span aria-hidden="true">&middot;</span>
                          <span>{session.lastActive}</span>
                        </div>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRevokeTarget(session)}
                      >
                        Revoke
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>

      {/* 2FA setup modal */}
      <Modal
        open={twoFactorSetupOpen}
        onClose={() => setTwoFactorSetupOpen(false)}
        title="Enable two-factor authentication"
        description="You'll be asked for a verification code when signing in from a new device. This adds an extra layer of protection to your account."
        size="sm"
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-[hsl(var(--rule))] bg-[hsl(var(--page))] p-5 text-center">
            <p className="text-[12.5px] text-[hsl(var(--ink-subtle))]">
              Scan this QR code with your authenticator app, then enter the verification code below.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setTwoFactorSetupOpen(false)}>
              Cancel
            </Button>
            <Button onClick={enableTwoFactor} trailingArrow>
              Enable 2FA
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2FA disable confirmation */}
      <Modal
        open={twoFactorDisableOpen}
        onClose={() => setTwoFactorDisableOpen(false)}
        title="Disable two-factor authentication?"
        description="Your account will no longer require a verification code when signing in from new devices. This reduces your account security."
        size="sm"
      >
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={() => setTwoFactorDisableOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={disableTwoFactor}>
            Disable 2FA
          </Button>
        </div>
      </Modal>

      {/* Revoke session confirmation */}
      <Modal
        open={revokeTarget !== null}
        onClose={() => setRevokeTarget(null)}
        title="Revoke this session?"
        description={
          revokeTarget
            ? `This will sign out ${revokeTarget.device} in ${revokeTarget.location}. You'll need to sign in again.`
            : undefined
        }
        size="sm"
      >
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={() => setRevokeTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => revokeTarget && revokeSession(revokeTarget)}
            loading={revoking}
          >
            Revoke session
          </Button>
        </div>
      </Modal>
    </>
  );
}

// ─── Danger Zone ────────────────────────────────────────────────

function DangerZoneCard() {
  const toast = useToast();
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteInputRef = useRef<HTMLInputElement>(null);

  const deactivateAccount = async () => {
    setDeactivating(true);
    // TODO: wire to backend — POST /settings/account/deactivate
    await new Promise((r) => setTimeout(r, 800));
    toast.show("Account deactivated.", "Your page is now offline. You can reactivate by signing back in.");
    setDeactivating(false);
    setDeactivateOpen(false);
    signOut();
    window.location.href = "/";
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== "delete") return;
    setDeleting(true);
    // TODO: wire to backend — DELETE /settings/account
    await new Promise((r) => setTimeout(r, 1000));
    toast.show("Account deleted.");
    setDeleting(false);
    setDeleteOpen(false);
    signOut();
    window.location.href = "/";
  };

  const closeDeleteModal = () => {
    setDeleteOpen(false);
    setDeleteConfirm("");
    setDeleting(false);
  };

  return (
    <>
      <Card variant="dark">
        <div className="px-8 py-10 md:px-11 md:py-12">
          <div className="flex items-start gap-4">
            <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--page))]/10 text-[hsl(var(--page))]/70 ring-1 ring-[hsl(var(--page))]/15">
              <AlertTriangle size={16} strokeWidth={1.6} aria-hidden="true" />
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
                These actions are permanent and cannot be undone. Please read carefully.
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-0 divide-y divide-[hsl(var(--page))]/10">
            {/* Deactivate */}
            <div className="flex items-center justify-between gap-6 py-5 first:pt-0">
              <div className="flex items-start gap-4">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--page))]/10 text-[hsl(var(--page))]/60 ring-1 ring-[hsl(var(--page))]/10">
                  <LogOut size={14} strokeWidth={1.6} />
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-[hsl(var(--page))]">
                    Deactivate account
                  </p>
                  <p className="mt-1 text-[12.5px] leading-[1.55] text-[hsl(var(--page))]/60">
                    Temporarily take your page offline. You can reactivate anytime by signing back in.
                  </p>
                </div>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeactivateOpen(true)}
              >
                Deactivate
              </Button>
            </div>

            {/* Delete */}
            <div className="flex items-center justify-between gap-6 py-5 last:pb-0">
              <div className="flex items-start gap-4">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--page))]/10 text-[hsl(var(--page))]/60 ring-1 ring-[hsl(var(--page))]/10">
                  <Trash2 size={14} strokeWidth={1.6} />
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-[hsl(var(--page))]">
                    Delete account permanently
                  </p>
                  <p className="mt-1 text-[12.5px] leading-[1.55] text-[hsl(var(--page))]/60">
                    Permanently remove your account, profile, request history, and all associated data. This action is irreversible.
                  </p>
                </div>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Deactivate confirmation modal */}
      <Modal
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        title="Deactivate your account?"
        description="Your page will go offline and won't be accessible to anyone. You can reactivate anytime by signing back in with your email. No data will be lost."
        size="sm"
      >
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeactivateOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={deactivateAccount}
            loading={deactivating}
          >
            Deactivate
          </Button>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteOpen}
        onClose={closeDeleteModal}
        title="Delete your account?"
        description="This will permanently remove your profile, request history, earnings, connected accounts, and all associated data. This action cannot be undone."
        size="sm"
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-[hsl(var(--danger))]/20 bg-[hsl(var(--danger))]/[0.03] px-5 py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[hsl(var(--danger))]" strokeWidth={1.6} />
              <p className="text-[13px] leading-[1.6] text-[hsl(var(--danger))]">
                This is permanent. Once deleted, your account and all data cannot be recovered.
              </p>
            </div>
          </div>
          <div>
            <Label>Type "delete" to confirm</Label>
            <input
              ref={deleteInputRef}
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
              onClick={deleteAccount}
              disabled={deleteConfirm !== "delete"}
              loading={deleting}
            >
              Delete account
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
