"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { Button, GhostButton } from "@/components/Button";
import {
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Textarea,
} from "@/components/Field";
import { EASE } from "@/components/layout";
import { type Profile, type Category } from "@/lib/domain";
import { useStore } from "@/lib/session";
import type { CategoryOption } from "./OwnerView";

/**
 * Public view — what a sender sees.
 *
 * Two columns of editorial composition:
 *   • Profile: name, handle, bio, accepted categories, floor
 *   • Send-request form: category, subject, message, sender details, amount
 *
 * The form lives in client state. On submit we call store.createRequest()
 * — which today writes to localStorage. When Stripe Connect is wired,
 * this submit becomes a payment-intent creation that holds funds; the
 * UI on this page does not change.
 */
export function PublicView({
  profile,
  categoryOptions,
}: {
  profile: Profile;
  categoryOptions: CategoryOption[];
}) {
  const reduced = useReducedMotion();
  const { store } = useStore();

  const visibleCategories = categoryOptions.filter((c) =>
    profile.categories.includes(c.value),
  );

  // Form state.
  const [category, setCategory] = useState<Category | null>(
    visibleCategories[0]?.value ?? null,
  );
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [amount, setAmount] = useState<string>(String(profile.floor));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  function validate() {
    const next: Record<string, string> = {};
    if (!category) next.category = "Pick a category.";
    if (!subject.trim()) next.subject = "Write a clear subject.";
    if (!message.trim()) next.message = "Tell them what you’re reaching for.";
    if (!senderName.trim()) next.senderName = "Add your name.";
    if (!senderEmail.trim() || !senderEmail.includes("@")) {
      next.senderEmail = "Add a valid email.";
    }
    const num = parseInt(amount, 10);
    if (!Number.isFinite(num) || num < profile.floor) {
      next.amount = `${profile.displayName || profile.handle}'s floor is $${profile.floor}.`;
    }
    setErrors(next);
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = validate();
    if (Object.keys(next).length > 0) return;
    setSubmitting(true);
    try {
      const created = await store.createRequest({
        ownerHandle: profile.handle,
        category: category!,
        subject: subject.trim(),
        message: message.trim(),
        amount: parseInt(amount, 10),
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim(),
      });
      setConfirmedId(created.id);
    } catch (err) {
      setErrors({
        _: err instanceof Error ? err.message : "Something went wrong.",
      });
      setSubmitting(false);
    }
  }

  if (confirmedId) {
    return (
      <Confirmation
        profile={profile}
        amount={parseInt(amount, 10)}
        senderEmail={senderEmail.trim()}
      />
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-[1180px] grid-cols-1 gap-x-16 gap-y-16 px-6 pb-32 pt-32 md:grid-cols-12 md:px-10 md:pt-40">
      {/* Profile column */}
      <section className="md:col-span-5">
        <p
          className="text-[hsl(var(--ink-muted))]"
          style={{
            fontSize: "0.7rem",
            fontWeight: 500,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
          }}
        >
          reachme.com/{profile.handle}
        </p>

        <h1
          className="mt-3 font-serif text-[hsl(var(--ink))]"
          style={{
            fontSize: "clamp(2.4rem, 5vw, 4.2rem)",
            fontWeight: 500,
            lineHeight: 1.04,
            letterSpacing: "-0.035em",
            textWrap: "balance",
          }}
        >
          {profile.displayName || profile.handle}
        </h1>

        {profile.bio ? (
          <p
            className="mt-6 max-w-[36ch] text-[hsl(var(--ink-muted))]"
            style={{
              fontSize: "1.1rem",
              lineHeight: 1.55,
              letterSpacing: "-0.005em",
              textWrap: "balance",
            }}
          >
            {profile.bio}
          </p>
        ) : null}

        <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-7">
          <div>
            <dt
              className="text-[hsl(var(--ink-muted))]"
              style={{
                fontSize: "0.7rem",
                fontWeight: 500,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
              }}
            >
              Floor
            </dt>
            <dd
              className="mt-2 font-serif text-[hsl(var(--ink))]"
              style={{
                fontSize: "2rem",
                fontWeight: 500,
                lineHeight: 1,
                letterSpacing: "-0.025em",
              }}
            >
              ${profile.floor}
            </dd>
          </div>
          <div>
            <dt
              className="text-[hsl(var(--ink-muted))]"
              style={{
                fontSize: "0.7rem",
                fontWeight: 500,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
              }}
            >
              Reply window
            </dt>
            <dd
              className="mt-2 font-serif text-[hsl(var(--ink))]"
              style={{
                fontSize: "2rem",
                fontWeight: 500,
                lineHeight: 1,
                letterSpacing: "-0.025em",
              }}
            >
              {profile.replyWindowDays}d
            </dd>
          </div>
        </dl>
      </section>

      {/* Form column */}
      <section className="md:col-span-7 md:col-start-7">
        <p
          className="text-[hsl(var(--ink-muted))]"
          style={{
            fontSize: "0.7rem",
            fontWeight: 500,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
          }}
        >
          Send a request
        </p>
        <h2
          className="mt-3 font-serif text-[hsl(var(--ink))]"
          style={{
            fontSize: "clamp(1.6rem, 2.6vw, 2rem)",
            fontWeight: 500,
            lineHeight: 1.15,
            letterSpacing: "-0.025em",
          }}
        >
          Make it specific. Make it worth replying to.
        </h2>

        <form onSubmit={handleSubmit} noValidate className="mt-12">
          <FieldGroup>
            {visibleCategories.length > 0 ? (
              <div>
                <FieldLabel htmlFor="req-category">Category</FieldLabel>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {visibleCategories.map((opt) => {
                    const active = category === opt.value;
                    return (
                      <motion.button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setCategory(opt.value);
                          setErrors((p) => ({ ...p, category: "" }));
                        }}
                        aria-pressed={active}
                        whileHover={reduced ? undefined : { y: -1 }}
                        whileTap={reduced ? undefined : { y: 0 }}
                        transition={{ duration: 0.25, ease: EASE }}
                        className={
                          "rounded-full border px-4 py-2 text-[13px] tracking-[-0.005em] transition-[background-color,border-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] " +
                          (active
                            ? "border-[hsl(var(--ink))] bg-[hsl(var(--ink))] text-[hsl(var(--page))]"
                            : "border-[hsl(var(--rule-strong))] text-[hsl(var(--ink-muted))] hover:border-[hsl(var(--ink))] hover:text-[hsl(var(--ink))]")
                        }
                      >
                        {opt.label}
                      </motion.button>
                    );
                  })}
                </div>
                <FieldError>{errors.category}</FieldError>
              </div>
            ) : null}

            <div>
              <FieldLabel htmlFor="req-subject">Subject</FieldLabel>
              <Input
                id="req-subject"
                name="subject"
                placeholder="What is this about?"
                maxLength={120}
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setErrors((p) => ({ ...p, subject: "" }));
                }}
                invalid={!!errors.subject}
              />
              <FieldError>{errors.subject}</FieldError>
            </div>

            <div>
              <FieldLabel htmlFor="req-message">Message</FieldLabel>
              <Textarea
                id="req-message"
                name="message"
                placeholder={`Tell ${profile.displayName || profile.handle} what you’re reaching for and why it’s worth their time.`}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setErrors((p) => ({ ...p, message: "" }));
                }}
                invalid={!!errors.message}
                rows={6}
              />
              <FieldError>{errors.message}</FieldError>
            </div>

            <div className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="req-name">Your name</FieldLabel>
                <Input
                  id="req-name"
                  name="name"
                  autoComplete="name"
                  placeholder="Full name"
                  value={senderName}
                  onChange={(e) => {
                    setSenderName(e.target.value);
                    setErrors((p) => ({ ...p, senderName: "" }));
                  }}
                  invalid={!!errors.senderName}
                />
                <FieldError>{errors.senderName}</FieldError>
              </div>
              <div>
                <FieldLabel htmlFor="req-email">Your email</FieldLabel>
                <Input
                  id="req-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  spellCheck={false}
                  placeholder="you@domain.com"
                  value={senderEmail}
                  onChange={(e) => {
                    setSenderEmail(e.target.value);
                    setErrors((p) => ({ ...p, senderEmail: "" }));
                  }}
                  invalid={!!errors.senderEmail}
                />
                <FieldError>{errors.senderEmail}</FieldError>
              </div>
            </div>

            <div>
              <FieldLabel
                htmlFor="req-amount"
                hint={
                  <span>
                    Floor: <span className="text-[hsl(var(--ink))]">${profile.floor}</span>
                  </span>
                }
              >
                Amount you're attaching
              </FieldLabel>
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-3 select-none text-[hsl(var(--ink-subtle))]"
                  style={{
                    fontSize: "max(16px, 1.1rem)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  $
                </span>
                <Input
                  id="req-amount"
                  name="amount"
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value.replace(/[^0-9]/g, ""));
                    setErrors((p) => ({ ...p, amount: "" }));
                  }}
                  invalid={!!errors.amount}
                  className="pl-5"
                />
              </div>
              <FieldError>{errors.amount}</FieldError>
              {!errors.amount ? (
                <p
                  className="mt-2 text-[hsl(var(--ink-muted))]"
                  style={{
                    fontSize: "0.85rem",
                    fontStyle: "italic",
                    letterSpacing: "-0.005em",
                  }}
                >
                  Your card is held, not charged. We capture only if{" "}
                  {profile.displayName || profile.handle} replies. Otherwise
                  you’re refunded automatically.
                </p>
              ) : null}
            </div>

            {errors._ ? (
              <p
                role="alert"
                className="text-[hsl(var(--ink))]"
                style={{ fontSize: "0.95rem", fontStyle: "italic" }}
              >
                {errors._}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
              <Button type="submit" loading={submitting}>
                {submitting ? "Sending…" : "Send request"}
              </Button>
              <span
                className="text-[hsl(var(--ink-subtle))]"
                style={{
                  fontSize: "0.7rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                Held until reply · 7-day window
              </span>
            </div>
          </FieldGroup>
        </form>
      </section>
    </div>
  );
}

// ─── Confirmation ─────────────────────────────────────────────────────────

function Confirmation({
  profile,
  amount,
  senderEmail,
}: {
  profile: Profile;
  amount: number;
  senderEmail: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={
        reduced ? { opacity: 1 } : { opacity: 0, y: 14, filter: "blur(8px)" }
      }
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.85, ease: EASE }}
      className="mx-auto w-full max-w-[640px] px-6 pb-32 pt-32 md:pt-44"
    >
      <p
        className="text-[hsl(var(--ink-muted))]"
        style={{
          fontSize: "0.7rem",
          fontWeight: 500,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
        }}
      >
        Held
      </p>
      <h1
        className="mt-3 font-serif text-[hsl(var(--ink))]"
        style={{
          fontSize: "clamp(2.2rem, 4.4vw, 3.4rem)",
          fontWeight: 500,
          lineHeight: 1.04,
          letterSpacing: "-0.03em",
          textWrap: "balance",
        }}
      >
        Your request is on its way.
      </h1>
      <p
        className="mt-6 max-w-[42ch] text-[hsl(var(--ink-muted))]"
        style={{ fontSize: "1.05rem", lineHeight: 1.55 }}
      >
        ${amount} is held — not charged — until{" "}
        {profile.displayName || profile.handle} replies. If they don’t reply
        within {profile.replyWindowDays} days, you’re refunded automatically.
      </p>
      <p
        className="mt-3 max-w-[42ch] text-[hsl(var(--ink-muted))]"
        style={{ fontSize: "1.05rem", lineHeight: 1.55 }}
      >
        We sent a receipt and a status link to{" "}
        <span className="text-[hsl(var(--ink))]">{senderEmail}</span>.
      </p>

      <div className="mt-12 inline-flex items-center gap-3 rounded-full border border-[hsl(var(--rule-strong))] px-5 py-3 text-[hsl(var(--ink))]">
        <Check size={14} strokeWidth={1.8} aria-hidden="true" />
        <span style={{ fontSize: "0.92rem", letterSpacing: "-0.005em" }}>
          Sent to reachme.com/{profile.handle}
        </span>
      </div>

      <div className="mt-10">
        <GhostButton
          type="button"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          ← Back to ReachMe
        </GhostButton>
      </div>
    </motion.div>
  );
}
