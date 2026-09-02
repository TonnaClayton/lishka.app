import React from "react";
import LandingPageLayout, {
  LandingPageHeader,
} from "@/components/layout/landing-page-layout";

/**
 * Data deletion instructions.
 *
 * Exists because Meta requires a public URL describing how someone
 * deletes the data an app holds on them — the Facebook app's "User
 * data deletion" field points here, and the app cannot be published
 * without it. It is also the page to give Apple and Google when they
 * ask the same question.
 *
 * Everything below must stay true to what the app actually does:
 * Profile → Delete Account calls DELETE /user, which removes the
 * account, and the Privacy Policy's 30-day window is what governs
 * backups. If either changes, this page changes with it.
 */
const DataDeletionPage: React.FC = () => {
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
                Delete Your Data
              </h1>
            </div>

            <div className="space-y-4">
              <p className="text-white/70 leading-relaxed">
                You can delete your Lishka account and everything we hold
                about you at any time. There are two ways to do it — from
                inside the app, or by email if you can no longer sign in.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">
                Delete from the app
              </h2>
              <p className="text-white/70 leading-relaxed">
                This is the fastest route and takes effect immediately.
              </p>
              <ol className="list-decimal list-inside text-white/70 space-y-2 ml-4">
                <li>Open Lishka and sign in.</li>
                <li>Go to your profile, then open the menu.</li>
                <li>
                  Scroll to the Account section and tap{" "}
                  <span className="text-white">Delete Account</span>.
                </li>
                <li>Confirm. Your account is removed and you are signed out.</li>
              </ol>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">
                Delete by email
              </h2>
              <p className="text-white/70 leading-relaxed">
                If you have lost access to your account, email{" "}
                <a
                  href="mailto:clayton@lishka.app?subject=Data%20deletion%20request"
                  className="text-white underline underline-offset-2"
                >
                  clayton@lishka.app
                </a>{" "}
                from the address you signed up with, asking us to delete your
                data. We will confirm the request and complete it within 30
                days. We may ask you to verify that the address is yours before
                we act, so that nobody else can delete your account.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">
                What gets deleted
              </h2>
              <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
                <li>Your account and sign-in credentials</li>
                <li>Your profile, including your name and avatar</li>
                <li>Your photo gallery and any catches you logged</li>
                <li>Your saved locations and app settings</li>
                <li>Your onboarding answers and preferences</li>
              </ul>
              <p className="text-white/70 leading-relaxed">
                Deletion is permanent. We cannot restore an account once it has
                been removed, so download anything you want to keep first.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">
                What we may keep, and why
              </h2>
              <p className="text-white/70 leading-relaxed">
                Residual copies can persist in encrypted backups for up to 30
                days before they are overwritten. Beyond that, we retain only
                what the law requires us to — for example billing and tax
                records for a completed subscription, and records needed to
                prevent fraud. These are kept separately and are not used to
                identify you or to contact you.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">
                Your subscription
              </h2>
              <p className="text-white/70 leading-relaxed">
                Deleting your account does not cancel a subscription, because
                subscriptions are billed by Apple or Google rather than by us.
                Cancel it in your device settings first — on iPhone under Apple
                Account then Subscriptions, on Android in the Play Store under
                Payments and subscriptions — otherwise billing continues even
                though the account is gone.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">
                Questions
              </h2>
              <p className="text-white/70 leading-relaxed">
                Email{" "}
                <a
                  href="mailto:clayton@lishka.app"
                  className="text-white underline underline-offset-2"
                >
                  clayton@lishka.app
                </a>{" "}
                or message us on Instagram @lishka.app. Our{" "}
                <a
                  href="/privacy-policy"
                  className="text-white underline underline-offset-2"
                >
                  Privacy Policy
                </a>{" "}
                explains what we collect and how long we keep it.
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

export default DataDeletionPage;
