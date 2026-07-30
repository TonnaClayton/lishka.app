/*
  Kill-switch service worker served at www.lishka.app/sw.js only.

  Backstory:
    Early builds of the site registered a workbox service worker
    under the www.lishka.app scope. When we later 308-redirected
    all www.lishka.app traffic to the apex, that old SW kept
    intercepting navigations before the redirect could fire —
    users on www stayed pinned to whatever HTML the old SW had
    precached, including the "Coming soon to Google Play" badge
    that shipped before the Play Store went live.

    The browser's normal SW update path can't rescue them: the
    update fetches /sw.js and treats a 3xx response as a network
    error, so the update silently fails and the stale SW stays
    installed forever.

    This file is what the update fetch returns instead. Vercel's
    routing (see vercel.json) exempts /sw.js from the www→apex
    redirect and rewrites it to this file. That gives the browser
    a real 200 with fresh bytes, which triggers an install.

  What this SW does:
    1. skipWaiting on install so it activates on the current visit.
    2. On activate: claim clients, wipe every cache, unregister
       itself, then navigate every open tab.
    3. The tab reload has no SW in front of it any more, so the
       request goes to the network, hits Vercel's 308, and lands
       on apex lishka.app with the current bundle.

    One silent reload, then www is SW-free for every user.
*/

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();

      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));

      await self.registration.unregister();

      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })(),
  );
});
