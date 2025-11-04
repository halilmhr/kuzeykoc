-- Mevcut notifications tablosu için Real-time aktif et

-- 1. Mevcut tablo yapısını kontrol et
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- 2. Tablo içeriğini kontrol et
SELECT COUNT(*) as toplam_bildirim FROM notifications;

-- 3. Real-time için gerekli alanları kontrol et
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- 4. Publication durumunu kontrol et
SELECT 
    pubname,
    puballtables
FROM pg_publication;

-- 5. Notifications tablosu publication'da mı?
SELECT 
    pubname,
    schemaname,
    tablename
FROM pg_publication_tables 
WHERE tablename = 'notifications';

-- 6. Eğer publication yoksa oluştur
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
        RAISE NOTICE '✅ supabase_realtime publication oluşturuldu';
    END IF;
    
    -- Notifications tablosunu ekle
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
        RAISE NOTICE '✅ notifications tablosu publication''a eklendi';
    ELSE
        RAISE NOTICE '✅ notifications tablosu zaten publication''da';
    END IF;
END $$;

-- 7. RLS'i kontrol et ve ayarla
SELECT 
    tablename,
    rowsecurity as rls_aktif,
    enablerls as rls_zorunlu
FROM pg_tables 
WHERE tablename = 'notifications';

-- RLS'i geçici olarak kapat (development için)
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- 8. İzinleri ver
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;

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
    '99999999-9999-9999-9999-999999999999',
    '99999999-9999-9999-9999-999999999999',
    'realtime_activation_test',
    '🚀 REAL-TIME AKTİF!',
    'Real-time sistemi başarıyla aktif edildi! ' || NOW()::text,
    false,
    NOW()
);

-- 10. Son kontrol
SELECT '=== REAL-TIME AKTİVASYON SONUCU ===' as durum;

SELECT 'Publication durumu:' as info;
SELECT pubname FROM pg_publication WHERE pubname = 'supabase_realtime';

SELECT 'Notifications publication durumu:' as info;
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ notifications tablosu publication''da'
        ELSE '❌ notifications tablosu publication''da DEĞİL'
    END as durum
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'notifications';

SELECT 'Son eklenen test bildirimi:' as info;
SELECT 
    coach_id,
    title,
    created_at
FROM notifications 
WHERE type = 'realtime_activation_test'
ORDER BY created_at DESC 
LIMIT 1;