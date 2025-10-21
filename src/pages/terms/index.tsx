import React from "react";
import LandingPageLayout, {
  LandingPageHeader,
} from "@/components/layout/landing-page-layout";

const TermsPage: React.FC = () => {
  return (
    <LandingPageLayout>
      <div className="relative w-full">
        <LandingPageHeader
          isMobileMenuOpen={false}
          setIsMobileMenuOpen={() => {}}
        />
      </div>
      <div className="flex mt-20 bg-black mb-10 flex-col">
        {/* Main Content */}

        <div className="max-w-3xl mx-auto w-full">
          <div className="px-4 md:px-0 space-y-6">
            <div className="flex items-center">
              <h1 className="text-6xl font-bold font-[serif] text-white">
                Terms of Service
              </h1>
            </div>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">
                Welcome to Lishka
              </h2>
              <p className="text-white/70 leading-relaxed">
                These Terms of Service (&quot;Terms&quot;) govern your use of
                the Lishka mobile application (&quot;App&quot;) operated by
                Lishka (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). By
                accessing or using our App, you agree to be bound by these
                Terms.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-semibold text-white">
                1. Description of Service
              </h3>
              <p className="text-white/70 leading-relaxed">
                Lishka is an AI-powered fishing companion app that provides:
              </p>
              <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
                <li>Fish species information and identification</li>
                <li>Fishing techniques and recommendations</li>
                <li>Weather conditions and forecasts for fishing</li>
                <li>Local fishing hotspots and seasonal availability</li>
                <li>AI-generated fishing advice and tips</li>
                <li>Gear recommendations and management</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-semibold text-white">
                2. User Accounts
              </h3>
              <p className="text-white/70 leading-relaxed">
                To access certain features of the App, you must create an
                account. You are responsible for maintaining the confidentiality
                of your account credentials and for all activities that occur
                under your account.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-semibold text-white">
                3. AI-Generated Content
              </h3>
              <p className="text-white/70 leading-relaxed">
                Our App uses artificial intelligence to provide fishing
                recommendations and advice. While we strive for accuracy,
                AI-generated content should be used as guidance only. Always
                follow local fishing regulations and use your own judgment when
                fishing.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-semibold text-white">
                4. Location Services
              </h3>
              <p className="text-white/70 leading-relaxed">
                The App may request access to your device's location to provide
                localized fishing information and weather data. You can control
                location permissions through your device settings.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-semibold text-white">
                5. User Conduct
              </h3>
              <p className="text-white/70 leading-relaxed">
                You agree to use the App responsibly and in compliance with all
                applicable laws and regulations, including local fishing laws
                and environmental protection regulations.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-semibold text-white">
                6. Intellectual Property
              </h3>
              <p className="text-white/70 leading-relaxed">
                The App and its original content, features, and functionality
                are owned by Lishka and are protected by international
                copyright, trademark, and other intellectual property laws.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-semibold text-white">
                7. Disclaimer of Warranties
              </h3>
              <p className="text-white/70 leading-relaxed">
                The App is provided &quot;as is&quot; without warranties of any
                kind. We do not guarantee the accuracy of fishing information,
                weather data, or AI-generated recommendations.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-semibold text-white">
                8. Limitation of Liability
              </h3>
              <p className="text-white/70 leading-relaxed">
                Lishka shall not be liable for any indirect, incidental,
                special, or consequential damages arising from your use of the
                App, including but not limited to fishing-related incidents or
                equipment damage.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-semibold text-white">
                9. Changes to Terms
              </h3>
              <p className="text-white/70 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will
                notify users of any material changes through the App or via
                email.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-md font-semibold text-white">
                10. Contact Information
              </h3>
              <p className="text-white/70 leading-relaxed">
                If you have any questions about these Terms, please contact us
                through our Instagram @lishka.app or through the contact options
                in the App.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </LandingPageLayout>
  );
};

export default TermsPage;
