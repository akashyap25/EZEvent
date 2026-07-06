/**
 * EZEvent Service Worker
 * 
 * Features:
 * - App shell caching (offline-first for static assets)
 * - API response caching (events, tickets for offline venue access)
 * - Offline fallback page
 * - Push notification handling
 * - Background sync for offline actions
 */

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `ezevent-static-${CACHE_VERSION}`;
const API_CACHE = `ezevent-api-${CACHE_VERSION}`;
const TICKET_CACHE = `ezevent-tickets-${CACHE_VERSION}`;

// App shell files to precache
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

// API paths to cache for offline access
const CACHEABLE_API = [
  '/api/events',
  '/api/categories',
  '/api/users/me',
  '/api/bookmarks',
  '/api/orders'
];

// ─── Install ────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ───────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => 
      Promise.all(
        keys
          .filter((k) => k.startsWith('ezevent-') && k !== STATIC_CACHE && k !== API_CACHE && k !== TICKET_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch ──────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (except API)
  if (url.origin !== self.location.origin && !url.pathname.startsWith('/api')) return;

  // Strategy: Tickets/Orders — Network first, fall back to cache (critical for venue access)
  if (url.pathname.includes('/api/orders') || url.pathname.includes('/api/bookmarks')) {
    event.respondWith(networkFirstWithCache(request, TICKET_CACHE));
    return;
  }

  // Strategy: API responses — Stale-while-revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // Strategy: Static assets — Cache first, network fallback
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Strategy: Navigation (HTML pages) — Network first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // Default: Network first
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

// ─── Caching Strategies ─────────────────────────────────────────────────

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'You are offline. Showing cached data.',
      offline: true 
    }), { headers: { 'Content-Type': 'application/json' } });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  return cached || (await fetchPromise) || new Response(
    JSON.stringify({ success: false, message: 'Offline', offline: true }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('', { status: 503 });
  }
}

function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf)$/.test(pathname);
}

// ─── Push Notifications ─────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  let data = { title: 'EZEvent', body: 'You have a new notification' };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    data.body = event.data?.text() || data.body;
  }

  const options = {
    body: data.body || data.message,
    icon: '/logo-192.png',
    badge: '/logo-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      id: data.id
    },
    actions: data.actions || [
      { action: 'open', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  if (event.action === 'dismiss') return;
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Focus existing window if available
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(url);
    })
  );
});

// ─── Background Sync ────────────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookmarks') {
    event.waitUntil(syncBookmarks());
  }
  if (event.tag === 'sync-registrations') {
    event.waitUntil(syncRegistrations());
  }
});

async function syncBookmarks() {
  // Replay queued bookmark actions when back online
  const cache = await caches.open('ezevent-sync');
  const requests = await cache.keys();
  for (const request of requests) {
    if (request.url.includes('/api/bookmarks')) {
      try {
        await fetch(request.clone());
        await cache.delete(request);
      } catch (e) { /* will retry on next sync */ }
    }
  }
}

async function syncRegistrations() {
  const cache = await caches.open('ezevent-sync');
  const requests = await cache.keys();
  for (const request of requests) {
    if (request.url.includes('/api/events') && request.url.includes('/register')) {
      try {
        await fetch(request.clone());
        await cache.delete(request);
      } catch (e) { /* will retry */ }
    }
  }
}
