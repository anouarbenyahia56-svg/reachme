import { motion, AnimatePresence } from "framer-motion";
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { EASE } from "@/components/motion";
import { AppHeader } from "../../ui/AppHeader";
import { Button } from "../../ui/Button";
import { TextField, TextArea } from "../../ui/Field";
import { Avatar } from "../../ui/Avatar";
import { VerifiedBadge } from "../../ui/VerifiedBadge";
import { Pill } from "../../ui/Pill";
import { Reveal } from "../../ui/Reveal";
import { findInDirectory } from "../../store/directory";
import { Link, useRouter } from "../../router";
import { formatMoney, parseMoneyToCents, dateLong } from "../../store/format";
import { submitRequest } from "../../store/requests";
import { useToast } from "../../ui/Toast";
import { useAccount, useProfile } from "../../store/session";

/**
 * Send-a-request flow.
 *
 * Five fluid steps presented inside a single page that swaps
 * panels with the same blur-reveal motion. The recipient stays
 * in view at the top of the page — the sender never forgets who
 * they're reaching out to.
 *
 *   1. About you (name, email, organization)
 *   2. Category
 *   3. Subject + message
 *   4. Amount (enforces the recipient's floor)
 *   5. Review and submit
 *
 * On success, an outcome screen replaces the form with a quiet
 * confirmation and the next-step ask.
 *
 * Preview mode: when the page owner opens their own send flow, the
 * whole experience is walkable but read-only at the finish — they
 * can't send a request to themselves. A quiet "Preview" marker
 * runs from the first step so nothing is hidden, and the final
 * action is replaced by a calm explanation.
 */
export function SendRequest({ handle }: { handle: string }) {
  const profile = findInDirectory(handle);
  const ownerProfile = useProfile();
  const { navigate } = useRouter();
  const toast = useToast();
  const account = useAccount();

  const [step, setStep] = useState(0);
  // Slide direction for step transitions: +1 advancing (new step
  // enters from the right, current exits left), -1 going back.
  const [direction, setDirection] = useState(1);
  const [done, setDone] = useState<{
    id: string;
    expiresAt: string;
  } | null>(null);

  const [name, setName] = useState(account?.displayName ?? "");
  const [email, setEmail] = useState(account?.email ?? "");
  const [organization, setOrganization] = useState("");
  const [context, setContext] = useState("");
  const [category, setCategory] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [amountStr, setAmountStr] = useState<string>(
    profile
      ? String(buildAmountTiers(profile.minAmountCents)[1].cents / 100)
      : "",
  );
  const amountCents = parseMoneyToCents(amountStr);

  const stepRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    stepRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-[hsl(var(--page))]">
        <AppHeader />
        <main className="mx-auto max-w-[640px] px-6 py-32 text-center">
          <h1
            className="font-serif text-[hsl(var(--ink))]"
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 500,
              letterSpacing: "-0.03em",
            }}
          >
            That page doesn't exist.
          </h1>
          <Link
            href="/find"
            className="mt-7 inline-flex rounded-full border border-[hsl(var(--rule-strong))] px-5 py-2.5 text-[13px] text-[hsl(var(--ink))] transition-colors hover:border-[hsl(var(--ink))]"
          >
            Find someone
          </Link>
        </main>
      </div>
    );
  }

  if (profile.visibility === "paused") {
    return (
      <div className="min-h-screen bg-[hsl(var(--page))]">
        <AppHeader />
        <main className="mx-auto max-w-[640px] px-6 py-32 text-center">
          <Avatar size="lg" src={profile.avatarUrl} name={profile.displayName} />
          <h1
            className="mt-8 font-serif text-[hsl(var(--ink))]"
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 500,
              letterSpacing: "-0.03em",
            }}
          >
            {profile.displayName} isn't accepting requests right now.
          </h1>
          <p className="mt-5 text-[hsl(var(--ink-muted))]">
            Their page is up — but the door is paused. Try again later.
          </p>
        </main>
      </div>
    );
  }

  const STEPS = [
    "About you",
    "Category",
    "Your message",
    "Attach amount",
    "Review",
  ] as const;

  // The owner walking their own page: full preview, no send.
  const isPreview =
    Boolean(ownerProfile) &&
    ownerProfile?.handle.toLowerCase() === profile.handle.toLowerCase();

  const validators: Array<() => string | null> = [
    () => {
      if (!name.trim()) return "Add your name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return "Add a valid email.";
      if (!context.trim()) return "Add a line of context.";
      return null;
    },
    () => (category ? null : "Pick a category."),
    () => {
      if (!subject.trim()) return "Add a subject.";
      if (!message.trim()) return "Write a message.";
      return null;
    },
    () => {
      if (amountCents < profile.minAmountCents)
        return `${profile.displayName.split(" ")[0]}'s minimum is ${formatMoney(profile.minAmountCents)}.`;
      return null;
    },
    () => null,
  ];

  const currentError = useMemo(() => validators[step]?.() ?? null, [
    step,
    name,
    email,
    context,
    category,
    subject,
    message,
    amountCents,
  ]);

  const next = () => {
    const err = validators[step]?.();
    if (err) {
      toast.show(err);
      return;
    }
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = () => {
    const result = submitRequest({
      toHandle: profile.handle,
      from: {
        name: name.trim(),
        email: email.trim(),
        context: context.trim() || undefined,
        organization: organization.trim() || undefined,
      },
      category,
      subject: subject.trim(),
      message: message.trim(),
      amountCents,
    });
    if (!result.ok) {
      toast.show(result.reason);
      return;
    }
    setDone({
      id: result.record.id,
      expiresAt: result.record.expiresAt,
    });
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--page))] text-[hsl(var(--ink))]">
      <AppHeader />

      <main className="mx-auto max-w-[760px] px-5 pb-32 pt-12 md:px-6 md:pt-16">
        <Reveal>
          <RecipientHeader profile={profile} preview={isPreview} />
        </Reveal>

        {!done ? (
          <>
            <div ref={stepRef} className="mt-10">
              <Stepper
                steps={STEPS as unknown as readonly string[]}
                current={step}
              />
            </div>

            <div className="relative mt-8 overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={{
                    enter: (dir: number) => ({
                      opacity: 0,
                      x: dir >= 0 ? 40 : -40,
                      filter: "blur(8px)",
                    }),
                    center: {
                      opacity: 1,
                      x: 0,
                      filter: "blur(0px)",
                    },
                    exit: (dir: number) => ({
                      opacity: 0,
                      x: dir >= 0 ? -40 : 40,
                      filter: "blur(6px)",
                    }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.55, ease: EASE }}
                  className="rounded-3xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] px-6 py-7 sm:px-8 sm:py-8"
                >
                  {step === 0 && (
                    <StepAbout
                      name={name}
                      email={email}
                      organization={organization}
                      context={context}
                      onName={setName}
                      onEmail={setEmail}
                      onOrganization={setOrganization}
                      onContext={setContext}
                    />
                  )}
                  {step === 1 && (
                    <StepCategory
                      profile={profile}
                      value={category}
                      onChange={setCategory}
                    />
                  )}
                  {step === 2 && (
                    <StepMessage
                      subject={subject}
                      message={message}
                      onSubject={setSubject}
                      onMessage={setMessage}
                    />
                  )}
                  {step === 3 && (
                    <StepAmount
                      profile={profile}
                      amountStr={amountStr}
                      onAmountStr={setAmountStr}
                      cents={amountCents}
                    />
                  )}
                  {step === 4 && (
                    <StepReview
                      profile={profile}
                      from={{ name, email, context, organization }}
                      category={category}
                      subject={subject}
                      message={message}
                      cents={amountCents}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => {
                  if (step === 0) {
                    navigate(`/${profile.handle}`);
                  } else {
                    setDirection(-1);
                    setStep((s) => Math.max(0, s - 1));
                  }
                }}
                className="inline-flex items-center gap-2 text-[13px] text-[hsl(var(--ink-muted))] transition-colors duration-300 hover:text-[hsl(var(--ink))]"
              >
                <ArrowLeft size={14} strokeWidth={1.6} aria-hidden="true" />
                {step === 0 ? "Back to page" : "Back"}
              </button>

              {step < STEPS.length - 1 ? (
                <Button
                  size="lg"
                  trailingArrow
                  disabled={Boolean(currentError)}
                  onClick={next}
                >
                  Continue
                </Button>
              ) : isPreview ? (
                <p className="max-w-[34ch] text-right text-[12.5px] leading-[1.55] text-[hsl(var(--ink-muted))]">
                  This is a preview of what senders see. You can't send a
                  request to your own page.
                </p>
              ) : (
                <Button
                  size="lg"
                  trailingArrow
                  onClick={submit}
                >
                  Send request &amp; hold {formatMoney(amountCents)}
                </Button>
              )}
            </div>
          </>
        ) : (
          <SuccessPanel
            profile={profile}
            id={done.id}
            expiresAt={done.expiresAt}
            onView={() => navigate("/dashboard/sent")}
          />
        )}
      </main>
    </div>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────

function RecipientHeader({
  profile,
  preview,
}: {
  profile: ReturnType<typeof findInDirectory>;
  preview?: boolean;
}) {
  if (!profile) return null;
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] px-5 py-4 sm:px-6">
      <Avatar src={profile.avatarUrl} name={profile.displayName} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
            You're reaching out to
          </p>
          {preview && (
            <span className="inline-flex items-center rounded-full border border-[hsl(var(--rule-strong))] bg-[hsl(var(--page))] px-2.5 py-[3px] text-[10px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--ink-muted))]">
              Preview
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <p
            className="font-serif text-[hsl(var(--ink))]"
            style={{
              fontSize: "1.3rem",
              fontWeight: 600,
              letterSpacing: "-0.025em",
            }}
          >
            {profile.displayName}
          </p>
          {profile.verified && <VerifiedBadge size={14} />}
        </div>
        <p className="text-[12.5px] text-[hsl(var(--ink-muted))]">
          {profile.title} · Minimum {formatMoney(profile.minAmountCents)}
        </p>
      </div>
    </div>
  );
}

function Stepper({
  steps,
  current,
}: {
  steps: readonly string[];
  current: number;
}) {
  return (
    <ol className="flex w-full items-center text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--ink-subtle))]">
      {steps.map((s, i) => (
        <Fragment key={s}>
          <li
            className="flex shrink-0 items-center gap-2"
            aria-current={i === current ? "step" : undefined}
          >
            <span
              className={[
                "inline-flex aspect-square h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium leading-none tabular-nums",
                i < current
                  ? "border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-[hsl(var(--page))]"
                  : i === current
                    ? "border-[hsl(var(--ink))] bg-transparent text-[hsl(var(--ink))]"
                    : "border-[hsl(var(--rule-strong))] bg-transparent text-[hsl(var(--ink-subtle))]",
              ].join(" ")}
            >
              {i < current ? (
                <Check size={12} strokeWidth={2.2} aria-hidden="true" />
              ) : (
                i + 1
              )}
            </span>
            <span
              className={[
                "hidden whitespace-nowrap sm:inline",
                i === current ? "text-[hsl(var(--ink))]" : "",
              ].join(" ")}
            >
              {s}
            </span>
          </li>
          {i < steps.length - 1 && (
            <span
              aria-hidden="true"
              className="mx-3 hidden h-px flex-1 bg-[hsl(var(--rule))] sm:block"
            />
          )}
        </Fragment>
      ))}
    </ol>
  );
}

function PanelTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-7">
      <p className="mb-3 text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
        {eyebrow}
      </p>
      <h2
        className="font-serif text-[hsl(var(--ink))]"
        style={{
          fontSize: "clamp(1.5rem, 2.6vw, 2rem)",
          fontWeight: 500,
          letterSpacing: "-0.025em",
          lineHeight: 1.1,
          fontOpticalSizing: "auto",
        }}
      >
        {title}
      </h2>
      {description && (
        <p
          className="mt-3 max-w-[58ch] text-[hsl(var(--ink-muted))]"
          style={{ fontSize: "0.97rem", lineHeight: 1.6 }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

function StepAbout({
  name,
  email,
  organization,
  context,
  onName,
  onEmail,
  onOrganization,
  onContext,
}: {
  name: string;
  email: string;
  organization: string;
  context: string;
  onName: (s: string) => void;
  onEmail: (s: string) => void;
  onOrganization: (s: string) => void;
  onContext: (s: string) => void;
}) {
  return (
    <div>
      <PanelTitle
        eyebrow="About you"
        title="Tell them who's writing."
        description="Your email creates a private account to track this request, refunds, and replies. Only your name appears to them — you choose whether to share your email."
      />
      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          label="Your name"
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="Jane Doe"
          autoComplete="name"
          autoFocus
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => onEmail(e.target.value)}
          placeholder="jane@company.com"
          autoComplete="email"
          helper="Used to confirm your account and notify you of replies."
        />
      </div>
      <div className="mt-5">
        <TextField
          label="Context"
          value={context}
          onChange={(e) => onContext(e.target.value)}
          placeholder="Founder, writer, designer, researcher…"
          helper="A line about who you are. Specific is better than impressive."
        />
      </div>
      <div className="mt-5">
        <TextField
          label="Organization"
          optional
          value={organization}
          onChange={(e) => onOrganization(e.target.value)}
          placeholder="Where you work, what you build"
        />
      </div>
    </div>
  );
}

function StepCategory({
  profile,
  value,
  onChange,
}: {
  profile: NonNullable<ReturnType<typeof findInDirectory>>;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <PanelTitle
        eyebrow="Category"
        title="Why are you reaching out?"
        description="Pick the category that fits best. The closer it matches, the more likely it earns a reply."
      />
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {profile.categories.map((c) => {
          const active = value === c.id;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onChange(c.id)}
                aria-pressed={active}
                className={[
                  "flex w-full items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-left text-[14px] transition-[border-color,background-color,color] duration-300",
                  active
                    ? "border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-[hsl(var(--page))]"
                    : "border-[hsl(var(--rule-strong))] bg-[hsl(var(--page))] text-[hsl(var(--ink))] hover:border-[hsl(var(--ink))]",
                ].join(" ")}
              >
                <span className="font-medium">{c.label}</span>
                {active && (
                  <Check size={14} strokeWidth={1.8} aria-hidden="true" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StepMessage({
  subject,
  message,
  onSubject,
  onMessage,
}: {
  subject: string;
  message: string;
  onSubject: (s: string) => void;
  onMessage: (s: string) => void;
}) {
  return (
    <div>
      <PanelTitle
        eyebrow="Your message"
        title="What's the request?"
        description="Be specific. Lead with the ask. Recipients reply to clarity."
      />
      <TextField
        label="Subject"
        value={subject}
        onChange={(e) => onSubject(e.target.value)}
        placeholder="A 15-minute conversation about [specific question]"
        maxLength={120}
        autoFocus
      />
      <div className="mt-5">
        <TextArea
          label="Message"
          value={message}
          onChange={(e) => onMessage(e.target.value)}
          maxChars={2000}
          placeholder="What you're working on. What you're asking for. What a yes looks like — and what a no costs nothing."
          helper="A few short paragraphs. The amount you attach earns this message a careful read; the message earns the reply."
        />
      </div>
    </div>
  );
}

/** Rounds a dollar amount to a clean, considered increment scaled
 *  to its magnitude — no cents, nothing with a decimal point. */
function roundNiceDollars(dollars: number): number {
  if (dollars <= 50) return Math.round(dollars / 5) * 5;
  if (dollars <= 150) return Math.round(dollars / 10) * 10;
  if (dollars <= 500) return Math.round(dollars / 25) * 25;
  if (dollars <= 1000) return Math.round(dollars / 50) * 50;
  return Math.round(dollars / 100) * 100;
}

interface AmountTier {
  cents: number;
  label: string;
}

/** Suggested amounts for a given floor. The minimum is shown
 *  exactly; the rest are scaled, rounded to clean whole dollars,
 *  and kept strictly increasing. Index 1 is the recommended
 *  default. */
function buildAmountTiers(minCents: number): AmountTier[] {
  const minD = minCents / 100;
  const tiers: AmountTier[] = [{ cents: minCents, label: "Minimum" }];
  const specs: Array<{ mult: number; label: string }> = [
    { mult: 1.5, label: "Recommended" },
    { mult: 2.5, label: "Strong signal" },
    { mult: 5, label: "Top priority" },
  ];
  let prevCents = minCents;
  for (const s of specs) {
    let cents = roundNiceDollars(minD * s.mult) * 100;
    if (cents <= prevCents) cents = prevCents + 500; // keep increasing
    tiers.push({ cents, label: s.label });
    prevCents = cents;
  }
  return tiers;
}

function StepAmount({
  profile,
  amountStr,
  onAmountStr,
  cents,
}: {
  profile: NonNullable<ReturnType<typeof findInDirectory>>;
  amountStr: string;
  onAmountStr: (s: string) => void;
  cents: number;
}) {
  const min = profile.minAmountCents;
  const tiers = buildAmountTiers(min);
  return (
    <div>
      <PanelTitle
        eyebrow="Attach amount"
        title="Show that you mean it."
        description={`The amount is held until ${profile.displayName.split(" ")[0]} replies. If they decline or don't respond within 7 days, it returns to you in full.`}
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {tiers.map((t) => {
          const active = cents === t.cents;
          return (
            <button
              key={t.cents}
              type="button"
              onClick={() => onAmountStr(String(t.cents / 100))}
              aria-pressed={active}
              className={[
                "rounded-2xl border px-3 py-4 text-center transition-[border-color,background-color,color] duration-300",
                active
                  ? "border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-[hsl(var(--page))]"
                  : "border-[hsl(var(--rule-strong))] bg-[hsl(var(--page))] text-[hsl(var(--ink))] hover:border-[hsl(var(--ink))]",
              ].join(" ")}
            >
              <span
                className="font-serif"
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 500,
                  letterSpacing: "-0.025em",
                }}
              >
                {formatMoney(t.cents)}
              </span>
              <span className="mt-1 block text-[11px] uppercase tracking-[0.18em] opacity-70">
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--ink-subtle))]">
          Or a custom amount
        </p>
        <div className="flex items-center overflow-hidden rounded-2xl border border-[hsl(var(--rule-strong))] bg-[hsl(var(--page))] focus-within:border-[hsl(var(--ink))]">
          <span className="select-none border-r border-[hsl(var(--rule))] bg-[hsl(var(--surface))] px-5 py-4 text-[15px] text-[hsl(var(--ink-muted))]">
            USD
          </span>
          <span className="pl-4 text-[15px] text-[hsl(var(--ink-muted))]">$</span>
          <input
            inputMode="decimal"
            value={amountStr}
            onChange={(e) => onAmountStr(e.target.value)}
            placeholder={String(min / 100)}
            className="w-full bg-transparent px-3 py-4 text-[15px] text-[hsl(var(--ink))] placeholder:text-[hsl(var(--ink-subtle))] focus:outline-none"
          />
        </div>
        <p className="mt-3 text-[12.5px] text-[hsl(var(--ink-subtle))]">
          Minimum is {formatMoney(min)}. A higher amount can signal priority —
          it never replaces the message.
        </p>
      </div>
    </div>
  );
}

function StepReview({
  profile,
  from,
  category,
  subject,
  message,
  cents,
}: {
  profile: NonNullable<ReturnType<typeof findInDirectory>>;
  from: {
    name: string;
    email: string;
    context: string;
    organization: string;
  };
  category: string;
  subject: string;
  message: string;
  cents: number;
}) {
  const cat = profile.categories.find((c) => c.id === category);
  const aboutLine = [from.context, from.organization]
    .filter((s) => s.trim())
    .join(" · ");
  const firstName = profile.displayName.split(" ")[0];

  return (
    <div>
      <PanelTitle
        eyebrow="Review"
        title="Send your request."
        description={`No charge today — this is a hold, not a payment. The amount is released only if ${firstName} replies.`}
      />

      {/* Recipient + amount — the weight of the moment, stated first. */}
      <div className="flex flex-col gap-5 rounded-3xl border border-[hsl(var(--rule))] bg-[hsl(var(--page))] px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex items-center gap-3.5">
          <Avatar src={profile.avatarUrl} name={profile.displayName} size="md" />
          <div className="min-w-0">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
              To
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[15px] font-medium text-[hsl(var(--ink))]">
              {profile.displayName}
              {profile.verified && <VerifiedBadge size={14} />}
            </p>
          </div>
        </div>
        <div className="sm:text-right">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
            Amount on hold
          </p>
          <p
            className="mt-1 font-serif text-[hsl(var(--ink))]"
            style={{
              fontSize: "1.9rem",
              fontWeight: 500,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {formatMoney(cents)}
          </p>
        </div>
      </div>

      {/* The request, laid out as a clean spec sheet. */}
      <dl className="mt-6 divide-y divide-[hsl(var(--rule))] border-t border-[hsl(var(--rule))]">
        <ReviewRow label="From">
          <span className="text-[hsl(var(--ink))]">{from.name}</span>
          <span className="block text-[13px] text-[hsl(var(--ink-muted))]">
            {from.email}
          </span>
        </ReviewRow>
        {aboutLine && <ReviewRow label="Context">{aboutLine}</ReviewRow>}
        <ReviewRow label="Category">{cat?.label ?? "—"}</ReviewRow>
        <ReviewRow label="Subject">{subject}</ReviewRow>
      </dl>

      {/* The message itself — given room to breathe. */}
      <div className="mt-8">
        <p className="mb-3 text-[10.5px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
          Message
        </p>
        <div className="rounded-2xl border border-[hsl(var(--rule))] bg-[hsl(var(--page))] px-5 py-5 sm:px-6">
          <p className="whitespace-pre-line text-[15px] leading-[1.7] text-[hsl(var(--ink))]">
            {message}
          </p>
        </div>
      </div>

      <p className="mt-7 text-[12px] leading-[1.6] text-[hsl(var(--ink-subtle))]">
        By sending, you agree to ReachMe's escrow terms: held on submit,
        released on reply, refunded on decline or expiry.
      </p>
    </div>
  );
}

function ReviewRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] items-baseline gap-x-6 py-4 first:pt-5 last:pb-0 sm:grid-cols-[8.5rem_1fr]">
      <dt className="text-[11px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--ink-subtle))]">
        {label}
      </dt>
      <dd className="break-words text-[14.5px] leading-[1.5] text-[hsl(var(--ink))]">
        {children}
      </dd>
    </div>
  );
}

function SuccessPanel({
  profile,
  id,
  expiresAt,
  onView,
}: {
  profile: NonNullable<ReturnType<typeof findInDirectory>>;
  id: string;
  expiresAt: string;
  onView: () => void;
}) {
  return (
    <Reveal>
      <div className="mt-12 rounded-3xl border border-[hsl(var(--rule))] bg-[hsl(var(--surface))] px-6 py-12 text-center sm:px-10 sm:py-16">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--ink))] text-[hsl(var(--page))]">
          <Check size={20} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <h1
          className="mt-7 font-serif text-[hsl(var(--ink))]"
          style={{
            fontSize: "clamp(2rem, 5vw, 3.2rem)",
            fontWeight: 500,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            textWrap: "balance",
          }}
        >
          Your request is in {profile.displayName.split(" ")[0]}'s inbox.
        </h1>
        <p
          className="mx-auto mt-5 max-w-[48ch] text-[hsl(var(--ink-muted))]"
          style={{ fontSize: "1rem", lineHeight: 1.65 }}
        >
          The amount is held. If they reply, it's released to them. If they
          decline or don't respond by {dateLong(expiresAt)}, it's refunded
          to you in full.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button onClick={onView} size="lg" trailingArrow>
            View your sent requests
          </Button>
        </div>
        <p className="mt-7 text-[11px] uppercase tracking-[0.22em] text-[hsl(var(--ink-subtle))]">
          Reference · {id.slice(0, 8)}
        </p>
        <div className="mt-3 inline-flex">
          <Pill size="sm">{formatMoney(profile.minAmountCents)}+ minimum</Pill>
        </div>
      </div>
    </Reveal>
  );
}
