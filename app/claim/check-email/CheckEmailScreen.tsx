"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppNav } from "@/components/AppNav";
import { Button, GhostButton } from "@/components/Button";
import {
  Screen,
  ScreenEyebrow,
  ScreenLede,
  ScreenTitle,
} from "@/components/Screen";

/**
 * Check-email screen.
 *
 * The user has confirmed their handle and entered their email; we have
 * just dispatched a magic-link request through the store. This screen
 * is the calm waiting room: it tells them what happened, gives them a
 * way back, and — until real email is wired — exposes the verify link
 * directly so the local flow remains complete.
 *
 * The dev-mode "Open sign-in link" button reads the token from the
 * URL the previous step set. When real email lands, the token vanishes
 * from the URL entirely and only the inbox-instructions remain.
 */
export function CheckEmailScreen() {
  return (
    <Suspense fallback={null}>
      <CheckEmailInner />
    </Suspense>
  );
}

function CheckEmailInner() {
  const params = useSearchParams();
  const handle = params.get("h") ?? "";
  const email = params.get("e") ?? "";
  const token = params.get("t") ?? "";

  return (
    <>
      <AppNav />
      <Screen>
        <div className="flex flex-col gap-3">
          <ScreenEyebrow>Step 03 · Check your inbox</ScreenEyebrow>
          <ScreenTitle>One link away.</ScreenTitle>
          <ScreenLede>
            We sent a sign-in link to{" "}
            <span className="text-[hsl(var(--ink))]">{email || "your email"}</span>
            . Click it to claim{" "}
            <span className="text-[hsl(var(--ink))]">
              reachme.com/{handle || "yourhandle"}
            </span>{" "}
            and set up your page.
          </ScreenLede>
        </div>

        <div className="mt-12 flex flex-col gap-7">
          {/* Local-development shortcut. Delete this block when real
              email is wired up — the rest of the page already works
              for production users who actually receive the email. */}
          {token ? (
            <div
              className="flex flex-col gap-4 rounded-2xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] p-7"
              role="region"
              aria-label="Local development shortcut"
            >
              <p
                className="text-[hsl(var(--ink-muted))]"
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 500,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                Local development
              </p>
              <p
                className="text-[hsl(var(--ink-muted))]"
                style={{ fontSize: "0.95rem", lineHeight: 1.55 }}
              >
                Email isn’t wired yet. Use this link to continue locally.
              </p>
              <div>
                <Link href={`/auth/verify?token=${encodeURIComponent(token)}`}>
                  <Button trailingArrow>Open sign-in link</Button>
                </Link>
              </div>
            </div>
          ) : null}

          <p
            className="max-w-[44ch] text-[hsl(var(--ink-muted))]"
            style={{ fontSize: "0.95rem", lineHeight: 1.55 }}
          >
            The link expires in 15 minutes. Didn’t see it? Check your spam
            folder or send a new one.
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/claim">
              <GhostButton type="button">← Use a different email</GhostButton>
            </Link>
          </div>
        </div>
      </Screen>
    </>
  );
}
