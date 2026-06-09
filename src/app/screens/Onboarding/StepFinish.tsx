import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { EASE } from "@/components/motion";
import { Reveal } from "../../ui/Reveal";
import { useRouter } from "../../router";
import { OnboardingShell } from "./OnboardingShell";
import { clearDraft, useDraft } from "../../store/draft";
import { setAccount, setProfile } from "../../store/session";
import { seedDemoForOwner } from "../../store/requests";
import { ProfilePreviewCard } from "../Public/ProfilePreviewCard";
import type { Profile } from "../../types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The gateway to the dashboard.
 *
 * Not a step — a destination. No progress bar, no back button.
 * The user arrives here after completing the sequence and sees
 * a live preview of their card, centered on the page. One
 * action: "Go live." It commits the account and routes into
 * the dashboard where the welcome overlay picks up the story.
 */
export function StepFinish() {
  const { navigate } = useRouter();
  const draft = useDraft();
  const [submitting, setSubmitting] = useState(false);

  // If essential pieces are missing, kick back to the first
  // missing step rather than render a half-built preview.
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

  // Commit the page, then hand off to the live dashboard.
  // The 250ms beat gives the button a deliberate, premium
  // weight before the route changes.
  const launch = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 250));

    const profile: Profile = { ...previewProfile, verified: false };
    setAccount({
      email: draft.email!,
      hasProfile: true,
      hasPassword: false,
    });
    setProfile(profile);
    seedDemoForOwner(profile);
    clearDraft();

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
            This is your page.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
            className="mt-6 max-w-[42ch] text-[hsl(var(--ink-muted))]"
            style={{ fontSize: "1.1rem", lineHeight: 1.55 }}
          >
            Here's what people will see when they land on it.
          </motion.p>
        </div>
      </Reveal>

      <Reveal delay={0.2} duration={0.6} axis="y" blur={5}>
        <div className="mt-12 mx-auto max-w-[480px]">
          <ProfilePreviewCard
            profile={previewProfile}
            variant="preview"
            animate={false}
            preview
          />
        </div>
      </Reveal>

      <Reveal delay={0.35} duration={0.5} axis="y" blur={4}>
        <div className="mt-12 mx-auto max-w-[480px]">
          <motion.button
            type="button"
            disabled={submitting}
            whileHover={submitting ? undefined : { y: -1 }}
            whileTap={submitting ? undefined : { y: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            onClick={launch}
            className="flex h-[50px] w-full items-center justify-center rounded-full bg-[hsl(var(--ink))] text-[14.5px] font-medium tracking-[-0.005em] text-[hsl(var(--page))] transition-[background-color] duration-300 hover:bg-[hsl(var(--ink))]/92 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <span
                aria-hidden="true"
                className="inline-block h-4 w-4 animate-spin rounded-full border-[1.5px] border-current border-r-transparent opacity-70"
              />
            ) : (
              "Go live"
            )}
          </motion.button>
          <p className="mt-4 text-center text-[12.5px] leading-[1.55] text-[hsl(var(--ink-subtle))]">
            You can pause or change your settings anytime from your dashboard.
          </p>
        </div>
      </Reveal>
    </OnboardingShell>
  );
}
