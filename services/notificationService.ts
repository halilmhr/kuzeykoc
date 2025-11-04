// Browser Notification Utility Functions
export class NotificationService {
  private static serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  static async init() {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker başarıyla kaydedildi');
      } catch (error) {
        console.error('❌ Service Worker kaydedilemedi:', error);
      }
    }
  }

  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Bu tarayıcı bildirim desteği sunmuyor.');
      return false;
    }

    // Service Worker'ı başlat
    await this.init();

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  static canSendNotifications(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  static async sendNotification(title: string, options: {
    body?: string;
    icon?: string;
    tag?: string;
    data?: any;
  } = {}) {
    console.log('🔔 Bildirim gönderiliyor:', title, options.body);
    
    // Titreşim ve ses her durumda
    this.playNotificationSound();
    
    // Toast notification her zaman göster (backup olarak)
    this.showInAppAlert(title, options.body || '');

    // Service Worker ile bildirim gönder (mobil için daha iyi)
    if (this.serviceWorkerRegistration && this.canSendNotifications()) {
      try {
        // Service Worker'a mesaj gönder
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: title,
            body: options.body,
            icon: options.icon || '/favicon.ico'
          });
        } else {
          // Fallback: Direct notification
          await this.serviceWorkerRegistration.showNotification(title, {
            body: options.body,
            icon: options.icon || '/favicon.ico',
            badge: '/favicon.ico',
            tag: options.tag || 'student-activity',
            requireInteraction: false,
            silent: false
          } as any);
        }
        console.log('✅ Service Worker bildirimi gönderildi');
        return true;
      } catch (error) {
        console.error('❌ Service Worker bildirimi gönderilemedi:', error);
      }
    }

    // Fallback: Normal notification
    if (this.canSendNotifications()) {
      try {
        const notification = new Notification(title, {
          body: options.body,
          icon: options.icon || '/favicon.ico',
          tag: options.tag,
          data: options.data,
          requireInteraction: false
        });

        setTimeout(() => {
          notification.close();
        }, 5000);

        console.log('✅ Normal bildirim gönderildi');
        return notification;
      } catch (error) {
        console.error('❌ Normal bildirim gönderilemedi:', error);
      }
    }

    console.log('ℹ️ Sadece in-app toast gösterildi');
    return null;
  }

  // Mobile için in-app alert
  static showInAppAlert(title: string, body: string) {
    // Mevcut toast'ları temizle
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => toast.remove());

    // Toast notification oluştur
    const toast = document.createElement('div');
    toast.className = 'toast-notification fixed top-4 right-4 bg-gradient-to-r from-red-500 to-pink-600 text-white p-4 rounded-lg shadow-2xl z-[9999] max-w-sm border-2 border-yellow-400';
    toast.style.fontSize = '16px';
    toast.style.fontWeight = 'bold';
    toast.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="text-3xl animate-bounce">�</div>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-base text-yellow-200">${title}</div>
          <div class="text-sm mt-2 leading-relaxed">${body}</div>
          <div class="text-xs mt-2 opacity-75">📱 Android Bildirim</div>
        </div>
        <button onclick="this.parentElement.parentElement.remove();" class="text-white hover:text-yellow-200 ml-2 text-xl font-bold">✕</button>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Scroll to top to make sure it's visible
    window.scrollTo({ top: 0, behavior: 'smooth' });

    console.log('🎯 Toast notification eklendi DOM\'a');

    // 10 saniye sonra otomatik kaldır
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 300);
      }
    }, 10000);
  }

  // Notification sesi çal ve titreşim
  static playNotificationSound() {
    console.log('🔊 Ses ve titreşim başlatılıyor...');
    
    // Güçlü vibration pattern (Android için)
    if ('vibrate' in navigator) {
      // 3 kez güçlü titreşim
      navigator.vibrate([300, 200, 300, 200, 300]);
      console.log('📳 Titreşim gönderildi');
    } else {
      console.log('❌ Titreşim desteklenmiyor');
    }

    try {
      // Daha güçlü ve uzun beep sesi
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 1000; // 1000 Hz (daha yüksek)
      gainNode.gain.value = 0.3; // Daha yüksek ses
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5); // 0.5 saniye
      
      console.log('🔔 Beep sesi çalındı');
    } catch (error) {
      console.log('❌ Ses çalınamadı:', error);
    }
  }

  // Öğrenci aktivite bildirimleri için özel fonksiyonlar
  static notifyDailyLog(studentName: string, subject: string, questionCount: number) {
    return this.sendNotification(`📚 ${studentName} Çalışma Ekledi`, {
      body: `${subject} dersinden ${questionCount} soru çözdü`,
      tag: 'daily_log'
    });
  }

  static notifyHomeworkCompleted(studentName: string, homeworkTitle: string) {
    return this.sendNotification(`✅ ${studentName} Ödev Tamamladı`, {
      body: `"${homeworkTitle}" ödevini bitirdi`,
      tag: 'homework_completed'
    });
  }

  static notifyTrialExam(studentName: string, examName: string, correctCount: number) {
    return this.sendNotification(`📊 ${studentName} Deneme Sınavı`, {
      body: `${examName} sınavında ${correctCount} doğru yaptı`,
      tag: 'trial_exam'
    });
  }
}

// Auto-initialize notification permission request
if (typeof window !== 'undefined') {
  // Sayfa yüklendiğinde service worker'ı başlat
  window.addEventListener('load', () => {
    NotificationService.init();
    
    setTimeout(() => {
      console.log('🔔 Bildirim sistemi başlatılıyor...');
      NotificationService.requestPermission().then(granted => {
        if (granted) {
          console.log('✅ Bildirim izni verildi');
        } else {
          console.log('❌ Bildirim izni reddedildi, in-app toast kullanılacak');
        }
      });
    }, 2000); // 2 saniye bekle sonra sor
  });
}