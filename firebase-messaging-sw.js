importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Use the same Firebase web app configuration as index.html.
firebase.initializeApp({
  apiKey: 'AIzaSyBlT2UKLGBum9xTFmNusQHv9IRastAQqaA',
  authDomain: 'boyne-rugby-tracker.firebaseapp.com',
  projectId: 'boyne-rugby-tracker',
  storageBucket: 'boyne-rugby-tracker.firebasestorage.app',
  messagingSenderId: '64724348826',
  appId: '1:64724348826:web:c71a4eee5b0121e412d423'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const title = payload.notification?.title || 'Boyne RFC U13';
  const options = {
    body: payload.notification?.body || 'New team update',
    data: payload.data || {},
    tag: payload.data?.tag || undefined
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification.data?.url || '/?portal=parent';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for(const client of list){
      if('focus' in client) return client.focus();
    }
    return clients.openWindow(target);
  }));
});

// PWA application shell support. Keep network data live and cache only stable root assets.
const PWA_CACHE = 'boyne-rfc-u13-pwa-v1';
const PWA_ASSETS = ['/manifest.webmanifest','/icon-192.png','/icon-192-maskable.png','/icon-512.png','/icon-512-maskable.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(PWA_CACHE).then(cache => cache.addAll(PWA_ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('boyne-rfc-u13-pwa-') && key !== PWA_CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if(event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if(event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/')));
    return;
  }
  if(PWA_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
  }
});
