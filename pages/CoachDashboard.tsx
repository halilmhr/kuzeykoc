
import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import Header from '../components/common/Header';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';
import Calendar from '../components/common/Calendar';
import HomeworkModal from '../components/common/HomeworkModal';
import { Student, DailyLog, TrialExamResult, WeeklyProgram, ProgramTask, TitledWeeklyProgram, Coach, LeaderboardEntry, Homework } from '../types';
import supabaseApi from '../services/supabaseApi';
import { getUnreadNotifications, markNotificationAsRead, createTestNotification, getNotificationStats } from '../services/supabaseClient';
import { NotificationService } from '../services/notificationService';

interface AddStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStudentAdded: (newStudent: Student) => void;
    coachId: string;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose, onStudentAdded, coachId }) => {
  if (!isOpen) return null;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Tüm alanlar zorunludur.');
      return;
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const newStudent = await supabaseApi.addStudent({ fullName, email, coachId, password });
      onStudentAdded(newStudent);
      onClose();
    } catch (err) {
      setError('Öğrenci eklenirken bir hata oluştu.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-300 scale-95 hover:scale-100" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Yeni Öğrenci Ekle</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-[var(--text-secondary)]">Tam Adı</label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full rounded-lg border-[var(--border-color-light)] shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm p-2.5 bg-[var(--bg-input)] text-[var(--text-primary)]"
              placeholder='Örn: Zeynep Güneş'
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)]">E-posta Adresi</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border-[var(--border-color-light)] shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm p-2.5 bg-[var(--bg-input)] text-[var(--text-primary)]"
              placeholder='ornek@email.com'
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)]">Şifre</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border-[var(--border-color-light)] shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm p-2.5 bg-[var(--bg-input)] text-[var(--text-primary)]"
              placeholder="En az 6 karakter"
              required
              minLength={6}
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--text-secondary)]">Şifre Tekrarı</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border-[var(--border-color-light)] shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm p-2.5 bg-[var(--bg-input)] text-[var(--text-primary)]"
              placeholder="Şifrenizi tekrar girin"
              required
            />
          </div>
          
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-semibold">
              İptal
            </button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-lg hover:from-violet-700 hover:to-fuchsia-600 disabled:from-slate-400 disabled:to-slate-500 transition-all shadow-md font-semibold">
              {isSubmitting ? 'Ekleniyor...' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const CoachDashboard: React.FC = () => {
  const auth = useContext(AuthContext);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Homework calendar states
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [selectedDateHomework, setSelectedDateHomework] = useState<Homework[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (auth?.user) {
        setLoading(true);
        setLeaderboardLoading(true);
        
        const [fetchedStudents, fetchedLeaderboard, fetchedHomework] = await Promise.all([
          supabaseApi.getStudentsByCoach(auth.user.id),
          supabaseApi.getCoachLeaderboard(auth.user.id),
          supabaseApi.getHomeworkByCoach(auth.user.id)
        ]);
        
        setStudents(fetchedStudents);
        setLeaderboard(fetchedLeaderboard);
        setHomework(fetchedHomework);
        setLoading(false);
        setLeaderboardLoading(false);
      }
    };
    fetchData();
  }, [auth?.user]);

  // Real-time notification system for coach using Supabase subscriptions
  useEffect(() => {
    if (!auth?.user || auth.user.role !== 'coach') return;

    let subscription: any = null;

    const setupRealtimeNotifications = async () => {
      try {
        // İlk yükleme - mevcut bildirimleri al
        const initialNotifications = await getUnreadNotifications(auth.user.id);
        setNotifications(initialNotifications);
        setUnreadCount(initialNotifications.length);
        console.log(`📊 ${initialNotifications.length} mevcut bildirim yüklendi`);

        // Supabase Real-time subscription kur
        const { supabase } = await import('../services/supabaseClient');
        
        subscription = supabase
          .channel('notifications-channel')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `coach_id=eq.${auth.user.id}`
            },
            (payload) => {
              console.log('🔔 GERÇEK ZAMANLI BİLDİRİM:', payload.new);
              
              const newNotification = payload.new;
              
              // Bildirim listesine ekle
              setNotifications(prev => [newNotification, ...prev]);
              setUnreadCount(prev => prev + 1);
              
              // Tarayıcı bildirimi göster - MULTIPLE METHODS
              console.log('🔔 Real-time bildirim gösteriliyor:', newNotification.title);
              
              // Method 1: NotificationService
              NotificationService.sendNotification(newNotification.title, {
                body: newNotification.message,
                tag: newNotification.type,
                data: newNotification.data
              });
              
              // Method 2: Direct Notification API (backup)
              if (Notification.permission === 'granted') {
                new Notification(newNotification.title, {
                  body: newNotification.message,
                  icon: '/favicon.ico',
                  badge: '/favicon.ico',
                  requireInteraction: true,
                  silent: true,
                  tag: 'realtime-' + newNotification.id
                });
              }
              
              // Method 3: Service Worker (backup)
              if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                  type: 'SHOW_NOTIFICATION',
                  title: newNotification.title,
                  body: newNotification.message,
                  tag: 'realtime-sw-' + newNotification.id
                });
              }
              
              console.log('✅ Real-time bildirim işlendi (3 yöntem denendi)');
            }
          )
          .subscribe((status) => {
            console.log('� Supabase subscription durumu:', status);
            if (status === 'SUBSCRIBED') {
              console.log('✅ Real-time bildirimler aktif!');
            }
          });

        console.log('🚀 Real-time bildirim sistemi kuruldu');
        
      } catch (error) {
        console.error('❌ Real-time bildirim kurulumu başarısız:', error);
        
        // Fallback: Polling sistemi
        console.log('🔄 Fallback polling sistemi başlatılıyor...');
        const fallbackInterval = setInterval(async () => {
          try {
            const newNotifications = await getUnreadNotifications(auth.user.id);
            const previousIds = new Set(notifications.map(n => n.id));
            const trulyNew = newNotifications.filter(n => !previousIds.has(n.id));
            
            if (trulyNew.length > 0) {
              setNotifications(newNotifications);
              setUnreadCount(newNotifications.length);
              trulyNew.forEach(notification => {
                NotificationService.sendNotification(notification.title, {
                  body: notification.message,
                  tag: notification.type
                });
              });
            }
          } catch (pollError) {
            console.error('Polling error:', pollError);
          }
        }, 10000); // 10 saniye fallback
        
        return () => clearInterval(fallbackInterval);
      }
    };

    setupRealtimeNotifications();
    
    // Page Visibility API - Tab geri geldiğinde güncelle
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('�️ Tab aktif - bildirimleri güncelliyorum...');
        getUnreadNotifications(auth.user.id).then(setNotifications);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      // Cleanup
      if (subscription) {
        subscription.unsubscribe();
        console.log('🔌 Real-time subscription kapatıldı');
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [auth?.user]); // notifications dependency kaldırıldı - infinite loop önlemek için

  // Initialize notification service for coaches
  useEffect(() => {
    if (auth?.user && auth.user.role === 'coach') {
      NotificationService.initialize().then(() => {
        console.log('🔔 Koç için bildirim sistemi hazır');
        
        // Store coach data and Supabase credentials for background sync
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'STORE_COACH_DATA',
            coach: {
              id: auth.user.id,
              fullName: auth.user.fullName,
              email: auth.user.email
            }
          });
          
          // Store Supabase credentials for background API calls
          navigator.serviceWorker.controller.postMessage({
            type: 'STORE_SUPABASE_CREDENTIALS',
            credentials: {
              url: import.meta.env.VITE_SUPABASE_URL,
              anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
            }
          });
        }

        // Visibility API - inform service worker about page visibility
        const handleVisibilityChange = () => {
          const isVisible = !document.hidden;
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'VISIBILITY_CHANGE',
              isVisible: isVisible
            });
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Initial visibility state
        handleVisibilityChange();
      });
    }
  }, [auth?.user]);
  
  const handleStudentAdded = (newStudent: Student) => {
    setStudents(prevStudents => [newStudent, ...prevStudents]);
    // Liderlik tablosunu yenile
    refreshLeaderboard();
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    
    const success = await supabaseApi.deleteStudent(studentToDelete.id);
    if (success) {
      setStudents(prevStudents => prevStudents.filter(s => s.id !== studentToDelete.id));
      refreshLeaderboard();
      setStudentToDelete(null);
    } else {
      alert('Öğrenci silinirken bir hata oluştu!');
    }
  };

  const refreshLeaderboard = async () => {
    if (auth?.user) {
      setLeaderboardLoading(true);
      const fetchedLeaderboard = await supabaseApi.getCoachLeaderboard(auth.user.id);
      setLeaderboard(fetchedLeaderboard);
      setLeaderboardLoading(false);
    }
  };

  // Homework functions
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const dateStr = date.toISOString().split('T')[0];
    const dayHomework = homework.filter(hw => hw.date === dateStr);
    setSelectedDateHomework(dayHomework);
  };

  const handleAddHomework = (student: Student) => {
    setSelectedStudent(student);
    setIsHomeworkModalOpen(true);
  };

  const handleSaveHomework = async (newHomework: Omit<Homework, 'id' | 'createdAt'>) => {
    if (!auth?.user || !selectedStudent) return;
    
    const homeworkData = {
      ...newHomework,
      studentId: selectedStudent.id,
      coachId: auth.user.id
    };

    const savedHomework = await supabaseApi.addHomework(homeworkData);
    if (savedHomework) {
      setHomework(prev => [...prev, savedHomework]);
      // Update selected date homework if it's the same date
      if (selectedDate && selectedDate.toISOString().split('T')[0] === savedHomework.date) {
        setSelectedDateHomework(prev => [...prev, savedHomework]);
      }
    }
  };

  const getHomeworkDates = () => {
    return homework.map(hw => hw.date);
  };

  if (!auth?.user) return null;

  // Debug fonksiyonları
  const handleTestNotification = async () => {
    if (!auth?.user?.id) return;
    
    console.log('🧪 TEST BİLDİRİM oluşturuluyor...', auth.user.id);
    const success = await createTestNotification(auth.user.id);
    
    if (success) {
      alert('✅ Test bildirimi oluşturuldu! Real-time sistem kontrol ediliyor...');
    } else {
      alert('❌ Test bildirimi oluşturulamadı!');
    }
  };

  const handleGetStats = async () => {
    if (!auth?.user?.id) return;
    
    const stats = await getNotificationStats(auth.user.id);
    if (stats) {
      alert(`📊 Bildirim İstatistikleri:\n\nToplam: ${stats.total}\nOkunmamış: ${stats.unread}\nBugün: ${stats.today}\n\nKoç ID: ${auth.user.id}`);
    } else {
      alert('❌ İstatistikler alınamadı!');
    }
  };

  const handleCheckNotificationPermission = async () => {
    try {
      console.log('🔐 Notification izinleri kontrol ediliyor...');
      alert('🔐 İzin kontrol başladı! Console\'a bak...');
      
      // Notification API desteği
      const supported = 'Notification' in window;
      console.log('📱 Notification API destekleniyor:', supported);
      
      if (!supported) {
        alert('❌ Tarayıcı bildirim desteklemiyor!');
        return;
      }
      
      // Mevcut izin durumu
      const currentPermission = Notification.permission;
      console.log('🔐 Mevcut izin durumu:', currentPermission);
      
      // İzin iste
      if (currentPermission === 'default') {
        console.log('📋 İzin isteniyor...');
        const permission = await Notification.requestPermission();
        console.log('📋 Yeni izin durumu:', permission);
      }
      
      // Service Worker durumu
      const swRegistered = 'serviceWorker' in navigator && navigator.serviceWorker.controller;
      console.log('🔧 Service Worker aktif:', swRegistered);
      
      // Manual test bildirimi
      if (Notification.permission === 'granted') {
        console.log('✅ Manual test bildirimi gösteriliyor...');
        
        // Test 1: Direct Notification
        const notification = new Notification('🧪 MANUAL TEST BİLDİRİM', {
          body: 'Bu manuel test bildirimidir. Çalışıyorsa sistem OK!',
          icon: '/favicon.ico',
          requireInteraction: true,
          silent: true
        });
        
        console.log('📱 Direct notification oluşturuldu:', notification);
        
        // Test 2: Service Worker bildirimi
        if (navigator.serviceWorker.controller) {
          console.log('🔧 Service Worker test bildirimi gönderiliyor...');
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: '🔧 SERVICE WORKER TEST',
            body: 'Service Worker üzerinden test bildirimi',
            tag: 'sw-test'
          });
        }
      } else {
        console.log('❌ Notification permission denied:', Notification.permission);
      }
      
      // Sonuç raporu
      const report = `🔐 Bildirim İzinleri:\n\nAPI Desteği: ${supported ? '✅' : '❌'}\nİzin Durumu: ${Notification.permission}\nService Worker: ${swRegistered ? '✅' : '❌'}\n\nManual test bildirimi gönderildi!`;
      console.log('📊 Final rapor:', report);
      alert(report);
      
    } catch (error) {
      console.error('❌ İzin kontrol hatası:', error);
      alert('❌ Hata: ' + error.message);
    }
  };

  const handleSimpleTest = () => {
    console.log('🚀 Simple test clicked!');
    alert('🚀 Simple test çalışıyor! Console\'a bak...');
    
    if ('Notification' in window) {
      console.log('✅ Notification API mevcut, Permission:', Notification.permission);
      alert('✅ Notification API mevcut - Permission: ' + Notification.permission);
    } else {
      console.log('❌ Notification API yok');
      alert('❌ Notification API yok!');
    }
  };

  const handleForceRefresh = async () => {
    if (!auth?.user?.id) return;
    
    console.log('🔄 ZORLA YENİLEME başlatıldı...', auth.user.id);
    
    try {
      const freshNotifications = await getUnreadNotifications(auth.user.id);
      setNotifications(freshNotifications);
      setUnreadCount(freshNotifications.length);
      
      alert(`🔄 Yenileme tamamlandı!\n\n${freshNotifications.length} bildirim bulundu.\n\nReal-time subscription durumu kontrol ediliyor...`);
      
      console.log('📡 Notifications refreshed:', freshNotifications);
    } catch (error) {
      console.error('❌ Refresh error:', error);
      alert('❌ Yenileme hatası: ' + error);
    }
  };

  return (
    <>
      <Header user={auth.user} />
      
      {/* DEBUG PANEL */}
      <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4 m-4">
        <h3 className="font-bold text-yellow-800 mb-2">🧪 DEBUG PANEL</h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleTestNotification}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            🔔 Test Bildirimi Gönder
          </button>
          <button
            onClick={handleGetStats}
            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
          >
            📊 İstatistikleri Göster
          </button>
          <button
            onClick={handleForceRefresh}
            className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600"
          >
            🔄 Zorla Yenile
          </button>
          <button
            onClick={handleCheckNotificationPermission}
            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
          >
            🔐 İzin Kontrol
          </button>
          <button
            onClick={handleSimpleTest}
            className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
          >
            🚀 Basit Test
          </button>
          <div className="text-sm text-gray-600">
            Bildirimler: {notifications.length} | Okunmamış: {unreadCount} | Koç ID: {auth.user.id?.substring(0, 8)}...
          </div>
        </div>
      </div>

      <AddStudentModal 
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        onStudentAdded={handleStudentAdded}
        coachId={auth.user.id}
      />
      
      <HomeworkModal
        isOpen={isHomeworkModalOpen}
        onClose={() => {
          setIsHomeworkModalOpen(false);
          setSelectedStudent(null);
        }}
        selectedDate={selectedDate}
        onSave={handleSaveHomework}
      />
      <main className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-8">
          <div className="order-1">
            <Card 
                title="Öğrencilerim"
                actionButton={
                    <button 
                        onClick={() => setIsAddStudentModalOpen(true)}
                        className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-lg hover:from-violet-600 hover:to-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition duration-200 shadow-sm hover:shadow-md"
                    >
                        <span className="hidden sm:inline">+ Yeni Öğrenci Ekle</span>
                        <span className="sm:hidden">+ Ekle</span>
                    </button>
                }
            >
              {loading ? (
                <Spinner />
              ) : (
                <div className="space-y-4">
                  {students.map((student) => (
                    <div key={student.id} className="relative group">
                      <Link to={`/coach/student/${student.id}`} className="block">
                        <div className="flex items-center justify-between p-4 bg-[var(--bg-card)] rounded-xl hover:bg-[var(--bg-hover)] transition-all duration-300 cursor-pointer border border-[var(--border-color-light)] hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center font-bold text-xl shadow-md">
                              {student.fullName?.charAt(0) || '?'}
                            </div>
                                <div className="flex-grow">
                              <p className="font-semibold text-[var(--text-primary)]">{student.fullName || 'İsimsiz'}</p>
                              <p className="text-sm text-[var(--text-secondary)]">{student.email || 'Email yok'}</p>
                            </div>

                          </div>
                          <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400 transition-transform duration-300 transform group-hover:translate-x-1 group-hover:text-violet-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setStudentToDelete(student);
                        }}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg hover:shadow-xl z-10"
                        title="Öğrenciyi Sil"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
          
          <div className="order-2">
            <Card 
                title="🏆 Liderlik Tablosu" 
                actionButton={
                    <button 
                        onClick={refreshLeaderboard}
                        className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-200 shadow-sm hover:shadow-md"
                    >
                        <span className="hidden sm:inline">🔄 Yenile</span>
                        <span className="sm:hidden">🔄</span>
                    </button>
                }
            >
              {leaderboardLoading ? (
                <Spinner />
              ) : leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((entry) => (
                    <div key={entry.student_id} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-700 rounded-xl border border-[var(--border-color-light)] hover:shadow-md transition-all duration-300">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
                          entry.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                          entry.rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                          entry.rank === 3 ? 'bg-gradient-to-r from-orange-400 to-yellow-600' :
                          'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                        }`}>
                          {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{entry.student_name}</p>
                          <div className="flex items-center space-x-3 text-xs text-[var(--text-secondary)]">
                            <span>📚 {entry.monthly_questions} soru</span>
                            <span>📝 {entry.monthly_exams} deneme</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-violet-600">{entry.total_score}</span>
                          <span className="text-sm text-[var(--text-secondary)]">puan</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">
                          Son: {new Date(entry.last_activity).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🏆</div>
                  <p className="text-[var(--text-secondary)]">Henüz liderlik tablosu verisi yok.</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-2">Öğrenciler soru çözmeye başladıkça tablo oluşacak!</p>
                </div>
              )}
            </Card>
          </div>
          
          <div className="order-3">
            <Card title="📅 Ödev Takvimi">
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                homeworkDates={getHomeworkDates()}
              />
              
              {selectedDate && (
                <div className="mt-6">
                  <h4 className="font-semibold text-[var(--text-primary)] mb-3">
                    {selectedDate.toLocaleDateString('tr-TR', { 
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })} - Ödevler
                  </h4>
                  
                  {selectedDateHomework.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDateHomework.map(hw => (
                        <div key={hw.id} className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                          <h5 className="font-medium text-orange-800 dark:text-orange-200">{hw.title}</h5>
                          {hw.description && (
                            <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">{hw.description}</p>
                          )}
                          <p className="text-xs text-orange-500 mt-2">
                            Öğrenci: {students.find(s => s.id === hw.studentId)?.fullName || 'Bilinmeyen'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--text-secondary)] italic">Bu tarih için ödev bulunmuyor.</p>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
      
      {/* Silme Onay Modalı */}
      {studentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Öğrenciyi Sil
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                <span className="font-semibold">{studentToDelete.fullName}</span> isimli öğrenciyi silmek istediğinizden emin misiniz? 
                Bu işlem geri alınamaz ve tüm veriler silinecektir.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setStudentToDelete(null)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  İptal
                </button>
                <button
                  onClick={handleDeleteStudent}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Evet, Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CoachDashboard;
