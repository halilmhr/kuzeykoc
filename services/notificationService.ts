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

  static sendNotification(title: string, options: {
    body?: string;
    icon?: string;
    tag?: string;
    data?: any;
  } = {}) {
    if (!this.canSendNotifications()) {
      console.warn('Bildirim izni verilmemiş veya desteklenmiyor.');
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
  // Sayfa yüklendiğinde otomatik izin iste
  window.addEventListener('load', () => {
    setTimeout(() => {
      NotificationService.requestPermission();
    }, 2000); // 2 saniye bekle sonra sor
  });
}