const CACHE_VERSION = "als-pwa-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(["/", "/index.html"]);
    })()
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (!key.startsWith(CACHE_VERSION)) {
            return caches.delete(key);
          }
        })
      );
      self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const dest = req.destination;

  const cacheFirst = async () => {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (e) {
      return cached || Promise.reject(e);
    }
  };

  const networkFirstApi = async () => {
    const cache = await caches.open(RUNTIME_CACHE);
    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (e) {
      const cached = await cache.match(req);
      if (cached) return cached;
      throw e;
    }
  };

  const networkFirstDoc = async () => {
    const cache = await caches.open(STATIC_CACHE);
    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put("/index.html", res.clone());
      return res;
    } catch (e) {
      const cached = await cache.match("/index.html");
      if (cached) return cached;
      throw e;
    }
  };

  if (
    dest === "script" ||
    dest === "style" ||
    dest === "image" ||
    dest === "font" ||
    url.pathname.startsWith("/assets/")
  ) {
    event.respondWith(cacheFirst());
    return;
  }

  if (url.pathname.startsWith("/api/v1/")) {
    event.respondWith(networkFirstApi());
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(networkFirstDoc());
    return;
  }
});

// Precaching por mensaje
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data && data.type === "precache" && Array.isArray(data.urls)) {
    event.waitUntil(
      (async () => {
        try {
          const cache = await caches.open(RUNTIME_CACHE);
          await cache.addAll(data.urls);
        } catch (e) {
          // ignorar errores de precache
        }
      })()
    );
  }
});
