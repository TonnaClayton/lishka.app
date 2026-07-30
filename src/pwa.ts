import { registerSW } from "virtual:pwa-register";

/*
  Host normalization — www → apex.

  We previously did this at the edge with a Vercel 308 redirect,
  but that broke service-worker updates on www.lishka.app: the
  browser fetches /sw.js as part of its update check, saw a 3xx,
  and per the SW spec treated it as a network error — so the old
  SW at www stayed installed forever, kept intercepting
  navigations, and kept serving stale precached HTML (including
  the "Coming soon to Google Play" badge from before launch).

  The fix runs here instead. Once fresh JS loads on www — which
  can only happen after the SW at www has been unstuck and
  updated — this line bounces the tab to apex. Every subsequent
  visit lands on apex directly.

  Kept before registerSW() so the redirect wins before we do any
  more work. window.location.replace so it doesn't leave a
  history entry the user has to press Back through.
*/

if (
  typeof window !== "undefined" &&
  window.location.hostname === "www.lishka.app"
) {
  window.location.replace(
    "https://lishka.app" + window.location.pathname + window.location.search,
  );
}

/*
  Service worker registration.

  Paired with the workbox config in vite.config.ts:
    - HTML is NOT precached; navigation requests go NetworkFirst
      so every visit pulls fresh index.html from Vercel (with an
      offline fallback to the cached HTML).
    - skipWaiting + clientsClaim means the new SW activates and
      takes control the moment it downloads — no user gesture
      required.

  Why the controllerchange auto-reload:
    Without it, a returning visitor whose browser already has the
    OLD SW installed will still see stale content on the visit
    where the new SW gets installed. The old SW serves cached HTML
    from THIS pageview; the new SW only kicks in on the NEXT visit.
    That was the "still seeing Coming soon" bug.

    The listener fires when a new SW takes control of the page. We
    reload once, which lets the new SW serve fresh HTML (via the
    NetworkFirst nav rule), which references the new JS chunk
    hashes, which render the current build. One extra reload —
    quiet, unavoidable, and only for visitors carrying an outdated
    SW.

    The `navigator.serviceWorker.controller` check skips the
    first-install case: on a truly fresh browser there IS no prior
    controller, controllerchange fires once as the fresh SW takes
    over, and reloading there would be wasted work (the page
    already loaded from network anyway).
*/

if (
  typeof navigator !== "undefined" &&
  "serviceWorker" in navigator &&
  navigator.serviceWorker.controller
) {
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
}

registerSW({ immediate: true, onNeedRefresh() {} });
