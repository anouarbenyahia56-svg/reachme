import { Link } from "../../router";
import { Wordmark } from "@/components/Wordmark";

export function Privacy() {
  return (
    <div className="min-h-screen bg-[hsl(var(--page))] text-[hsl(var(--ink))]">
      <header className="flex h-[68px] items-center px-6 md:px-10">
        <Link href="/" aria-label="ReachMe">
          <Wordmark size="sm" />
        </Link>
      </header>

      <main className="mx-auto max-w-[720px] px-6 pb-32 pt-12 md:px-10">
        <h1
          className="font-serif text-[hsl(var(--ink))]"
          style={{
            fontSize: "clamp(2rem, 5vw, 3.2rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.035em",
            fontWeight: 500,
          }}
        >
          Privacy Policy
        </h1>

        <p className="mt-6 text-[12.5px] text-[hsl(var(--ink-subtle))]">
          Last updated June 5, 2026
        </p>

        <div className="mt-10 space-y-8 text-[15px] leading-[1.65] text-[hsl(var(--ink-muted))]">
          <section>
            <h2 className="mb-3 font-medium text-[hsl(var(--ink))]">
              1. Information we collect
            </h2>
            <p>
              We collect the information you provide when you create an
              account and set up your profile. This includes your email
              address, display name, handle, profile photo, bio, social
              links, and categories. We also collect payment information
              necessary to process escrow transactions, such as your bank
              account or payment provider details, which are handled by our
              payment processor and not stored directly on our servers.
            </p>
            <p className="mt-4">
              When someone sends you a request, we collect their name, email
              address, message, and the amount they attach. We retain this
              information as part of the request record.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-medium text-[hsl(var(--ink))]">
              2. How we use your information
            </h2>
            <p>
              We use your information to operate ReachMe — to display your
              public profile, process payments and escrows, send notifications
              about requests and replies, and provide customer support. We also
              use your information to improve the platform, detect and prevent
              abuse, and comply with legal obligations.
            </p>
            <p className="mt-4">
              We do not sell your personal information. We do not use it for
              advertising. We do not share it with third parties for their own
              marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-medium text-[hsl(var(--ink))]">
              3. Cookies and tracking
            </h2>
            <p>
              We use essential cookies to maintain your session and keep you
              logged in. We may use analytics cookies to understand how the
              platform is used, but these do not identify you personally. You
              can disable cookies in your browser settings, but some features
              of the platform may not function properly without them.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-medium text-[hsl(var(--ink))]">
              4. How we share your information
            </h2>
            <p>
              We share your information only as necessary to provide the
              service. This includes sharing payment information with our
              payment processor for escrow transactions, sharing basic profile
              information with people who view your public ReachMe page, and
              disclosing information when required by law or to protect our
              rights. We never share your data with third parties for their
              own marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-medium text-[hsl(var(--ink))]">
              5. Data retention
            </h2>
            <p>
              We retain your account information for as long as your account
              is active. If you delete your account, we remove your personal
              data from our active systems within 30 days. Request records,
              including messages and transaction histories, may be retained
              for a longer period to comply with legal and financial
              obligations.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-medium text-[hsl(var(--ink))]">
              6. Security
            </h2>
            <p>
              We take reasonable technical and organizational measures to
              protect your information against unauthorized access, loss, or
              alteration. This includes encryption in transit and at rest,
              regular security audits, and access controls. No system is
              perfectly secure, and we cannot guarantee the absolute security
              of your data. If a data breach occurs, we will notify affected
              users promptly.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-medium text-[hsl(var(--ink))]">
              7. Your rights
            </h2>
            <p>
              Depending on your jurisdiction, you may have the right to
              access, correct, or delete your personal data; to restrict or
              object to processing; and to receive a copy of your data in a
              portable format. You can exercise most of these rights directly
              from your dashboard settings. For any other requests, contact us
              at the email below. We will respond within the timeframe
              required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-medium text-[hsl(var(--ink))]">
              8. Changes to this policy
            </h2>
            <p>
              We may update this policy from time to time to reflect changes
              in our practices or legal requirements. If we make material
              changes, we will notify you by email or through the platform.
              Your continued use of ReachMe after the changes take effect
              means you accept the updated policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-medium text-[hsl(var(--ink))]">
              9. Contact
            </h2>
            <p>
              If you have questions about this policy or want to exercise your
              privacy rights, reach out to{" "}
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
