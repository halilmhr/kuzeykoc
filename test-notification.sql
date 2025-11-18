-- Test bildirimi oluştur - Debug amaçlı

-- Önce mevcut test verilerini temizle
DELETE FROM notifications WHERE title LIKE '%TEST%';

-- Gerçek bir koç ID'si ile test bildirimi oluştur
-- Bu ID'yi CoachDashboard'dan alacağız
INSERT INTO notifications (
    id,
    coach_id,
    recipient_id,
    sender_id,
    type,
    title,
    message,
    data,
    is_read,
    created_at
) VALUES (
    gen_random_uuid(),
    'BURAYA_GERÇEK_COACH_ID_YAZILACAK',  -- Bu değiştirilecek
    'BURAYA_GERÇEK_COACH_ID_YAZILACAK',  -- Bu değiştirilecek
    gen_random_uuid(),
    'homework_completed',
    '🧪 TEST BİLDİRİM',
    'Bu bir test bildirimidir. Eğer bunu görüyorsanız real-time sistem çalışıyor!',
    '{"test": true, "student_name": "Test Öğrenci", "subject": "Test Dersi"}',
    false,
    NOW()
);

-- Bildirim sayısını kontrol et
SELECT 
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count,
    COUNT(CASE WHEN coach_id IS NOT NULL THEN 1 END) as with_coach_id,
    COUNT(CASE WHEN title LIKE '%TEST%' THEN 1 END) as test_notifications
FROM notifications;

-- Son bildirimleri listele
SELECT 
    id,
    coach_id,
    recipient_id, 
    type,
    title,
    message,
    is_read,
    created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;