import React from "react";
import { useNavigate } from "react-router-dom";
import LandingPageLayout, {
  LandingPageHeader,
} from "@/components/layout/landing-page-layout";

const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <LandingPageLayout
      scrollToSection={() => {
        navigate(-1);
      }}
    >
      <div className="relative w-full">
        <LandingPageHeader
          scrollToSection={() => {
            navigate(-1);
          }}
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
                <li>Delete your account and associated data</li>
                <li>Opt-out of non-essential communications</li>
                <li>Control location data sharing</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-semibold text-white">
                8. Data Retention
              </h3>
              <p className="text-white/70 leading-relaxed">
                We retain your information only as long as necessary to provide
                our services and comply with legal obligations. You can request
                data deletion at any time.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-semibold text-white">
                9. Children's Privacy
              </h3>
              <p className="text-white/70 leading-relaxed">
                Our App is not intended for children under 13. We do not
                knowingly collect personal information from children under 13
                years of age.
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
                your data, please contact us through our Instagram @lishka.app
                or through the contact options in the App.
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
