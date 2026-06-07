import { useEffect, useRef, useState } from "react";
import { useAccount, useProfile, setProfile } from "../../store/session";
import { requestVerification } from "../../store/verification";
import { useRouter } from "../../router";

/**
 * Dashboard verification banner.
 *
 * A quiet, persistent prompt to verify the account email.
 * Verification was moved out of onboarding (seamless flow) and
 * into the dashboard, where it lives as a system message above
 * the page content. Once verified, the banner is removed and the
 * dashboard reads clean.
 *
 * Demo behaviour: "Verify email" simulates the link click with a
 * short delay, flipping `profile.verified` to true. "Resend"
 * calls the real `requestVerification` to exercise the cooldown
 * and "Resent." feedback. "Change" returns to /claim/email.
 */
export function VerifyEmailBanner() {
  const account = useAccount();
  const profile = useProfile();
  const { navigate } = useRouter();
  const [verifying, setVerifying] = useState(false);
  const [resent, setResent] = useState(false);
  const resendTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resendTimer.current) window.clearTimeout(resendTimer.current);
    };
  }, []);

  if (!account) return null;
  if (profile?.verified) return null;

  const handleVerify = async () => {
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 400));
    if (profile) {
      setProfile({ ...profile, verified: true });
    }
    setVerifying(false);
  };

  const handleResend = () => {
    if (resendTimer.current) window.clearTimeout(resendTimer.current);
    requestVerification(account.email);
    setResent(true);
    resendTimer.current = window.setTimeout(() => setResent(false), 2000);
  };

  return (
    <div
      role="status"
      className="mb-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-2xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] px-5 py-3.5"
    >
      <p className="text-[14px] leading-[1.55] text-[hsl(var(--ink-muted))]">
        Verify <span className="text-[hsl(var(--ink))]">{account.email}</span> to secure your account.
      </p>
      <div className="flex items-center gap-5 text-[14px]">
        <button
          type="button"
          onClick={handleVerify}
          disabled={verifying}
          className="text-[hsl(var(--ink-muted))] underline underline-offset-2 transition-colors duration-300 hover:text-[hsl(var(--ink))] disabled:opacity-60"
        >
          {verifying ? "Verifying..." : "Verify email"}
        </button>
        <button
          type="button"
          onClick={handleResend}
          className="text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
        >
          {resent ? "Resent." : "Resend"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/claim/email")}
          className="text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
        >
          Change
        </button>
      </div>
    </div>
  );
}
