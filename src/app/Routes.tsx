import { memo, useEffect, type ReactNode } from "react";
import { match, useRouter } from "./router";
import { useAccount, useProfile } from "./store/session";
import { isHandleValid, RESERVED } from "./store/format";

import { StepHandle } from "./screens/Onboarding/StepHandle";
import { StepEmail } from "./screens/Onboarding/StepEmail";
import { StepIdentity } from "./screens/Onboarding/StepIdentity";
import { StepFloor } from "./screens/Onboarding/StepFloor";
import { StepCategories } from "./screens/Onboarding/StepCategories";
import { StepSocials } from "./screens/Onboarding/StepSocials";
import { StepVisibility } from "./screens/Onboarding/StepVisibility";
import { StepFinish } from "./screens/Onboarding/StepFinish";

import { DashboardShell } from "./screens/Dashboard/DashboardShell";
import { Overview } from "./screens/Dashboard/Overview";
import { Received } from "./screens/Dashboard/Received";
import { RequestDetail } from "./screens/Dashboard/RequestDetail";
import { Sent } from "./screens/Dashboard/Sent";
import { SentDetail } from "./screens/Dashboard/SentDetail";
import { MyPage } from "./screens/Dashboard/MyPage";
import { Earnings } from "./screens/Dashboard/Earnings";
import { Settings } from "./screens/Dashboard/Settings";

import { Login } from "./screens/Auth/Login";
import { ForgotPassword } from "./screens/Auth/ForgotPassword";
import { PublicProfile } from "./screens/Public/PublicProfile";
import { SendRequest } from "./screens/Send/SendRequest";

import { LandingApp } from "./LandingApp";
import { Terms } from "./screens/Legal/Terms";
import { Privacy } from "./screens/Legal/Privacy";

type TabId = "overview" | "received" | "sent" | "earnings" | "page" | "settings";

const TAB_TITLES: Record<TabId, ReactNode> = {
  overview: <>Your day, <span className="italic text-[hsl(var(--ink-subtle))]">at a glance</span>.</>,
  received: <>Your inbox, <span className="italic text-[hsl(var(--ink-subtle))]">on your terms</span>.</>,
  sent: <>What you've <span className="italic text-[hsl(var(--ink-subtle))]">sent</span>.</>,
  earnings: <>What you've <span className="italic text-[hsl(var(--ink-subtle))]">earned</span>.</>,
  page: <>Your <span className="italic text-[hsl(var(--ink-subtle))]">public</span> page.</>,
  settings: <>Your account, <span className="italic text-[hsl(var(--ink-subtle))]">your rules</span>.</>,
};

function getActiveTab(path: string): TabId {
  if (path === "/dashboard/received") return "received";
  if (path === "/dashboard/sent") return "sent";
  if (path === "/dashboard/earnings") return "earnings";
  if (path === "/dashboard/page") return "page";
  if (path === "/dashboard/settings") return "settings";
  return "overview";
}

/**
 * Routes — the single dispatch surface the app renders.
 *
 * Order matters:
 *   1. Static, app-owned paths (claim, login, dashboard).
 *   2. Public profile and its send flow at /:handle and /:handle/send.
 *   3. Fallback to landing for the root.
 */
export function Routes() {
  const { path, navigate } = useRouter();
  const account = useAccount();
  const profile = useProfile();

  useEffect(() => {
    if (!account || !profile) return;
    if (path === "/login" || path === "/claim" || path.startsWith("/claim/")) {
      navigate("/dashboard", { replace: true });
    }
  }, [path, account, profile, navigate]);

  // Guard: redirect unauthenticated users away from protected routes
  useEffect(() => {
    if (account) return;
    if (path.startsWith("/dashboard")) {
      navigate("/login", { replace: true });
    }
  }, [path, account, navigate]);

  // ─── Static, app-owned routes ─────────────────────────────────────

  if (path === "/" || path === "") {
    return <LandingApp />;
  }

  if (path === "/login") return <Login />;
  if (path === "/forgot-password") return <ForgotPassword />;

  if (path === "/claim") return <StepHandle />;
  if (path === "/claim/email") return <StepEmail />;
  if (path === "/claim/identity") return <StepIdentity />;
  if (path === "/claim/floor") return <StepFloor />;
  if (path === "/claim/categories") return <StepCategories />;
  if (path === "/claim/socials") return <StepSocials />;
  if (path === "/claim/visibility") return <StepVisibility />;
  if (path === "/claim/finish") return <StepFinish />;

  if (path === "/terms") return <Terms />;
  if (path === "/privacy") return <Privacy />;

  if (path.startsWith("/dashboard")) {
    if (!account || !profile) return null;
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

/**
 * Maps a dashboard path to { title, content }.
 * Used only for detail routes (received/:id, sent/:id).
 */
function dashboardDetailRoute(
  path: string,
): { title: ReactNode; content: ReactNode } | null {
  const recvDetail = match("/dashboard/received/:id", path);
  if (recvDetail) {
    return {
      title: <>A serious <span className="italic text-[hsl(var(--ink-subtle))]">request</span>.</>,
      content: <RequestDetail id={recvDetail.id} />,
    };
  }

  const sentDetail = match("/dashboard/sent/:id", path);
  if (sentDetail) {
    return {
      title: <>What you <span className="italic text-[hsl(var(--ink-subtle))]">asked</span>.</>,
      content: <SentDetail id={sentDetail.id} />,
    };
  }

  return null;
}

/** Memoized panels — hidden panels skip re-renders from parent. */
const MemoOverview = memo(Overview);
const MemoReceived = memo(Received);
const MemoSent = memo(Sent);
const MemoEarnings = memo(Earnings);
const MemoMyPage = memo(MyPage);
const MemoSettings = memo(Settings);

/**
 * Single DashboardShell — all 6 tab panels mounted once,
 * hidden via display:none. Tab switches are instant:
 * no unmount, no mount, no hook re-execution.
 */
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

  useEffect(() => {
    if (!hasAccount) {
      navigate("/login", { replace: true });
    } else if (!hasProfile) {
      navigate("/claim", { replace: true });
    }
  }, [hasAccount, hasProfile, navigate]);

  if (!hasAccount || !hasProfile) return null;

  // Detail routes — separate render, not part of the tab system
  const detail = dashboardDetailRoute(path);
  if (detail) {
    return (
      <DashboardShell headlines={{ detail: detail.title }}>
        {detail.content}
      </DashboardShell>
    );
  }

  // Main tabs — all mounted, visibility toggled by display
  // Wrapped in React.memo so hidden panels skip re-renders from DashboardShell
  const activeTab = getActiveTab(path);

  return (
    <DashboardShell headlines={TAB_TITLES}>
      <div data-panel="overview" style={{ display: activeTab === "overview" ? undefined : "none" }}>
        <MemoOverview />
      </div>
      <div data-panel="received" style={{ display: activeTab === "received" ? undefined : "none" }}>
        <MemoReceived />
      </div>
      <div data-panel="sent" style={{ display: activeTab === "sent" ? undefined : "none" }}>
        <MemoSent />
      </div>
      <div data-panel="earnings" style={{ display: activeTab === "earnings" ? undefined : "none" }}>
        <MemoEarnings />
      </div>
      <div data-panel="page" style={{ display: activeTab === "page" ? undefined : "none" }}>
        <MemoMyPage />
      </div>
      <div data-panel="settings" style={{ display: activeTab === "settings" ? undefined : "none" }}>
        <MemoSettings />
      </div>
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
            letterSpacing: "-0.03em",
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
