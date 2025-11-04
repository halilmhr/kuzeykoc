// Simple Console Log Notification Service
export class NotificationService {
  private static serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  static async initialize() {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker başarıyla kaydedildi');
      } catch (error) {
        console.error('❌ Service Worker kaydedilemedi:', error);
      }
    }
    
    // Request notification permission
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('📱 Notification permission:', permission);
    }
  }

  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Bu tarayıcı bildirim desteği sunmuyor.');
      return false;
    }

    // Service Worker'ı başlat
    await this.initialize();

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  static canSendNotifications(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }



  static async sendNotification(title: string, options: {
    body?: string;
    icon?: string;
    tag?: string;
    data?: any;
  } = {}) {
    console.log('🔔 Bildirim gönderiliyor:', title, options.body);
    
    // Service Worker ile persistent notification (Android için ideal)
    if (this.serviceWorkerRegistration) {
      try {
        await this.serviceWorkerRegistration.showNotification(title, {
          body: options.body || '',
          icon: options.icon || '/favicon.ico',
          badge: '/favicon.ico',
          tag: options.tag || 'coach-notification',
          requireInteraction: true, // Android'de bildirim ekranında kalır
          silent: false,
          vibrate: [300, 200, 300],
          data: {
            url: '/', // Tıklandığında ana sayfaya git
            ...options.data
          },
          actions: [
            {
              action: 'open',
              title: '📱 Uygulamayı Aç',
              icon: '/favicon.ico'
            },
            {
              action: 'close',
              title: '✕ Kapat'
            }
          ]
        });
        
        console.log('✅ Service Worker persistent notification gönderildi');
        this.playNotificationSound();
        return true;
      } catch (error) {
        console.error('❌ Service Worker notification failed:', error);
      }
    }

    // Fallback: Normal notification (Desktop için)
    if (this.canSendNotifications()) {
      try {
        const notification = new Notification(title, {
          body: options.body,
          icon: options.icon || '/favicon.ico',
          tag: options.tag,
          data: options.data,
          requireInteraction: false
        });

        // Desktop'ta 8 saniye sonra kapat
        setTimeout(() => {
          notification.close();
        }, 8000);

        console.log('✅ Desktop bildirim gönderildi');
        return notification;
      } catch (error) {
        console.error('❌ Desktop bildirim gönderilemedi:', error);
      }
    }

    console.log('ℹ️ Bildirim gönderilemedi');
    return null;
  }

  // Android kontrol (iOS için farklı davranış gerekebilir)
  private static isAndroid(): boolean {
    return /Android/i.test(navigator.userAgent);
  }
  
  private static isMobile(): boolean {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Android için özel modal
  private static showAndroidModal(title: string, body: string) {
    // Mevcut modal'ları temizle
    const existingModals = document.querySelectorAll('.android-notification-modal');
    existingModals.forEach(modal => modal.remove());

    const modal = document.createElement('div');
    modal.className = 'android-notification-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease-out;
    `;

    const alertBox = document.createElement('div');
    alertBox.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 15px;
      max-width: 90%;
      width: 300px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease-out;
    `;

    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.cssText = `
      margin: 0 0 15px 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    `;

    const bodyEl = document.createElement('p');
    bodyEl.textContent = body;
    bodyEl.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 14px;
      color: #666;
      line-height: 1.5;
    `;

    const button = document.createElement('button');
    button.textContent = 'Tamam';
    button.style.cssText = `
      background: #dc2626;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
    `;

    button.onclick = () => {
      modal.remove();
    };

    alertBox.appendChild(titleEl);
    alertBox.appendChild(bodyEl);
    alertBox.appendChild(button);
    modal.appendChild(alertBox);

    // CSS animasyonları ekle
    if (!document.querySelector('#android-modal-animations')) {
      const style = document.createElement('style');
      style.id = 'android-modal-animations';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(modal);

    // Mobilde titreşim
    if ('vibrate' in navigator) {
      navigator.vibrate([400, 200, 400]);
    }

    // 10 saniye sonra otomatik kapat
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 10000);
  }

  // Desktop için toast alert
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
    NotificationService.initialize();
    
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