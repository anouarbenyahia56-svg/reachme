import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE } from "@/components/motion";
import { Reveal } from "../../ui/Reveal";
import { useRouter } from "../../router";
import { OnboardingShell } from "./OnboardingShell";
import { clearDraft, useDraft } from "../../store/draft";
import { setAccount, setProfile } from "../../store/session";
import { seedDemoForOwner } from "../../store/requests";
import { ProfilePreviewCard } from "../Public/ProfilePreviewCard";
import type { Profile } from "../../types";
import { Check } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The gateway to the dashboard.
 *
 * Not a step — a destination. No progress bar, no back button.
 * Shows a live preview of the page, then launches into the dashboard.
 */
export function StepFinish() {
  const { navigate } = useRouter();
  const draft = useDraft();
  const [submitting, setSubmitting] = useState(false);
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    if (!draft.handle) navigate("/claim", { replace: true });
    else if (!draft.displayName || !draft.title)
      navigate("/claim/identity", { replace: true });
    else if (!draft.email || !EMAIL_RE.test(draft.email))
      navigate("/claim/email", { replace: true });
  }, [draft, navigate]);

  if (
    !draft.handle ||
    !draft.displayName ||
    !draft.title ||
    !draft.email ||
    !EMAIL_RE.test(draft.email)
  )
    return null;

  const previewProfile: Profile = {
    handle: draft.handle,
    displayName: draft.displayName,
    title: draft.title,
    avatarUrl: draft.avatarUrl,
    minAmountCents: draft.minAmountCents ?? 15000,
    replyWindowDays: draft.replyWindowDays ?? 2,
    categories: draft.categories ?? [],
    socials: draft.socials,
    visibility: draft.visibility ?? "public",
    verified: false,
    createdAt: new Date().toISOString(),
  };

  const launch = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 250));

    setAccount({
      email: draft.email!,
      hasProfile: true,
      hasPassword: false,
    });
    setProfile(previewProfile);
    seedDemoForOwner(previewProfile);
    clearDraft();

    setLaunched(true);
    await new Promise((r) => setTimeout(r, 600));
    navigate("/dashboard?welcome=1", { replace: true });
  };

  return (
    <OnboardingShell bare>
      <Reveal delay={0.05} duration={0.6} axis="y" blur={5}>
        <div className="flex flex-col items-center text-center">
          <motion.h1
            initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, delay: 0.04, ease: EASE }}
            className="font-serif text-[hsl(var(--ink))]"
            style={{
              fontSize: "clamp(2.6rem, 6vw, 4.4rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.04em",
              fontWeight: 500,
              textWrap: "balance",
              maxWidth: "16ch",
            }}
          >
            This is it.
          </motion.h1>
        </div>
      </Reveal>

      <Reveal delay={0.15} duration={0.7} axis="y" blur={4}>
        <div className="mx-auto mt-12 w-full max-w-[480px]">
          <ProfilePreviewCard profile={previewProfile} variant="preview" preview animate={false} />
        </div>
      </Reveal>

      <Reveal delay={0.3} duration={0.5} axis="y" blur={4}>
        <div className="mt-10 mx-auto max-w-[480px] flex flex-col items-center">
          <motion.button
            type="button"
            disabled={submitting || launched}
            whileHover={submitting || launched ? undefined : { y: -1 }}
            whileTap={submitting || launched ? undefined : { y: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            onClick={launch}
            className="flex h-[52px] w-auto items-center justify-center rounded-full bg-[hsl(var(--ink))] px-12 text-[15px] font-medium tracking-[-0.005em] text-[hsl(var(--page))] transition-[background-color,box-shadow] duration-300 hover:bg-[hsl(var(--ink))]/85 hover:shadow-[0_0_0_1px_hsl(var(--ink)),0_8px_24px_-8px_rgba(0,0,0,0.25)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
          >
            <AnimatePresence mode="wait">
              {launched ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="inline-flex items-center justify-center"
                >
                  <Check size={20} strokeWidth={2} />
                </motion.span>
              ) : submitting ? (
                <motion.span
                  key="spinner"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  aria-hidden="true"
                  className="inline-block h-4 w-4 animate-spin rounded-full border-[1.5px] border-current border-r-transparent opacity-70"
                />
              ) : (
                <motion.span
                  key="label"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Go live
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <p className="mt-3 text-center text-[11px] leading-[1.55] text-[hsl(var(--ink-subtle))]">
            By going live, you agree to our{" "}
            <a href="/terms" className="underline underline-offset-2 hover:text-[hsl(var(--ink))]">Terms of Service</a>{" "}
            and{" "}
            <a href="/privacy" className="underline underline-offset-2 hover:text-[hsl(var(--ink))]">Privacy Policy</a>.
          </p>
        </div>
      </Reveal>
    </OnboardingShell>
  );
}
