-- Notifications tablosunu düzelt - coach_id alanı ekle

-- Önce coach_id sütununu ekle (eğer yoksa)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS coach_id UUID;

-- recipient_id'yi coach_id'ye kopyala (mevcut veriler için)
UPDATE notifications 
SET coach_id = recipient_id 
WHERE coach_id IS NULL;

-- İndeks ekle
CREATE INDEX IF NOT EXISTS idx_notifications_coach ON notifications(coach_id);
CREATE INDEX IF NOT EXISTS idx_notifications_coach_unread ON notifications(coach_id, is_read) WHERE is_read = FALSE;

-- Test verisi ekle
INSERT INTO notifications (coach_id, recipient_id, sender_id, type, title, message, data)
VALUES 
(
    'test-coach-id',
    'test-coach-id', 
    'test-student-id',
    'homework_completed',
    '🎉 Ödev Tamamlandı!',
    'Ahmet matematik ödevini tamamladı.',
    '{"student_name": "Ahmet", "subject": "Matematik"}'
);

-- Bildirim sayısını kontrol et
SELECT 
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count,
    COUNT(CASE WHEN coach_id IS NOT NULL THEN 1 END) as with_coach_id
FROM notifications;

-- Son 5 bildirimi göster
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
LIMIT 5;