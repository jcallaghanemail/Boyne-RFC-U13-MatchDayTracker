importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Use the same Firebase web app configuration as index.html.
firebase.initializeApp({
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID'
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
