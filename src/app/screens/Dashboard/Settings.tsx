import { useEffect, useState } from "react";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { Modal } from "../../ui/Modal";
import { TextField, Label } from "../../ui/Field";
import { setAccount, signOut, useAccount } from "../../store/session";
import { useToast } from "../../ui/Toast";
import { cn } from "@/lib/utils";

/**
 * Settings — email & session on the left, notifications on the right.
 */
export function Settings() {
  const account = useAccount();
  const toast = useToast();

  const [email, setEmail] = useState(account?.email ?? "");
  const [hydrated, setHydrated] = useState(Boolean(account));
  const [signoutOpen, setSignoutOpen] = useState(false);

  // Seed the form field once, the moment the account record
  // becomes available. After that, the user is in control of the
  // input — we never overwrite mid-edit.
  useEffect(() => {
    if (!hydrated && account) {
      setEmail(account.email);
      setHydrated(true);
    }
  }, [account, hydrated]);

  if (!account) return null;

  const dirty = account.email !== email.trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const save = () => {
    if (!validEmail) return toast.show("Add a valid email.");
    setAccount({ ...account, email: email.trim() });
    toast.show("Account updated.");
  };

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <Card className="lg:col-span-7">
        <div className="px-8 py-10 md:px-11 md:py-12">
          <div className="flex flex-col gap-16">
            <div>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                errorText={!validEmail && email ? "Add a valid email." : undefined}
              />
              <div className="mt-6 flex items-center gap-3">
                <Button onClick={save} disabled={!dirty || !validEmail} trailingArrow>
                  Save changes
                </Button>
                {dirty && (
                  <Button
                    variant="ghost"
                    onClick={() => setEmail(account.email)}
                  >
                    Discard
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label>Session</Label>
              <p className="mt-3 text-[13.5px] text-[hsl(var(--ink-muted))]">
                Your page stays live.
              </p>
              <div className="mt-6">
                <Button variant="outline" onClick={() => setSignoutOpen(true)}>
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="lg:col-span-5">
        <div className="px-8 py-10 md:px-11 md:py-12">
          <Label>Notifications</Label>
          <p className="mt-3 text-[13.5px] text-[hsl(var(--ink-muted))]">
            Pick what reaches your inbox.
          </p>
          <ul className="mt-8">
            <Toggle label="A serious request arrives" defaultOn />
            <Toggle label="A reply window is about to close" defaultOn />
            <Toggle label="A request expires and refunds" defaultOn />
          </ul>
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

function Toggle({ label, defaultOn }: { label: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <li className="flex items-center justify-between gap-4 py-3.5">
      <span className="text-[13.5px] text-[hsl(var(--ink))]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => setOn((v) => !v)}
        className={cn(
          "relative inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer rounded-full transition-colors duration-300",
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
