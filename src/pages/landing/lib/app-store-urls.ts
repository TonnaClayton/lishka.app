/*
  App store URLs — referenced by:
    - the smart download redirect (src/app/app/route.ts)
    - the App Store / Google Play badges in the hero (hero.tsx)
    - the same badges in the final CTA (final-cta.tsx)
    - the on-page smart QR (components/common/smart-qr.tsx)

  When the iOS storefront ID or Play Store listing URL changes,
  update them here only.

  ⚠️ PLAY_STORE_URL is currently an internal-test track. Replace
  with the public listing URL before flipping PLAY_STORE_LIVE:
    https://play.google.com/store/apps/details?id=<package>
*/

export const APP_STORE_URL =
  "https://apps.apple.com/us/app/lishka/id6767207290";

export const PLAY_STORE_URL =
  "https://play.google.com/apps/internaltest/4698458480381463836";

/*
  Master switch for anything Android-facing on the landing page.

    true  — Google Play badges link to PLAY_STORE_URL, the smart QR
            encodes /app (UA-detects between the two stores), and the
            /app route redirects Android UAs to Google Play.
    false — Google Play badges swap to a non-clickable "Coming soon"
            pill, the smart QR encodes APP_STORE_URL directly, and
            the /app route always redirects to the App Store.

  Flip to true the day the Play Store listing is public. That single
  change activates the badge, the QR path, and the smart redirect
  simultaneously with no other edits.
*/
export const PLAY_STORE_LIVE = false;
