const VERSION = "neo-offline-v1";
const PAGE_CACHE = VERSION + "-private-pages";
const ASSET_CACHE = VERSION + "-assets";
const OFFLINE_URL = "/offline.html";
const APP_PATHS = ["/dashboard", "/transactions", "/budgets", "/goals", "/portfolio", "/liabilities", "/reports"];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(ASSET_CACHE);
    await cache.addAll([OFFLINE_URL, "/manifest.webmanifest", "/neo-icon.svg"]);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith("neo-offline-") && ![PAGE_CACHE, ASSET_CACHE].includes(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  if (event.data?.type === "CLEAR_PRIVATE_CACHE") {
    event.waitUntil(caches.delete(PAGE_CACHE));
  }
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const path = url.pathname;
      if (path === "/login" || path.startsWith("/auth/")) {
        const response = await fetch(request);
        if (path === "/login" && response.ok) await caches.delete(PAGE_CACHE);
        return response;
      }
      try {
        const response = await fetch(request);
        if (response.ok && APP_PATHS.some(p => path === p || path.startsWith(p + "/"))) {
          const cache = await caches.open(PAGE_CACHE);
          await cache.put(path, response.clone());
        }
        return response;
      } catch {
        const cached = await caches.match(path, { cacheName: PAGE_CACHE });
        if (cached) return cached;
        return (await caches.match(OFFLINE_URL, { cacheName: ASSET_CACHE })) || new Response("You are offline. Open a page once while connected to make it available offline.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
    })());
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || ["/neo-icon.svg", "/manifest.webmanifest"].includes(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(ASSET_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })());
  }
});
