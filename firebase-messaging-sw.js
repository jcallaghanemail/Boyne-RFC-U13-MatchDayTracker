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
