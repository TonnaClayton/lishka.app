import React from "react";
import LandingPageLayout, {
  LandingPageHeader,
} from "@/components/layout/landing-page-layout";

const PrivacyPolicyPage: React.FC = () => {
  return (
    <LandingPageLayout>
      <div className="relative w-full">
        <LandingPageHeader
          isMobileMenuOpen={false}
          setIsMobileMenuOpen={() => {}}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-black mt-20 mb-10 pb-20">
        <div className="max-w-3xl mx-auto w-full">
          <div className="px-4 md:px-0 space-y-6">
            <div className="flex items-center text-white">
              <h1 className="text-6xl font-bold font-[serif]">
                Privacy Policy
              </h1>
            </div>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">
                Your Privacy Matters
              </h2>
              <p className="text-white/70 leading-relaxed">
                This Privacy Policy describes how Lishka (&quot;we&quot;,
                &quot;our&quot;, or &quot;us&quot;) collects, uses, and protects
                your information when you use our mobile application
                (&quot;App&quot;).
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-semibold text-white">
                1. Information We Collect
              </h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-white">
                    Account Information
                  </h4>
                  <p className="text-white/70 leading-relaxed">
                    When you create an account, we collect your email address
                    and any profile information you choose to provide.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-white">Location Data</h4>
                  <p className="text-white/70 leading-relaxed">
                    With your permission, we collect location data to provide
                    localized fishing information, weather forecasts, and nearby
                    fishing spots.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-white">Usage Information</h4>
                  <p className="text-white/70 leading-relaxed">
                    We collect information about how you use the App, including
                    search queries, fishing preferences, and interaction with AI
                    recommendations.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-white">Device Information</h4>
                  <p className="text-white/70 leading-relaxed">
                    We may collect device identifiers, operating system
                    information, and app version data for technical support and
                    improvement purposes.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-semibold text-white">
                2. How We Use Your Information
              </h3>
              <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
                <li>
                  Provide personalized fishing recommendations and AI-generated
                  advice
                </li>
                <li>Display local weather conditions and fishing forecasts</li>
                <li>
                  Suggest nearby fishing locations and seasonal fish
                  availability
                </li>
                <li>Improve our AI algorithms and app functionality</li>
                <li>
                  Send important updates about the App (with your consent)
                </li>
                <li>Provide customer support and respond to your inquiries</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-semibold text-white">
                3. Information Sharing
              </h3>
              <p className="text-white/70 leading-relaxed">
                We do not sell, trade, or rent your personal information to
                third parties. We may share information in the following limited
                circumstances:
              </p>
              <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
                <li>
                  With service providers who help us operate the App (under
                  strict confidentiality agreements)
                </li>
                <li>When required by law or to protect our legal rights</li>
                <li>
                  In connection with a business transfer or acquisition (with
                  prior notice)
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-semibold text-white">
                4. Data Security
              </h3>
              <p className="text-white/70 leading-relaxed">
                We implement appropriate security measures to protect your
                information against unauthorized access, alteration, disclosure,
                or destruction. This includes encryption of sensitive data and
                secure server infrastructure.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-semibold text-white">
                5. Location Privacy
              </h3>
              <p className="text-white/70 leading-relaxed">
                Location data is used solely to enhance your fishing experience.
                You can disable location services at any time through your
                device settings, though this may limit some App features.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-semibold text-white">
                6. AI and Machine Learning
              </h3>
              <p className="text-white/70 leading-relaxed">
                We use AI to analyze fishing patterns and provide
                recommendations. Your usage data helps improve our AI models,
                but all data is processed in a way that protects your privacy.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-semibold text-white">
                7. Your Rights
              </h3>
              <p className="text-white/70 leading-relaxed">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
                <li>Access and review your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>
                  <a
                    href="#account-deletion"
                    className="underline hover:text-white"
                  >
                    Delete your account and associated data
                  </a>
                </li>
                <li>Opt-out of non-essential communications</li>
                <li>Control location data sharing</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3
                id="account-deletion"
                className="text-md font-semibold text-white scroll-mt-24"
              >
                8. Account Deletion and Data Retention
              </h3>
              <p className="text-white/70 leading-relaxed">
                You can delete your Lishka account at any time. Deleting your
                account permanently removes the personal data Lishka holds about
                you from our active systems.
              </p>

              <h4 className="font-medium text-white">
                How to delete your account
              </h4>
              <p className="text-white/70 leading-relaxed">
                <strong>From the Lishka app:</strong> open the{" "}
                <strong>Profile</strong> tab → tap the{" "}
                <strong>menu icon</strong> (top right) → tap{" "}
                <strong>&quot;Delete Account&quot;</strong> → confirm. Your
                account is deleted immediately and you are signed out.
              </p>
              <p className="text-white/70 leading-relaxed">
                <strong>By email:</strong> if you no longer have access to the
                app, email{" "}
                <a
                  href="mailto:tonnaclayton@gmail.com"
                  className="underline hover:text-white"
                >
                  tonnaclayton@gmail.com
                </a>{" "}
                from the address linked to your Lishka account, with the subject
                &quot;Delete my account&quot;. We action requests within 7 days.
              </p>

              <h4 className="font-medium text-white">What gets deleted</h4>
              <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
                <li>
                  Your profile (email, name, location, fishing experience,
                  preferences)
                </li>
                <li>Your photo gallery and uploaded catch photos</li>
                <li>Logged catches and catch metadata</li>
                <li>Saved fishing locations</li>
                <li>Push notification token</li>
                <li>Your Ask Lishka chat history</li>
              </ul>

              <h4 className="font-medium text-white">
                What is retained, and for how long
              </h4>
              <p className="text-white/70 leading-relaxed">
                Encrypted backups maintained by our infrastructure providers
                hold copies of database state for up to 30 days for disaster
                recovery. Backups containing your data are purged on the
                standard rotation within 30 days of your deletion request.
              </p>
              <p className="text-white/70 leading-relaxed">
                Anonymised aggregate analytics (e.g. counts of how many users
                opened a screen on a given day) are retained indefinitely. After
                your account is deleted these events contain no personal
                identifiers and cannot be re-associated with you.
              </p>

              <h4 className="font-medium text-white">
                Re-creating an account after deletion
              </h4>
              <p className="text-white/70 leading-relaxed">
                If you sign up again with the same email after deletion, a fresh
                account is created — none of your prior data is restored.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-semibold text-white">
                9. Children's Privacy
              </h3>
              <p className="text-white/70 leading-relaxed">
                Lishka is suitable for users of all ages, including young
                fishing enthusiasts. We are committed to protecting children’s
                privacy and complying with applicable laws such as the{" "}
                <strong>EU General Data Protection Regulation (GDPR)</strong>{" "}
                and{" "}
                <strong>
                  the U.S. Children’s Online Privacy Protection Act (COPPA)
                </strong>
                .
                <br />
                <br />
                If you are <strong>under 16 years of age</strong> (or under 13
                if you are located outside the EU), you may use the App{" "}
                <strong>
                  only with the consent and supervision of a parent or legal
                  guardian.
                </strong>{" "}
                We do not knowingly collect, use, or disclose personal
                information from children without verifiable parental consent.
                <br />
                <br />
                If we become aware that we have inadvertently collected personal
                information from a child without proper consent, we will
                promptly delete that information. Parents or guardians who
                believe their child has provided personal data are encouraged to
                contact us so we can take appropriate action.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-semibold text-white">
                10. Changes to Privacy Policy
              </h3>
              <p className="text-white/70 leading-relaxed">
                We may update this Privacy Policy from time to time. We will
                notify you of any material changes through the App or via email.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-semibold text-white">
                11. Contact Us
              </h3>
              <p className="text-white/70 leading-relaxed">
                If you have questions about this Privacy Policy or how we handle
                your data, you can reach us by email at{" "}
                <a
                  href="mailto:tonnaclayton@gmail.com"
                  className="underline hover:text-white"
                >
                  tonnaclayton@gmail.com
                </a>
                , through our Instagram{" "}
                <a
                  href="https://instagram.com/lishka.app"
                  className="underline hover:text-white"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @lishka.app
                </a>
                , or through the contact options in the App.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </main>
    </LandingPageLayout>
  );
};

export default PrivacyPolicyPage;
