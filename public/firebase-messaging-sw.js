importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyAc0WdoLmTjfR-ucxAON1Lr9abcQAeHM-4",
  authDomain:        "arain-database.firebaseapp.com",
  projectId:         "arain-database",
  storageBucket:     "arain-database.firebasestorage.app",
  messagingSenderId: "541671718502",
  appId:             "1:541671718502:web:ed236770ea20bd34cf37a7"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || '💍 Boda', {
    body:  body || '',
    icon:  icon || '/logo.jpg',
    badge: '/logo.jpg',
    vibrate: [200, 100, 200],
  });
});
