// Browser Notification Utility Functions
export class NotificationService {
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Bu tarayıcı bildirim desteği sunmuyor.');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  static canSendNotifications(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  static sendNotification(title: string, options: {
    body?: string;
    icon?: string;
    tag?: string;
    data?: any;
  } = {}) {
    // Mobile'da browser notification çoğu zaman çalışmaz
    if (this.isMobile()) {
      console.log('📱 Mobil cihazda bildirim:', title, options.body);
      this.showInAppAlert(title, options.body || '');
      this.playNotificationSound();
      return null;
    }

    if (!this.canSendNotifications()) {
      console.warn('Bildirim izni verilmemiş veya desteklenmiyor.');
      this.showInAppAlert(title, options.body || '');
      return null;
    }

    const notification = new Notification(title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      tag: options.tag,
      data: options.data,
      requireInteraction: false // Otomatik kapansın
    });

    // 5 saniye sonra otomatik kapat
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }

  // Mobile için in-app alert
  static showInAppAlert(title: string, body: string) {
    // Toast notification oluştur
    const toast = document.createElement('div');
    toast.className = 'toast-notification fixed top-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-xl z-50 max-w-sm border-l-4 border-yellow-400';
    toast.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="text-2xl">🔔</div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-sm">${title}</div>
          <div class="text-xs mt-1 opacity-90 leading-relaxed">${body}</div>
        </div>
        <button onclick="this.parentElement.parentElement.classList.add('closing'); setTimeout(() => this.parentElement.parentElement.remove(), 300);" class="text-white/80 hover:text-white ml-2 text-lg">✕</button>
      </div>
    `;
    
    document.body.appendChild(toast);

    // 7 saniye sonra otomatik kaldır
    setTimeout(() => {
      if (toast.parentNode && !toast.classList.contains('closing')) {
        toast.classList.add('closing');
        setTimeout(() => {
          if (toast.parentNode) {
            toast.remove();
          }
        }, 300);
      }
    }, 7000);
  }

  // Notification sesi çal ve titreşim
  static playNotificationSound() {
    // Vibration (Android için)
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]); // 200ms titreşim, 100ms duraklama, 200ms titreşim
    }

    try {
      // Basit beep sesi oluştur
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // 800 Hz
      gainNode.gain.value = 0.1; // Düşük ses
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2); // 0.2 saniye
    } catch (error) {
      console.log('Ses çalınamadı:', error);
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
  // Sayfa yüklendiğinde otomatik izin iste (sadece desktop'ta)
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (!NotificationService.isMobile()) {
        NotificationService.requestPermission();
      } else {
        console.log('📱 Mobil cihazda in-app notification kullanılacak');
      }
    }, 2000); // 2 saniye bekle sonra sor
  });
}