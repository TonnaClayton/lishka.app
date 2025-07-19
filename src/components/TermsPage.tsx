import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import BottomNav from "./BottomNav";
import { Button } from "./ui/button";

const TermsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white p-4 w-full">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold ml-2">Terms of Service</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-3xl mx-auto pb-20">
        <div className="bg-white rounded-lg p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Welcome to Lishka
            </h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms of Service (&quot;Terms&quot;) govern your use of the
              Lishka mobile application (&quot;App&quot;) operated by Lishka
              (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). By accessing
              or using our App, you agree to be bound by these Terms.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-md font-semibold text-gray-900">
              1. Description of Service
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Lishka is an AI-powered fishing companion app that provides:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Fish species information and identification</li>
              <li>Fishing techniques and recommendations</li>
              <li>Weather conditions and forecasts for fishing</li>
              <li>Local fishing hotspots and seasonal availability</li>
              <li>AI-generated fishing advice and tips</li>
              <li>Gear recommendations and management</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-md font-semibold text-gray-900">
              2. User Accounts
            </h3>
            <p className="text-gray-700 leading-relaxed">
              To access certain features of the App, you must create an account.
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activities that occur under your
              account.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-md font-semibold text-gray-900">
              3. AI-Generated Content
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Our App uses artificial intelligence to provide fishing
              recommendations and advice. While we strive for accuracy,
              AI-generated content should be used as guidance only. Always
              follow local fishing regulations and use your own judgment when
              fishing.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-md font-semibold text-gray-900">
              4. Location Services
            </h3>
            <p className="text-gray-700 leading-relaxed">
              The App may request access to your device's location to provide
              localized fishing information and weather data. You can control
              location permissions through your device settings.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-md font-semibold text-gray-900">
              5. User Conduct
            </h3>
            <p className="text-gray-700 leading-relaxed">
              You agree to use the App responsibly and in compliance with all
              applicable laws and regulations, including local fishing laws and
              environmental protection regulations.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-md font-semibold text-gray-900">
              6. Intellectual Property
            </h3>
            <p className="text-gray-700 leading-relaxed">
              The App and its original content, features, and functionality are
              owned by Lishka and are protected by international copyright,
              trademark, and other intellectual property laws.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-md font-semibold text-gray-900">
              7. Disclaimer of Warranties
            </h3>
            <p className="text-gray-700 leading-relaxed">
              The App is provided &quot;as is&quot; without warranties of any
              kind. We do not guarantee the accuracy of fishing information,
              weather data, or AI-generated recommendations.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-md font-semibold text-gray-900">
              8. Limitation of Liability
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Lishka shall not be liable for any indirect, incidental, special,
              or consequential damages arising from your use of the App,
              including but not limited to fishing-related incidents or
              equipment damage.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-md font-semibold text-gray-900">
              9. Changes to Terms
            </h3>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will
              notify users of any material changes through the App or via email.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-md font-semibold text-gray-900">
              10. Contact Information
            </h3>
            <p className="text-gray-700 leading-relaxed">
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
      </main>

      {/* Bottom Navigation */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
      <div className="hidden lg:block lg:h-16"></div>
    </div>
  );
};

export default TermsPage;
