-- Supabase Real-time Aktif Etme - Tam Kurulum

-- 1. Mevcut durumu kontrol et
SELECT 'MEVCUT PUBLICATIONS:' as info;
SELECT pubname, puballtables FROM pg_publication;

SELECT 'PUBLICATION TABLES:' as info;
SELECT pubname, schemaname, tablename 
FROM pg_publication_tables 
WHERE tablename = 'notifications';

-- 2. supabase_realtime publication'ını oluştur (eğer yoksa)
DO $$
BEGIN
    -- Publication var mı kontrol et
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
        RAISE NOTICE 'supabase_realtime publication oluşturuldu';
    ELSE
        RAISE NOTICE 'supabase_realtime publication zaten mevcut';
    END IF;
END $$;

-- 3. Notifications tablosunu publication'a ekle
DO $$
BEGIN
    -- Tablo zaten publication'da mı kontrol et
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
        RAISE NOTICE 'notifications tablosu supabase_realtime publication''a eklendi';
    ELSE
        RAISE NOTICE 'notifications tablosu zaten publication''da';
    END IF;
END $$;

-- 4. RLS'i real-time için ayarla
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- 5. Real-time için gerekli izinleri ver
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;

-- 6. Test bildirimi ekle
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
    '11111111-1111-1111-1111-111111111111', -- Test coach ID
    '11111111-1111-1111-1111-111111111111', -- Test coach ID
    '22222222-2222-2222-2222-222222222222', -- Test student ID
    'realtime_test',
    '🚀 REAL-TIME TEST',
    'Real-time sistemi aktif! Zaman: ' || NOW()::text,
    '{"realtime_test": true, "timestamp": "' || NOW()::text || '"}',
    false,
    NOW()
);

-- 7. Kontrol sorguları
SELECT '=== REAL-TIME KURULUM SONUÇLARI ===' as info;

SELECT 'Publications:' as info;
SELECT pubname, puballtables FROM pg_publication;

SELECT 'Publication Tables:' as info;
SELECT pubname, tablename FROM pg_publication_tables WHERE tablename = 'notifications';

SELECT 'RLS Durumu:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'notifications';

SELECT 'Son Bildirimler:' as info;
SELECT 
    coach_id,
    type,
    title,
    created_at
FROM notifications 
ORDER BY created_at DESC 
LIMIT 5;

SELECT '✅ Real-time kurulum tamamlandı!' as result;