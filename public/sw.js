// Enhanced Service Worker for persistent notifications
console.log('🔧 Service Worker loaded');

// Background sync for notifications when app is closed
self.addEventListener('sync', function(event) {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkForNewNotifications());
  }
});

// Periodic background sync (Chrome only)
self.addEventListener('periodicsync', function(event) {
  console.log('⏰ Periodic sync triggered:', event.tag);
  
  if (event.tag === 'check-notifications-periodic') {
    event.waitUntil(checkForNewNotifications());
  }
});

// Check for notifications in background
async function checkForNewNotifications() {
  try {
    console.log('🔍 Checking notifications in background...');
    
    // Get stored coach ID from indexed DB or cache
    const cache = await caches.open('coach-cache');
    const coachData = await cache.match('/coach-data');
    
    if (!coachData) {
      console.log('❌ No coach data found in cache');
      return;
    }
    
    const coach = await coachData.json();
    if (!coach.id) return;
    
    // For now, skip background fetching and rely on active polling
    // TODO: Implement proper background sync with Supabase credentials
    console.log('📱 Background sync triggered, but skipping API call for now');
    return;
    
    if (!response.ok) {
      console.log('❌ Failed to fetch notifications');
      return;
    }
    
    const notifications = await response.json();
    
    // Show notifications that aren't shown yet
    const lastCheck = await getLastNotificationCheck();
    const newNotifications = notifications.filter(n => 
      new Date(n.created_at) > new Date(lastCheck)
    );
    
    for (const notification of newNotifications) {
      await self.registration.showNotification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.type,
        requireInteraction: true,
        silent: false,
        vibrate: [400, 200, 400, 200, 400],
        data: {
          url: '/coach',
          notificationId: notification.id,
          timestamp: notification.created_at
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
      });
    }
    
    // Update last check time
    await setLastNotificationCheck(new Date().toISOString());
    
    console.log(`✅ Background check complete: ${newNotifications.length} new notifications`);
    
  } catch (error) {
    console.error('❌ Background notification check failed:', error);
  }
}

// Helper functions for IndexedDB
async function getLastNotificationCheck() {
  try {
    const cache = await caches.open('coach-cache');
    const response = await cache.match('/last-notification-check');
    if (response) {
      const data = await response.text();
      return data;
    }
    return new Date(0).toISOString(); // Return epoch if no previous check
  } catch (error) {
    return new Date(0).toISOString();
  }
}

async function setLastNotificationCheck(timestamp) {
  try {
    const cache = await caches.open('coach-cache');
    await cache.put('/last-notification-check', new Response(timestamp));
  } catch (error) {
    console.error('Failed to set last notification check:', error);
  }
}

// Handle direct messages from app
self.addEventListener('message', function(event) {
  console.log('📨 SW Message received:', event.data);
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag } = event.data;
    
    self.registration.showNotification(title, {
      body: body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: tag || 'coach-notification',
      requireInteraction: true,
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
      console.log('✅ Direct notification shown');
    }).catch(error => {
      console.error('❌ Notification show failed:', error);
    });
  }
  
  // Store coach data for background sync
  if (event.data && event.data.type === 'STORE_COACH_DATA') {
    const coachData = event.data.coach;
    caches.open('coach-cache').then(cache => {
      cache.put('/coach-data', new Response(JSON.stringify(coachData)));
      console.log('💾 Coach data stored for background sync');
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