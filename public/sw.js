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
    console.log('🔍 Background notification check başladı...');
    
    // Get stored coach data
    const cache = await caches.open('coach-cache');
    const coachData = await cache.match('/coach-data');
    
    if (!coachData) {
      console.log('❌ Cache\'de koç verisi yok');
      return;
    }
    
    const coach = await coachData.json();
    if (!coach.id) return;
    
    // Get Supabase credentials from cache
    const credentialsResponse = await cache.match('/supabase-credentials');
    if (!credentialsResponse) {
      console.log('❌ Supabase credentials bulunamadı');
      return;
    }
    
    const credentials = await credentialsResponse.json();
    
    // Direct Supabase API call for background notifications
    const response = await fetch(`${credentials.url}/rest/v1/notifications?coach_id=eq.${coach.id}&is_read=eq.false&order=created_at.desc`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': credentials.anonKey,
        'Authorization': `Bearer ${credentials.anonKey}`
      }
    });
    
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
    
    console.log(`🔔 ${newNotifications.length} yeni bildirim bulundu`);
    
    // Show each new notification
    for (const notification of newNotifications) {
      await self.registration.showNotification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'coach-notification-' + notification.id,
        requireInteraction: true,
        silent: true,
        // vibrate kaldırıldı - silent ile çakışıyor
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
    console.log('✅ Background notification check tamamlandı');
    
  } catch (error) {
    console.error('❌ Background notification check hatası:', error);
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
      silent: true, // Ses kapalı - vibrate kaldırıldı
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
  
  // Store Supabase credentials for background API calls
  if (event.data && event.data.type === 'STORE_SUPABASE_CREDENTIALS') {
    const credentials = event.data.credentials;
    caches.open('coach-cache').then(cache => {
      cache.put('/supabase-credentials', new Response(JSON.stringify(credentials)));
      console.log('🔑 Supabase credentials stored for background sync');
      // Start background checking when credentials are available
      startBackgroundNotificationCheck();
    });
  }
  
  // Handle visibility changes
  if (event.data && event.data.type === 'VISIBILITY_CHANGE') {
    isAppVisible = event.data.isVisible;
    console.log(`👁️ App visibility changed: ${isAppVisible ? 'visible' : 'hidden'}`);
  }
});

// Background notification checking timer
let backgroundTimer;
let isAppVisible = true;

function startBackgroundNotificationCheck() {
  if (backgroundTimer) {
    clearInterval(backgroundTimer);
  }
  
  console.log('⏰ Starting background notification check every 30 seconds');
  
  // Check immediately
  checkForNewNotifications();
  
  // Check every 30 seconds, more frequent when app is hidden
  backgroundTimer = setInterval(() => {
    const checkInterval = isAppVisible ? 30000 : 15000; // 15 seconds when hidden
    console.log(`🔍 Background check for new notifications (app ${isAppVisible ? 'visible' : 'hidden'})`);
    checkForNewNotifications();
  }, 15000); // Check every 15 seconds
}

function stopBackgroundNotificationCheck() {
  if (backgroundTimer) {
    clearInterval(backgroundTimer);
    backgroundTimer = null;
    console.log('⏹️ Background notification check stopped');
  }
}

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