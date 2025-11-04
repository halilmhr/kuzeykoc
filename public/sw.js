// Service Worker for notifications
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon } = event.data;
    
    self.registration.showNotification(title, {
      body: body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'student-activity',
      requireInteraction: false,
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'view',
          title: 'Görüntüle'
        }
      ]
    });
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.action === 'view') {
    // Focus on the app window
    event.waitUntil(
      clients.matchAll().then(function(clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});