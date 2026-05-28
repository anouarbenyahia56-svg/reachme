"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppNav } from "@/components/AppNav";
import { Button, GhostButton } from "@/components/Button";
import {
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@/components/Field";
import {
  Screen,
  ScreenEyebrow,
  ScreenLede,
  ScreenTitle,
} from "@/components/Screen";
import { useStore } from "@/lib/session";

/**
 * Log in — for returning users with an existing handle.
 *
 * One field, one button. Same magic-link mechanic as the claim flow,
 * but framed as "welcome back" rather than "claim". When email is
 * unrecognised, the store throws and we surface a quiet inline error
 * that points back to /claim.
 */
export function LoginScreen() {
  const router = useRouter();
  const { store } = useStore();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Enter a valid email so we can send your sign-in link.");
      return;
    }
    setSubmitting(true);
    try {
      const { token } = await store.beginSignIn(trimmed);
      router.push(
        `/claim/check-email?e=${encodeURIComponent(trimmed)}&t=${encodeURIComponent(token)}`,
      );
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <>
      <AppNav />
      <Screen>
        <div className="flex flex-col gap-3">
          <ScreenEyebrow>Log in</ScreenEyebrow>
          <ScreenTitle>Welcome back.</ScreenTitle>
          <ScreenLede>
            Enter the email tied to your ReachMe page. We’ll send you a
            sign-in link — no password to remember.
          </ScreenLede>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-12">
          <FieldGroup>
            <div>
              <FieldLabel htmlFor="login-email">Your email</FieldLabel>
              <Input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                spellCheck={false}
                autoFocus
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                invalid={!!error}
              />
              <FieldError>{error}</FieldError>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
              <Button
                type="submit"
                loading={submitting}
                disabled={!email.trim() || submitting}
              >
                {submitting ? "Sending…" : "Send sign-in link"}
              </Button>
              <Link href="/claim">
                <GhostButton type="button">
                  Don’t have a page yet? Claim a handle →
                </GhostButton>
              </Link>
            </div>
          </FieldGroup>
        </form>
      </Screen>
    </>
  );
}
