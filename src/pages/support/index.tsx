import React from "react";
import LandingPageLayout, {
  LandingPageHeader,
} from "@/components/layout/landing-page-layout";

const SupportPage: React.FC = () => {
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
                Support
              </h1>
            </div>
            <div className="space-y-4">
              <p className="text-white/70 leading-relaxed text-lg">
                Stuck on something? Got a feature request, a bug report, or just
                want to tell us what&apos;s working? Write in. Replies usually
                come within a day.
              </p>
            </div>

            {/* Contact cards */}
            <div className="space-y-4 pt-2">
              <div className="border border-white/10 rounded-xl p-5">
                <h3 className="text-md font-semibold text-white mb-1">Email</h3>
                <a
                  href="mailto:info@lishka.app"
                  className="text-white/80 hover:text-white underline"
                >
                  info@lishka.app
                </a>
              </div>
              <div className="border border-white/10 rounded-xl p-5">
                <h3 className="text-md font-semibold text-white mb-1">
                  Privacy + legal
                </h3>
                <a
                  href="mailto:legal@lishka.app"
                  className="text-white/80 hover:text-white underline"
                >
                  legal@lishka.app
                </a>
              </div>
            </div>

            {/* FAQ */}
            <div className="space-y-4 pt-6">
              <h2 className="text-lg font-semibold text-white">
                Common questions
              </h2>

              <details className="border-t border-white/10 py-3">
                <summary className="text-white font-medium cursor-pointer">
                  Why does my &quot;Good window&quot; badge disappear when
                  conditions get rough?
                </summary>
                <p className="text-white/70 leading-relaxed mt-2">
                  Lishka&apos;s score combines biology (whether fish are
                  feeding) with conditions (whether you can safely fish). If
                  wind, gusts, or waves cross the safety threshold for your
                  method, the score drops into the &quot;Tough&quot; band and a
                  &quot;Too risky&quot; badge appears. The number itself varies
                  inside that band based on how bad the conditions are.
                </p>
              </details>

              <details className="border-t border-white/10 py-3">
                <summary className="text-white font-medium cursor-pointer">
                  The forecast said &quot;Peak window&quot; but the actual
                  conditions were different. What happened?
                </summary>
                <p className="text-white/70 leading-relaxed mt-2">
                  Forecasts can be wrong. Lishka pulls weather, marine, and tide
                  data from external providers, and weather models are imperfect
                  (especially 5+ days out). Lishka is a planning tool, not a
                  safety system. Always verify local conditions, weather, and
                  tide before going on the water.
                </p>
              </details>

              <details className="border-t border-white/10 py-3">
                <summary className="text-white font-medium cursor-pointer">
                  I uploaded a photo and the species identification is wrong.
                  Can I fix it?
                </summary>
                <p className="text-white/70 leading-relaxed mt-2">
                  Tap the catch, then edit the species name. The AI is a
                  starting point, not the final word. Many fish have very
                  similar appearances and the model can confuse close relatives.
                </p>
              </details>

              <details className="border-t border-white/10 py-3">
                <summary className="text-white font-medium cursor-pointer">
                  How do I enable notifications?
                </summary>
                <p className="text-white/70 leading-relaxed mt-2">
                  Profile → Notifications inside the app. If you previously
                  declined the iOS permission, you&apos;ll need to enable it in
                  iOS Settings → Lishka → Notifications first.
                </p>
              </details>

              <details className="border-t border-white/10 py-3">
                <summary className="text-white font-medium cursor-pointer">
                  How do I change my fishing method or boat size?
                </summary>
                <p className="text-white/70 leading-relaxed mt-2">
                  On the home tab, tap the chip at the top showing your current
                  method and session length. The score recalculates immediately.
                </p>
              </details>

              <details className="border-t border-white/10 py-3">
                <summary className="text-white font-medium cursor-pointer">
                  How do I delete my account?
                </summary>
                <p className="text-white/70 leading-relaxed mt-2">
                  Profile → Settings → Delete Account. Your data is removed
                  within 30 days. See the{" "}
                  <a href="/privacy-policy" className="text-white underline">
                    Privacy Policy
                  </a>{" "}
                  for details.
                </p>
              </details>

              <details className="border-t border-white/10 py-3">
                <summary className="text-white font-medium cursor-pointer">
                  Does Lishka work outside Europe?
                </summary>
                <p className="text-white/70 leading-relaxed mt-2">
                  Yes. Forecasts work anywhere Open-Meteo provides marine and
                  weather data, which is effectively worldwide. Some regions
                  have more accurate local-model coverage than others.
                </p>
              </details>

              <details className="border-t border-white/10 py-3 border-b">
                <summary className="text-white font-medium cursor-pointer">
                  Is my data shared with anyone?
                </summary>
                <p className="text-white/70 leading-relaxed mt-2">
                  We don&apos;t sell or share your personal data with
                  advertisers. Photos you upload are sent to OpenAI for species
                  identification. Weather and tide providers receive only
                  latitude and longitude, no personal identifiers. Full
                  breakdown in the{" "}
                  <a href="/privacy-policy" className="text-white underline">
                    Privacy Policy
                  </a>
                  .
                </p>
              </details>
            </div>

            <div className="space-y-4 pt-6">
              <h2 className="text-lg font-semibold text-white">
                Reporting a bug
              </h2>
              <p className="text-white/70 leading-relaxed">
                When you write in, the details that help most are:
              </p>
              <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
                <li>Your device model and iOS / Android version</li>
                <li>What you were doing when it happened</li>
                <li>What you expected to see vs what you actually saw</li>
                <li>A screenshot or screen recording, if you can</li>
              </ul>
            </div>

            <div className="space-y-4 pt-6 pb-10">
              <h2 className="text-lg font-semibold text-white">
                Reporting inappropriate content
              </h2>
              <p className="text-white/70 leading-relaxed">
                Lishka stores user-uploaded photos privately. They&apos;re never
                shown to other users. If you ever come across content in the app
                that you believe shouldn&apos;t be there, write to{" "}
                <a
                  href="mailto:legal@lishka.app"
                  className="text-white underline"
                >
                  legal@lishka.app
                </a>{" "}
                and we&apos;ll investigate within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </LandingPageLayout>
  );
};

export default SupportPage;
