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
    console.log('🔍 ===== BACKGROUND NOTIFICATION CHECK BAŞLADI =====');
    const startTime = Date.now();
    
    // Get stored coach data
    const cache = await caches.open('coach-cache');
    console.log('📦 Cache açıldı');
    
    const coachData = await cache.match('/coach-data');
    
    if (!coachData) {
      console.log('❌ Cache\'de koç verisi YOK - Background sync çalışamaz');
      return;
    }
    console.log('✅ Coach data cache\'den alındı');
    
    const coach = await coachData.json();
    console.log('👤 Coach:', coach.fullName, '- ID:', coach.id);
    
    if (!coach.id) {
      console.log('❌ Coach ID yok!');
      return;
    }
    
    // Get Supabase credentials from cache
    const credentialsResponse = await cache.match('/supabase-credentials');
    if (!credentialsResponse) {
      console.log('❌ Supabase credentials cache\'de YOK');
      return;
    }
    console.log('✅ Credentials cache\'den alındı');
    
    const credentials = await credentialsResponse.json();
    console.log('🔑 Supabase bağlantı bilgileri hazır');
    
    // Direct Supabase API call for background notifications
    const apiUrl = `${credentials.url}/rest/v1/notifications?coach_id=eq.${coach.id}&is_read=eq.false&order=created_at.desc`;
    console.log('🌐 API çağrısı yapılıyor:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': credentials.anonKey,
        'Authorization': `Bearer ${credentials.anonKey}`
      }
    });
    
    console.log('📡 API yanıt durumu:', response.status, response.statusText);
    
    if (!response.ok) {
      console.log('❌ API çağrısı başarısız!');
      return;
    }
    
    const notifications = await response.json();
    console.log(`📬 API\'den ${notifications.length} okunmamış bildirim geldi`);
    
    // Show notifications that aren't shown yet
    const lastCheck = await getLastNotificationCheck();
    console.log('⏰ Son check zamanı:', lastCheck);
    
    const newNotifications = notifications.filter(n => 
      new Date(n.created_at) > new Date(lastCheck)
    );
    
    console.log(`🆕 ${newNotifications.length} YENI bildirim bulundu (toplam ${notifications.length} okunmamış)`);
    
    if (newNotifications.length === 0) {
      console.log('✓ Yeni bildirim yok');
      const elapsedTime = Date.now() - startTime;
      console.log(`✅ Check tamamlandı (${elapsedTime}ms)`);
      return;
    }
    
    // Show each new notification
    console.log('🔔 Bildirimler gösteriliyor...');
    for (const notification of newNotifications) {
      console.log(`  📨 Bildirim: "${notification.title}" (ID: ${notification.id})`);
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
    const now = new Date().toISOString();
    await setLastNotificationCheck(now);
    console.log('⏰ Son check zamanı güncellendi:', now);
    
    const elapsedTime = Date.now() - startTime;
    console.log(`✅ ===== BACKGROUND CHECK TAMAMLANDI (${elapsedTime}ms) =====`);
    
  } catch (error) {
    console.error('❌ ===== BACKGROUND CHECK HATASI =====');
    console.error('Hata:', error);
    console.error('Stack:', error.stack);
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
    console.log('👤 COACH DATA ALINDI:', coachData.fullName, '- ID:', coachData.id);
    caches.open('coach-cache').then(cache => {
      return cache.put('/coach-data', new Response(JSON.stringify(coachData)));
    }).then(() => {
      console.log('✅ Coach data CACHE\'e YAZILDI!');
    }).catch(error => {
      console.error('❌ Coach data cache hatası:', error);
    });
  }
  
  // Store Supabase credentials for background API calls
  if (event.data && event.data.type === 'STORE_SUPABASE_CREDENTIALS') {
    const credentials = event.data.credentials;
    console.log('🔑 CREDENTIALS ALINDI! Background sync başlatılıyor...');
    console.log('📍 Supabase URL:', credentials.url ? '✓ VAR' : '✗ YOK');
    console.log('🔐 Anon Key:', credentials.anonKey ? '✓ VAR' : '✗ YOK');
    
    caches.open('coach-cache').then(cache => {
      return cache.put('/supabase-credentials', new Response(JSON.stringify(credentials)));
    }).then(() => {
      console.log('� Credentials CACHE\'e YAZILDI!');
      console.log('🚀 BACKGROUND CHECK BAŞLATILIYOR...');
      // Start background checking when credentials are available
      startBackgroundNotificationCheck();
      console.log('✅ Background check timer KURULDU!');
    }).catch(error => {
      console.error('❌ Credentials cache hatası:', error);
    });
  }
  
  // Handle visibility changes
  if (event.data && event.data.type === 'VISIBILITY_CHANGE') {
    isAppVisible = event.data.isVisible;
    console.log(`👁️ App visibility changed: ${isAppVisible ? 'visible' : 'hidden'}`);
  }
});

// Background notification checking timer - AGGRESSIVE MODE
let backgroundTimer = null;
let isAppVisible = true;

function startBackgroundNotificationCheck() {
  // Clear any existing timer
  if (backgroundTimer) {
    clearInterval(backgroundTimer);
    backgroundTimer = null;
  }
  
  console.log('🚀 AGGRESSIVE MODE: Background notification check BAŞLATILIYOR!');
  
  // Check immediately when starting
  checkForNewNotifications().then(() => {
    console.log('✅ İlk background check tamamlandı');
  }).catch(err => {
    console.error('❌ İlk check hatası:', err);
  });
  
  // Android ULTRA AGGRESSIVE: Check every 5 seconds ALWAYS
  backgroundTimer = setInterval(() => {
    console.log(`🤖 AGGRESSIVE CHECK (Sayfa: ${isAppVisible ? 'AÇIK ✓' : 'KAPALI ✗'})`);
    checkForNewNotifications().catch(err => {
      console.error('❌ Background check hatası:', err);
    });
  }, 5000); // 5 saniye - ULTRA AGGRESSIVE
  
  console.log('⏰ Background timer KURULDU - Her 5 saniyede bir check!');
}

function stopBackgroundNotificationCheck() {
  if (backgroundTimer) {
    clearInterval(backgroundTimer);
    backgroundTimer = null;
    console.log('⏹️ Background notification check DURDURULDU');
  }
}

// Install event
self.addEventListener('install', function(event) {
  console.log('⚡ Service Worker installing');
  self.skipWaiting();
});

// Activate event - START BACKGROUND CHECKING IMMEDIATELY
self.addEventListener('activate', function(event) {
  console.log('🚀 Service Worker ACTIVATED - Background checking başlatılıyor!');
  event.waitUntil(
    clients.claim().then(() => {
      console.log('✅ Clients claimed - Background check başlıyor...');
      // Start checking immediately when Service Worker activates
      setTimeout(() => {
        console.log('⏰ Activation sonrası ilk background check...');
        checkForNewNotifications().catch(err => {
          console.log('⚠️ İlk check için credentials henüz yok (normal):', err);
        });
      }, 2000); // 2 saniye sonra başla (credentials yüklensin diye)
    })
  );
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