import { useState } from "react";
import { AppHeader } from "../../ui/AppHeader";
import { TextField } from "../../ui/Field";
import { Button } from "../../ui/Button";
import { Reveal } from "../../ui/Reveal";
import { Link, useRouter } from "../../router";
import { setAccount, useAccount } from "../../store/session";

/**
 * Login.
 *
 * The signal-only auth surface for now: enter your email, we sign
 * you back in. When real auth lands, this file becomes the magic
 * link / SSO client — same shape, same copy, same easing.
 *
 * If a profile already exists for this device, the email simply
 * confirms identity. If not, we route them through onboarding.
 */
export function Login() {
  const account = useAccount();
  const { navigate } = useRouter();
  const [email, setEmail] = useState(account?.email ?? "");
  const [submitting, setSubmitting] = useState(false);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const continueIn = async () => {
    if (!valid) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));
    setAccount({
      email,
      displayName: account?.displayName ?? email.split("@")[0],
      hasProfile: account?.hasProfile ?? false,
    });
    if (account?.hasProfile) {
      navigate("/dashboard");
    } else {
      navigate("/claim");
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--page))] text-[hsl(var(--ink))]">
      <AppHeader variant="marketing" />
      <main className="mx-auto flex min-h-[calc(100vh-68px)] max-w-[1100px] items-center justify-center px-6 py-16 md:px-10">
        <div className="grid w-full max-w-[820px] items-center gap-16 lg:grid-cols-2">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
              Welcome back
            </p>
            <h1
              className="mt-5 font-serif text-[hsl(var(--ink))]"
              style={{
                fontSize: "clamp(2.4rem, 6vw, 4rem)",
                fontWeight: 500,
                lineHeight: 1.02,
                letterSpacing: "-0.04em",
                textWrap: "balance",
              }}
            >
              Log in to <span className="italic">ReachMe</span>.
            </h1>
            <p className="mt-7 max-w-[44ch] text-[hsl(var(--ink-muted))]">
              Return to your page, your inbox, and your account. We'll send a
              one-time link to your email.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="rounded-3xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] px-7 py-8 sm:px-9 sm:py-10">
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && valid && !submitting) continueIn();
                }}
              />
              <div className="mt-6 space-y-3">
                <Button
                  size="lg"
                  trailingArrow
                  disabled={!valid}
                  loading={submitting}
                  onClick={continueIn}
                  className="w-full"
                >
                  Continue
                </Button>
                <p className="text-center text-[12.5px] text-[hsl(var(--ink-subtle))]">
                  No account yet?{" "}
                  <Link
                    href="/claim"
                    className="text-[hsl(var(--ink))] underline-offset-4 hover:underline"
                  >
                    Claim your handle
                  </Link>
                  .
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </main>
    </div>
  );
}
