// ────────────────────────────────────────────────────────────────────────────
// Meta Pixel — typed helpers for the standard / custom events we fire from
// landing-page code. The Pixel itself is initialised in `index.html`
// (synchronous, before React hydrates) so the auto `PageView` fires on every
// route load including the initial paint. This module is for the events
// we trigger from app code: `Lead` on the primary CTA, etc.
//
// The library is loaded lazily into `window.fbq` by Meta's standard
// snippet. In development we stub it to a no-op so calls from React
// components don't throw when the snippet is gated out (see index.html).
//
// Event taxonomy:
//   - `PageView`      — automatic on every page load (index.html)
//   - `Lead`          — user clicked the primary "Get Started" CTA
//                       (current funnel: landing → login flow)
//   - When App Store / Play Store badges land on the landing page,
//     add `trackAppDownloadIntent(platform)` calls below.
// ────────────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    fbq?: (
      action: "track" | "trackCustom" | "init",
      event: string,
      params?: Record<string, unknown>,
    ) => void;
  }
}

/** Safe `fbq(...)` call. No-op when the snippet is stubbed (dev mode) or
 *  the library hasn't loaded yet (network failure, ad-blocker). */
function fbq(
  action: "track" | "trackCustom",
  event: string,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;
  try {
    window.fbq(action, event, params);
  } catch {
    // Swallowed — tracking failures must never break the page.
  }
}

/**
 * Fire the standard `Lead` event when a visitor commits to the primary
 * conversion (clicking "Get Started" on the landing page). Meta's
 * algorithm understands the standard `Lead` event natively, which
 * makes it the best event to optimise paid campaigns against.
 *
 * The `content_name` parameter lets us tell the two future variants
 * apart in Events Manager — "Get Started → login" today, and once App
 * Store / Play Store badges ship, "iOS download" / "Android download".
 */
export function trackLead(contentName: string): void {
  fbq("track", "Lead", { content_name: contentName });
}

/**
 * Fire when a visitor taps an App Store / Play Store badge on the
 * landing page. Logged as `Lead` with a platform-specific
 * `content_name` so both can be optimised together but inspected
 * separately. Wire this on the badges once they ship.
 */
export function trackAppDownloadIntent(platform: "ios" | "android"): void {
  fbq("track", "Lead", {
    content_name: platform === "ios" ? "iOS download" : "Android download",
    content_category: "App download",
  });
}
