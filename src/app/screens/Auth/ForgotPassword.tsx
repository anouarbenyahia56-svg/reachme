import { useState } from "react";
import { AppHeader } from "../../ui/AppHeader";
import { TextField } from "../../ui/Field";
import { Button } from "../../ui/Button";
import { Reveal } from "../../ui/Reveal";
import { Link } from "../../router";

/**
 * Forgot password.
 *
 * The user enters their email. In production, the server sends
 * a reset link. The frontend shows a confirmation screen after
 * submission so the user knows the email was sent.
 */
export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const sendReset = async () => {
    if (!valid) return;
    setSubmitting(true);
    // TODO: wire to backend — POST /auth/forgot-password { email }
    await new Promise((r) => setTimeout(r, 500));
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--page))] text-[hsl(var(--ink))]">
      <AppHeader variant="marketing" />
      <main className="mx-auto flex min-h-[calc(100vh-68px)] max-w-[1100px] items-center justify-center px-6 py-16 md:px-10">
        <div className="grid w-full max-w-[820px] items-center gap-16 lg:grid-cols-2">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
              Reset your password
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
              Forgot your <span className="italic">password</span>?
            </h1>
            <p className="mt-7 max-w-[44ch] text-[hsl(var(--ink-muted))]">
              Enter the email address associated with your account and we'll
              send you a link to reset your password.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="rounded-3xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] px-7 py-8 sm:px-9 sm:py-10">
              {submitted ? (
                <div>
                  <p className="text-[14px] leading-[1.55] text-[hsl(var(--ink))]">
                    Check your inbox.
                  </p>
                  <p className="mt-3 text-[13px] leading-[1.55] text-[hsl(var(--ink-muted))]">
                    We sent a password reset link to{" "}
                    <span className="text-[hsl(var(--ink))]">{email}</span>.
                    Follow the link to set a new password.
                  </p>
                  <div className="mt-8">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 text-[13px] text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
                    >
                      Back to log in
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && valid && !submitting) sendReset();
                    }}
                  />
                  <div className="mt-6 space-y-3">
                    <Button
                      size="lg"
                      trailingArrow
                      disabled={!valid}
                      loading={submitting}
                      onClick={sendReset}
                      className="w-full"
                    >
                      Send reset link
                    </Button>
                    <p className="text-center text-[12.5px] text-[hsl(var(--ink-subtle))]">
                      Remember your password?{" "}
                      <Link
                        href="/login"
                        className="text-[hsl(var(--ink))] underline-offset-4 hover:underline"
                      >
                        Log in
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </main>
    </div>
  );
}
