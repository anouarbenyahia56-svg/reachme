import { Link } from "../../router";
import { Wordmark } from "@/components/Wordmark";

export function Terms() {
  return (
    <div className="min-h-screen bg-[hsl(var(--page))] text-[hsl(var(--ink))]">
      <header className="flex h-[68px] items-center px-6 md:px-10">
        <Link href="/" aria-label="ReachMe">
          <Wordmark size="sm" />
        </Link>
      </header>

      <main id="main-content" className="mx-auto max-w-[720px] px-6 pb-32 pt-12 md:px-10">
        <h1
          className="font-serif text-[hsl(var(--ink))]"
          style={{
            fontSize: "clamp(2rem, 5vw, 3.2rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.035em",
            fontWeight: 500,
          }}
        >
          Terms of Service
        </h1>

        <p className="mt-6 text-[12.5px] text-[hsl(var(--ink-subtle))]">
          Last updated June 5, 2026
        </p>

        <div className="mt-10 space-y-8 text-[15px] leading-[1.65] text-[hsl(var(--ink-muted))]">
          <section>
            <h2 className="mb-3 font-medium text-[hsl(var(--ink))]">
              1. What ReachMe is
            </h2>
            <p>
              ReachMe is a platform that lets people reach you by attaching a
              meaningful amount of money to their request. You set your floor
              — the minimum signal someone must attach — and decide which
              requests are worth your time. We hold the funds in escrow until
              you reply, or the request expires. If you reply, the
              funds are released to you minus a 5% platform fee. If you let
              the request expire, the sender is refunded in full.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-medium text-[hsl(var(--ink))]">
              2. Your account
            </h2>
            <p>
              When you create an account and claim a handle, it becomes yours
              as long as your account remains active. You are responsible for
              everything published under your handle and for maintaining the
              confidentiality of your account credentials. You may not transfer
              your account to another person without our consent. We reserve
              the right to reclaim inactive handles after a prolonged period
              of inactivity.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-medium text-[hsl(var(--ink))]">
              3. Money and escrow
            </h2>
            <p>
              When someone sends a request, their payment is held in escrow by
              our payment processor. The funds remain in escrow until one of
              two things happens: you reply within your reply window (the
              funds are released to you minus a 5% platform fee), or the request
              expires without a response (the sender is refunded in full). We
              earn nothing on expired requests.
            </p>
            <p className="mt-4">
              Payouts are processed to the bank account or payment method you
              designate. Payout timing depends on your payment processor and
              region, but we initiate payouts promptly after a reply is sent.
              Withdrawals may be subject to a minimum threshold.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-medium text-[hsl(var(--ink))]">
              4. Your content
            </h2>
            <p>
              You own everything you publish on your ReachMe page — your
              display name, bio, profile photo, social links, and categories.
              We do not claim ownership of your content. By publishing content
              on ReachMe, you grant us a limited license to display, store,
              and distribute it solely for the purpose of operating the
              platform — for example, showing your profile to people who want
              to reach you.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-medium text-[hsl(var(--ink))]">
              5. Acceptable use
            </h2>
            <p>
              You agree not to use ReachMe for any illegal, misleading, or
              harmful purpose. This includes, but is not limited to:
              impersonating others, submitting fraudulent requests, attempting
              to circumvent the escrow system, harvesting data without
              consent, or distributing malicious content. We reserve the right
              to suspend or terminate accounts that violate these terms or
              that we determine, in our sole discretion, are being used in a
              manner that harms the platform or its community.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-medium text-[hsl(var(--ink))]">
              6. Limitation of liability
            </h2>
            <p>
              ReachMe is provided "as is" without any warranties, express or
              implied. To the maximum extent permitted by law, we disclaim all
              liability for any damages arising from your use of the platform,
              including but not limited to lost funds, lost opportunities, or
              data loss. Our total liability to you shall not exceed the total
              amount of fees we have collected from you in the twelve months
              preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-medium text-[hsl(var(--ink))]">
              7. Changes to these terms
            </h2>
            <p>
              We may update these terms from time to time. If we make material
              changes, we will notify you by email or through the platform.
              Your continued use of ReachMe after the changes take effect
              means you accept the new terms. If you do not agree to the
              changes, you should stop using the platform and delete your
              account.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-medium text-[hsl(var(--ink))]">
              8. Contact
            </h2>
            <p>
              If you have questions about these terms, please reach out to{" "}
              <a
                href="mailto:support@reachme.com"
                className="underline underline-offset-2 transition-colors duration-300 hover:text-[hsl(var(--ink))]"
              >
                support@reachme.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-16">
          <Link
            href="/"
            className="text-[14px] text-[hsl(var(--ink-subtle))] underline underline-offset-2 transition-colors duration-300 hover:text-[hsl(var(--ink))]"
          >
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
