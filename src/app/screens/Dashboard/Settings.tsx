import { useEffect, useState } from "react";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { Modal } from "../../ui/Modal";
import { TextField, Label } from "../../ui/Field";
import { setAccount, signOut, useAccount, useProfile } from "../../store/session";
import { useToast } from "../../ui/Toast";

/**
 * Settings — account, notifications, danger zone.
 *
 * Notification preferences default to the right thing (only when
 * something serious happens) so this page is mostly an honest
 * disclosure of what's already true.
 */
export function Settings() {
  const account = useAccount();
  const profile = useProfile();
  const toast = useToast();

  const [displayName, setDisplayName] = useState(account?.displayName ?? "");
  const [email, setEmail] = useState(account?.email ?? "");
  const [hydrated, setHydrated] = useState(Boolean(account));
  const [signoutOpen, setSignoutOpen] = useState(false);

  // Seed the form fields once, the moment the account record
  // becomes available. After that, the user is in control of the
  // inputs — we never overwrite mid-edit.
  useEffect(() => {
    if (!hydrated && account) {
      setDisplayName(account.displayName);
      setEmail(account.email);
      setHydrated(true);
    }
  }, [account, hydrated]);

  if (!account) return null;

  const dirty =
    account.displayName !== displayName.trim() ||
    account.email !== email.trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const save = () => {
    if (!validEmail) return toast.show("Add a valid email.");
    setAccount({ ...account, displayName: displayName.trim(), email: email.trim() });
    toast.show("Account updated.");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <Card className="lg:col-span-8">
        <div className="border-b border-[hsl(var(--rule))] px-7 py-5 md:px-9">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
            Account
          </p>
          <p className="mt-1 text-[14px] font-medium text-[hsl(var(--ink))]">
            Used to sign in and receive request notifications.
          </p>
        </div>
        <div className="space-y-5 px-7 py-7 md:px-9 md:py-8">
          <TextField
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            helper="Used in your dashboard and notifications. Your public page name lives in My page."
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            errorText={!validEmail && email ? "Add a valid email." : undefined}
          />
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={save} disabled={!dirty || !validEmail} trailingArrow>
              Save changes
            </Button>
            {dirty && (
              <Button
                variant="ghost"
                onClick={() => {
                  setDisplayName(account.displayName);
                  setEmail(account.email);
                }}
              >
                Discard
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="lg:col-span-4">
        <div className="border-b border-[hsl(var(--rule))] px-7 py-5 md:px-9">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
            Notifications
          </p>
          <p className="mt-1 text-[14px] font-medium text-[hsl(var(--ink))]">
            We email you only when something important happens.
          </p>
        </div>
        <ul className="space-y-1 px-7 py-7 md:px-9 md:py-8">
          <Note label="A new serious request arrives" status="On" />
          <Note label="A reply window is about to close" status="On" />
          <Note label="A request expires and refunds" status="On" />
          <Note label="Marketing or product newsletters" status="Off" />
        </ul>
      </Card>

      <Card className="lg:col-span-12">
        <div className="border-b border-[hsl(var(--rule))] px-7 py-5 md:px-9">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
            Session
          </p>
          <p className="mt-1 text-[14px] font-medium text-[hsl(var(--ink))]">
            Sign out of this device.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 px-7 py-7 md:px-9 md:py-8">
          <p className="max-w-[60ch] text-[13.5px] leading-[1.6] text-[hsl(var(--ink-muted))]">
            Signing out clears your local ReachMe session on this browser.
            Your page{profile ? ` (reachme.com/${profile.handle}) ` : " "}
            and all your data stay safe.
          </p>
          <Button variant="outline" onClick={() => setSignoutOpen(true)}>
            Sign out
          </Button>
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
    </div>
  );
}

function Note({ label, status }: { label: string; status: "On" | "Off" }) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-[hsl(var(--rule))] py-3 last:border-b-0">
      <span className="text-[13.5px] text-[hsl(var(--ink))]">{label}</span>
      <span
        className={
          status === "On"
            ? "text-[12px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--ink))]"
            : "text-[12px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--ink-subtle))]"
        }
      >
        {status}
      </span>
    </li>
  );
}
