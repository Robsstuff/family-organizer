// ==================== CACHE (Offline Support) ====================
const CACHE_NAME = 'family-organizer-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(['./']))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Don't cache API calls or external services
  if (url.includes('script.google.com') || url.includes('googleapis.com') ||
      url.includes('openweathermap') || url.includes('corsproxy') ||
      url.includes('firebaseio') || e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(response => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      }
      return response;
    }))
  );
});

// ==================== FIREBASE MESSAGING (Push Notifications) ====================
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDiVBo057jNj_xf0AIySb40igWFufzpDec",
  authDomain: "family-organizer-84c71.firebaseapp.com",
  projectId: "family-organizer-84c71",
  storageBucket: "family-organizer-84c71.firebasestorage.app",
  messagingSenderId: "219656964422",
  appId: "1:219656964422:web:9642eefcabc80c7fa0bd47"
});

const messaging = firebase.messaging();

// Handle background push messages (app is closed or in background)
messaging.onBackgroundMessage(payload => {
  const title = payload.notification?.title || '👨‍👩‍👧‍👦 Family Organizer';
  const options = {
    body: payload.notification?.body || '',
    icon: './icon-192.svg',
    badge: './icon-192.svg',
    tag: 'family-daily',
    renotify: true,
    data: {
      url: 'https://robsstuff.github.io/family-organizer/?summary=1',
      type: payload.data?.type || ''
    }
  };
  return self.registration.showNotification(title, options);
});

// When user taps a notification, open/focus the app and trigger the summary modal
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const targetUrl = e.notification.data?.url || 'https://robsstuff.github.io/family-organizer/?summary=1';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes('family-organizer') && 'focus' in client) {
          // App already open — tell it to show the summary modal
          client.postMessage({ type: 'show_summary' });
          return client.focus();
        }
      }
      // App not open — open it with ?summary=1 so it shows the modal on load
      return clients.openWindow(targetUrl);
    })
  );
});
