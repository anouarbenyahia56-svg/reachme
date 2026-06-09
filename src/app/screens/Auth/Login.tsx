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
 * Email + password authentication. The user enters their
 * credentials and clicks "Log in." A real backend validates
 * the password and returns a session token; the frontend
 * stubs this with a short delay.
 *
 * "Forgot password?" routes to a separate page. Social
 * login (Google / Apple) will be added after the backend
 * ships.
 */
export function Login() {
  const account = useAccount();
  const { navigate } = useRouter();
  const [email, setEmail] = useState(account?.email ?? "");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = validEmail && password.length > 0 && !submitting;

  const logIn = async () => {
    if (!canSubmit) return;
    setError("");
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));

    // TODO: wire to backend — POST /auth/login { email, password }
    // For now, accept any non-empty password.
    setAccount({
      email,
      hasProfile: account?.hasProfile ?? false,
      hasPassword: true,
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
              Enter your email and password to access your page, inbox, and
              account.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="rounded-3xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] px-7 py-8 sm:px-9 sm:py-10">
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="you@example.com"
                autoFocus
              />
              <div className="mt-5">
                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canSubmit) logIn();
                  }}
                />
              </div>

              {error && (
                <p className="mt-3 text-[12.5px] leading-[1.55] text-[hsl(var(--danger))]">
                  {error}
                </p>
              )}

              <div className="mt-3">
                <Link
                  href="/forgot-password"
                  className="text-[12.5px] text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="mt-6 space-y-3">
                <Button
                  size="lg"
                  trailingArrow
                  disabled={!canSubmit}
                  loading={submitting}
                  onClick={logIn}
                  className="w-full"
                >
                  Log in
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
