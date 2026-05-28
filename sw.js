const CACHE_NAME = 'myself-v1';
const ASSETS = ['./index.html', './manifest.json'];

// Install
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// Fetch (cache first)
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// Push notification
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'MYSELF', body: 'Rappel de tâche' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icon.svg',
      badge: './icon.svg',
      tag: data.tag || 'myself-notif',
      renotify: true,
      requireInteraction: false,
      data: { url: './' }
    })
  );
});

// Notification click
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('./'));
});

// ── Alarm scheduler ──────────────────────────────────────────────
// The main page posts messages to schedule/cancel alarms
const alarms = new Map();

self.addEventListener('message', e => {
  if (e.data.type === 'SCHEDULE_ALARM') {
    const { id, delay, title, body } = e.data;
    if (alarms.has(id)) clearTimeout(alarms.get(id));
    const tid = setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: './icon.svg',
        tag: id,
        renotify: true
      });
      alarms.delete(id);
    }, delay);
    alarms.set(id, tid);
  }
  if (e.data.type === 'CANCEL_ALARM') {
    if (alarms.has(e.data.id)) {
      clearTimeout(alarms.get(e.data.id));
      alarms.delete(e.data.id);
    }
  }
  if (e.data.type === 'CANCEL_ALL') {
    alarms.forEach(t => clearTimeout(t));
    alarms.clear();
  }
});
