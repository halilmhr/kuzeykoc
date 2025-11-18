-- Real-time Final Adımlar (Publication zaten var)

-- 1. Mevcut durumu kontrol et
SELECT 'Mevcut Publications:' as info;
SELECT pubname FROM pg_publication;

SELECT 'Publication Tables:' as info;
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- 2. Notifications tablosu publication'da mı kontrol et
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ notifications zaten publication''da'
        ELSE '❌ notifications publication''da DEĞİL - eklenecek'
    END as notifications_durumu
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'notifications';

-- 3. Eğer notifications yoksa ekle (hata verse bile devam eder)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 4. RLS'i kapat
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- 5. İzinleri ver
GRANT ALL ON notifications TO anon;
GRANT ALL ON notifications TO authenticated;

-- 6. Coach_id verilerini güncelle
UPDATE notifications SET coach_id = recipient_id WHERE coach_id IS NULL;

-- 7. Test bildirimi ekle
INSERT INTO notifications (
    coach_id, 
    recipient_id, 
    type, 
    title, 
    message, 
    is_read
) VALUES (
    '55555555-5555-5555-5555-555555555555', 
    '55555555-5555-5555-5555-555555555555', 
    'final_realtime_test', 
    '🚀 FINAL TEST - Real-time Aktif!', 
    'Son test! Zaman: ' || NOW()::text, 
    false
);

-- 8. SONUÇ KONTROL
SELECT '=== REAL-TIME KURULUM SONUÇ ===' as baslangic;

SELECT 'Publications:' as tip, pubname FROM pg_publication;

SELECT 'Publication Tables:' as tip, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

SELECT 'Notifications Tablo Yapısı:' as tip;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' AND column_name IN ('coach_id', 'recipient_id', 'type', 'title');

SELECT 'Son Eklenen Test:' as tip;
SELECT coach_id, title, created_at, type
FROM notifications 
WHERE type = 'final_realtime_test'
ORDER BY created_at DESC 
LIMIT 1;

SELECT 'Toplam Bildirim Sayısı:' as tip;
SELECT 
    COUNT(*) as toplam,
    COUNT(coach_id) as coach_id_dolu
FROM notifications;