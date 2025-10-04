// public/sw.js
const CACHE = "jitsutracker-v1";
const ASSETS = [
  "/", 
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// Install: pre-cache a few essentials
self.addEventListener("install", (event) => {
  console.log("[SW] Install event");
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // activate immediately
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate event");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : null)))
    )
  );
  return self.clients.claim();
});

// Fetch: respond from cache, fall back to network
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request)
        .then((resp) => {
          // Clone and store in cache if ok
          const copy = resp.clone();
          if (resp.ok) {
            caches.open(CACHE).then((cache) => {
              cache.put(event.request, copy).catch(() => {});
            });
          }
          return resp;
        })
        .catch((err) => {
          console.warn("[SW] Fetch failed; returning fallback if available.", err);
          return cached || Response.error();
        });
    })
  );
});
