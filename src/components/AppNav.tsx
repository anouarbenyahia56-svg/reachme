"use client";

import Link from "next/link";
import { Wordmark } from "./Wordmark";
import { useSession, useStore } from "@/lib/session";

/**
 * Authenticated app nav.
 *
 * The marketing nav (`<Nav />`) only ships on the landing. Every other
 * screen — claim, auth, dashboard, settings, public profile (when
 * signed in) — uses this minimal app shell.
 *
 * Wordmark is identical. Right-side links resolve from session state:
 *   • anonymous   → Log in
 *   • authenticated → Inbox · Sign out
 */
export function AppNav() {
  const session = useSession();
  const { signOut } = useStore();

  const handle =
    session.status === "authenticated" ? session.session.handle : null;

  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-[hsl(var(--page)/0.78)] backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-6 md:px-10">
        <Link
          href="/"
          aria-label="ReachMe — home"
          className="-mx-1 rounded-sm px-1"
        >
          <Wordmark />
        </Link>

        <nav aria-label="Account" className="flex items-center gap-6">
          {session.status === "loading" ? (
            // Reserve the same width as the resolved state so the
            // header doesn't shift when auth resolves.
            <span aria-hidden="true" className="h-5 w-[120px]" />
          ) : session.status === "authenticated" ? (
            <>
              {handle ? (
                <Link
                  href={`/${handle}`}
                  className="hidden text-[12.5px] tracking-[-0.005em] text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))] sm:block"
                >
                  /{handle}
                </Link>
              ) : null}
              <Link
                href="/inbox"
                className="text-[12.5px] tracking-[-0.005em] text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
              >
                Inbox
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="text-[11.5px] tracking-[0.005em] text-[hsl(var(--ink-subtle))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-[12.5px] tracking-[-0.005em] text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
