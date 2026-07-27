import { registerSW } from "virtual:pwa-register";

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
