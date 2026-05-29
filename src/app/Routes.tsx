import { useEffect } from "react";
import { match, useRouter } from "./router";
import { useAccount, useProfile } from "./store/session";
import { isHandleValid, RESERVED } from "./store/format";

import { StepHandle } from "./screens/Onboarding/StepHandle";
import { StepIdentity } from "./screens/Onboarding/StepIdentity";
import { StepFloor } from "./screens/Onboarding/StepFloor";
import { StepCategories } from "./screens/Onboarding/StepCategories";
import { StepVisibility } from "./screens/Onboarding/StepVisibility";
import { StepFinish } from "./screens/Onboarding/StepFinish";

import { DashboardShell } from "./screens/Dashboard/DashboardShell";
import { Overview } from "./screens/Dashboard/Overview";
import { Received } from "./screens/Dashboard/Received";
import { RequestDetail } from "./screens/Dashboard/RequestDetail";
import { Sent } from "./screens/Dashboard/Sent";
import { SentDetail } from "./screens/Dashboard/SentDetail";
import { MyPage } from "./screens/Dashboard/MyPage";
import { Settings } from "./screens/Dashboard/Settings";

import { Login } from "./screens/Auth/Login";
import { Find } from "./screens/Find/Find";
import { PublicProfile } from "./screens/Public/PublicProfile";
import { SendRequest } from "./screens/Send/SendRequest";

import { LandingApp } from "./LandingApp";

/**
 * Routes — the single dispatch surface the app renders.
 *
 * Order matters:
 *   1. Static, app-owned paths (claim, login, dashboard, find).
 *   2. Public profile and its send flow at /:handle and /:handle/send.
 *   3. Fallback to landing for the root.
 */
export function Routes() {
  const { path, navigate } = useRouter();
  const account = useAccount();
  const profile = useProfile();

  // A returning, fully onboarded person should never be sent
  // back through the front door. /login and /claim become quiet
  // redirects to their dashboard.
  useEffect(() => {
    if (!account || !profile) return;
    if (path === "/login" || path === "/claim") {
      navigate("/dashboard", { replace: true });
    }
  }, [path, account, profile, navigate]);

  // ─── Static, app-owned routes ─────────────────────────────────────

  if (path === "/" || path === "") {
    return <LandingApp />;
  }

  if (path === "/login") return <Login />;

  if (path === "/find") return <Find />;

  if (path === "/claim") return <StepHandle />;
  if (path === "/claim/identity") return <StepIdentity />;
  if (path === "/claim/floor") return <StepFloor />;
  if (path === "/claim/categories") return <StepCategories />;
  if (path === "/claim/visibility") return <StepVisibility />;
  if (path === "/claim/finish") return <StepFinish />;

  if (path.startsWith("/dashboard")) {
    return <DashboardRoutes path={path} hasProfile={Boolean(profile)} hasAccount={Boolean(account)} />;
  }

  // ─── Dynamic routes — /:handle and /:handle/send ──────────────────

  const sendMatch = match("/:handle/send", path);
  if (sendMatch) {
    const handle = sendMatch.handle;
    if (RESERVED.includes(handle)) return <NotFound />;
    return <SendRequest handle={handle} />;
  }

  const handleMatch = match("/:handle", path);
  if (handleMatch) {
    const handle = handleMatch.handle;
    if (RESERVED.includes(handle)) return <NotFound />;
    if (!isHandleValid(handle)) return <NotFound />;
    return <PublicProfile handle={handle} />;
  }

  return <NotFound />;
}

function DashboardRoutes({
  path,
  hasProfile,
  hasAccount,
}: {
  path: string;
  hasProfile: boolean;
  hasAccount: boolean;
}) {
  const { navigate } = useRouter();

  // If no account or no profile, kick them to the right resume point.
  useEffect(() => {
    if (!hasAccount) {
      navigate("/login", { replace: true });
    } else if (!hasProfile) {
      navigate("/claim", { replace: true });
    }
  }, [hasAccount, hasProfile, navigate]);

  if (!hasAccount || !hasProfile) return null;

  // Detail routes within dashboard.
  const recvDetail = match("/dashboard/received/:id", path);
  if (recvDetail) {
    return (
      <DashboardShell
        title={
          <>
            A serious{" "}
            <span className="italic text-[hsl(var(--ink-subtle))]">request</span>.
          </>
        }
      >
        <RequestDetail id={recvDetail.id} />
      </DashboardShell>
    );
  }

  const sentDetail = match("/dashboard/sent/:id", path);
  if (sentDetail) {
    return (
      <DashboardShell
        title={
          <>
            What you{" "}
            <span className="italic text-[hsl(var(--ink-subtle))]">asked</span>.
          </>
        }
      >
        <SentDetail id={sentDetail.id} />
      </DashboardShell>
    );
  }

  if (path === "/dashboard/received") {
    return (
      <DashboardShell
        title={
          <>
            Your inbox,{" "}
            <span className="italic text-[hsl(var(--ink-subtle))]">on your terms</span>.
          </>
        }
        description="Reply releases the amount. Decline refunds it. Do nothing and it expires after seven days."
      >
        <Received />
      </DashboardShell>
    );
  }

  if (path === "/dashboard/sent") {
    return (
      <DashboardShell
        title={
          <>
            What you've{" "}
            <span className="italic text-[hsl(var(--ink-subtle))]">sent</span>.
          </>
        }
        description="Every request you've made from this account, and the state of every amount."
      >
        <Sent />
      </DashboardShell>
    );
  }

  if (path === "/dashboard/page") {
    return (
      <DashboardShell
        title={
          <>
            Your{" "}
            <span className="italic text-[hsl(var(--ink-subtle))]">public</span> page.
          </>
        }
        description="What senders see before they reach out — and the rules that decide who gets through."
      >
        <MyPage />
      </DashboardShell>
    );
  }

  if (path === "/dashboard/settings") {
    return (
      <DashboardShell
        title={
          <>
            <span className="italic text-[hsl(var(--ink-subtle))]">Settings</span>.
          </>
        }
        description="Account, notifications, and session controls."
      >
        <Settings />
      </DashboardShell>
    );
  }

  // Default — overview.
  return (
    <DashboardShell
      title={
        <>
          Your inbox,{" "}
          <span className="italic text-[hsl(var(--ink-subtle))]">on your terms</span>.
        </>
      }
      description="A daily look at what's arrived, what you've replied to, and what's still in escrow."
    >
      <Overview />
    </DashboardShell>
  );
}

function NotFound() {
  const { navigate } = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--page))] px-6 text-center text-[hsl(var(--ink))]">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
          Lost
        </p>
        <h1
          className="mt-5 font-serif"
          style={{
            fontSize: "clamp(2.4rem, 6vw, 4rem)",
            fontWeight: 500,
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
          }}
        >
          That page doesn't exist.
        </h1>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--ink))] px-6 py-3 text-[14px] font-medium text-[hsl(var(--page))] transition-colors duration-300 hover:bg-[hsl(var(--ink))]/92"
        >
          Take me home
        </button>
      </div>
    </div>
  );
}
