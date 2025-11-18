-- Real-time Aktivasyon - 2. Adım (coach_id zaten var)

-- 1. Mevcut coach_id verilerini kontrol et
SELECT 
    COUNT(*) as toplam,
    COUNT(coach_id) as coach_id_dolu,
    COUNT(CASE WHEN coach_id IS NULL THEN 1 END) as coach_id_bos
FROM notifications;

-- 2. Boş olanları doldur
UPDATE notifications SET coach_id = recipient_id WHERE coach_id IS NULL;

-- 3. Mevcut publications kontrol et
SELECT pubname FROM pg_publication;

-- 4. supabase_realtime var mı kontrol et
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'supabase_realtime zaten var'
        ELSE 'supabase_realtime YOK - oluşturulacak'
    END as publication_durumu
FROM pg_publication 
WHERE pubname = 'supabase_realtime';

-- 5. Publication oluştur (sadece yoksa)
-- Bu komut hata verebilir - normal
CREATE PUBLICATION supabase_realtime;

-- 6. Notifications tablosunu ekle
-- Bu da hata verebilir - normal  
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 7. RLS kapat
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- 8. İzinleri ver
GRANT ALL ON notifications TO anon;
GRANT ALL ON notifications TO authenticated;

-- 9. Test bildirimi ekle
INSERT INTO notifications (
    coach_id, 
    recipient_id, 
    type, 
    title, 
    message, 
    is_read,
    created_at
) VALUES (
    '66666666-6666-6666-6666-666666666666', 
    '66666666-6666-6666-6666-666666666666', 
    'realtime_ready_test', 
    '🎉 REAL-TIME HAZIR!', 
    'Sistem hazır! Zaman: ' || NOW()::text, 
    false,
    NOW()
);

-- 10. Final kontrol
SELECT 'Publications:' as info, pubname FROM pg_publication;

SELECT 'Publication Tables:' as info, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

SELECT 'Son Test Bildirimi:' as info, coach_id, title, created_at
FROM notifications 
WHERE type = 'realtime_ready_test'
ORDER BY created_at DESC 
LIMIT 1;