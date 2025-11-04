// Enhanced Service Worker for persistent notifications
console.log('🔧 Service Worker loaded');

self.addEventListener('message', function(event) {
  console.log('📨 SW Message received:', event.data);
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag } = event.data;
    
    self.registration.showNotification(title, {
      body: body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: tag || 'coach-notification',
      requireInteraction: true, // Android'de bildirim ekranında kalır
      silent: false,
      vibrate: [300, 200, 300, 200, 300],
      data: {
        url: '/coach',
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'open',
          title: '📱 Koç Panelini Aç',
          icon: '/favicon.ico'
        },
        {
          action: 'close',
          title: '✕ Kapat'
        }
      ]
    }).then(() => {
      console.log('✅ Persistent notification shown');
    }).catch(error => {
      console.error('❌ Notification show failed:', error);
    });
  }
});

// Install event
self.addEventListener('install', function(event) {
  console.log('⚡ Service Worker installing');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', function(event) {
  console.log('🚀 Service Worker activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('notificationclick', function(event) {
  console.log('📱 Notification clicked:', event.action);
  event.notification.close();
  
  if (event.action === 'close') {
    // Just close the notification
    return;
  }
  
  // For any other action or no action, open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Check if app is already open
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes(self.location.origin)) {
          console.log('🎯 Focusing existing window');
          return client.focus();
        }
      }
      
      // If app is not open, open a new window
      if (clients.openWindow) {
        console.log('🆕 Opening new window');
        return clients.openWindow('/coach');
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  console.log('🔕 Notification closed:', event.notification.tag);
});