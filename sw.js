/*
  ================================================================
   BACKYARD BIRD FARM — sw.js (the "service worker")
  ================================================================
  This little helper keeps a copy of the game on the iPad, so it
  opens instantly and still works with no internet.

  How it stays up to date: it always shows the saved copy right
  away, then quietly checks the internet for a newer one. If there
  is one, you'll see it the NEXT time you open the game.

  If you change the game, bump the version number below.
  ================================================================
*/
const VERSION = "bird-farm-v9-0";
const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./game.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./favicon-32.png",
];

// First install: save every game file
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

// Throw away copies from older versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Show the saved copy first, and refresh it in the background
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameSite = url.origin === self.location.origin;
  const isFont = url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com");
  if (!sameSite && !isFont) return;
  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const saved = await cache.match(req, { ignoreSearch: sameSite });
      const fresh = fetch(req)
        .then((res) => { if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone()); return res; })
        .catch(() => saved);
      return saved || fresh;
    })
  );
});
