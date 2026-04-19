/* Operator House — Service Worker v1.0.0
   Cache-first for static assets, network-first for API calls */

const CACHE_NAME = "oh-v2";
const STATIC_ASSETS = ["/", "/offline.html", "/about", "/privacy", "/terms"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Always network-first for API calls
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: "You are offline" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, images, fonts)
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return res;
      }))
    );
    return;
  }

  // Network-first for HTML navigation
  event.respondWith(
    fetch(request).catch(() => caches.match(request) || caches.match("/offline.html") || caches.match("/"))
  );
});

// ── Push Notifications ────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Operator House', body: 'You have a new update.', url: '/dashboard' };
  try { data = { ...data, ...event.data.json() }; } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663270045694/UYrVyz2BYHYzFAx4PneEpK/oh-favicon-64_869fa057.png',
      badge: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663270045694/UYrVyz2BYHYzFAx4PneEpK/oh-favicon-64_869fa057.png',
      data: { url: data.url },
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
      const existing = cs.find(c => c.url.includes(url));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});

// ── Background Sync ───────────────────────────────────────────────────────
const SYNC_QUEUE_KEY = 'oh_sync_queue';

self.addEventListener('sync', (event) => {
  if (event.tag === 'oh-mutations') {
    event.waitUntil(replayQueue());
  }
});

async function replayQueue() {
  const cache = await caches.open(CACHE_NAME);
  const queued = await cache.match('/__sync_queue__');
  if (!queued) return;
  let items = [];
  try { items = await queued.json(); } catch { return; }
  const remaining = [];
  for (const item of items) {
    try {
      const res = await fetch(item.url, { method: item.method, headers: item.headers, body: item.body, credentials: 'include' });
      if (!res.ok) remaining.push(item);
    } catch { remaining.push(item); }
  }
  if (remaining.length === 0) {
    await cache.delete('/__sync_queue__');
  } else {
    await cache.put('/__sync_queue__', new Response(JSON.stringify(remaining), { headers: { 'Content-Type': 'application/json' } }));
  }
}
