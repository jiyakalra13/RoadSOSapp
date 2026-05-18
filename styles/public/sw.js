const CACHE_NAME = 'roadsos-v1';
const STATIC_CACHE = 'roadsos-static-v1';
const DYNAMIC_CACHE = 'roadsos-dynamic-v1';

// Core app shell files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// First aid data to cache for offline use
const FIRST_AID_DATA = {
  bleeding: `**Stop Severe Bleeding:**

1. Apply direct pressure with clean cloth
2. Elevate injured area above heart
3. Add more layers if blood soaks through
4. Call 911 if bleeding won't stop`,
  
  burn: `**Burn First Aid:**

1. Cool with running water 10-20 min
2. Remove jewelry unless stuck
3. Cover loosely with clean bandage
4. Seek help for severe burns`,

  cpr: `**CPR Steps (Adult):**

1. Check responsiveness - tap & shout
2. Call 911 immediately
3. Push hard & fast center of chest
4. 100-120 compressions per minute`,

  choking: `**Choking Response:**

1. Ask "Are you choking?"
2. Stand behind, wrap arms around
3. Make fist above navel
4. Quick upward thrusts until clear`,

  fracture: `**Fracture First Aid:**

1. Keep injured area still
2. Apply ice wrapped in cloth
3. Elevate if possible
4. Immobilize with splint if trained`,

  shock: `**Treating Shock:**

1. Lay person flat, elevate legs
2. Keep warm with blanket
3. Do not give food/drink
4. Call 911 immediately`,

  heart_attack: `**Heart Attack Signs & Response:**

1. Chest pain/pressure, arm pain
2. Call 911 immediately
3. Have them chew aspirin if available
4. Keep calm, monitor breathing`,

  stroke: `**Stroke Signs (FAST):**

F - Face drooping
A - Arm weakness
S - Speech difficulty
T - Time to call 911`,
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests
  if (url.origin !== location.origin) return;

  // For navigation requests, use network-first strategy
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the page
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Return cached page or offline fallback
          return caches.match(request).then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // For static assets, use cache-first strategy
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // For API requests, use network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Default: network-first
  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_FIRST_AID') {
    const topic = event.data.topic;
    const response = FIRST_AID_DATA[topic] || FIRST_AID_DATA.bleeding;
    event.ports[0].postMessage({ data: response });
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for queued SOS messages (when back online)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sos-sync') {
    event.waitUntil(syncSOSMessages());
  }
});

async function syncSOSMessages() {
  // This would sync any queued emergency messages when back online
  console.log('[SW] Syncing SOS messages...');
}

// Push notifications for emergency updates
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'Emergency update',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'emergency-notification',
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'RoadSOS Alert', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
