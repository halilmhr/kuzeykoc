-- Basit Real-time Aktivasyon (Supabase SQL Editor uyumlu)

-- ADIM 1: Notifications tablosu kontrolü
SELECT 'ADIM 1: Tablo Yapısı' as baslangic;
SELECT 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- ADIM 2: coach_id sütunu var mı?
SELECT 'ADIM 2: coach_id Kontrolü' as baslangic;
SELECT 
    COUNT(*) as coach_id_var_mi
FROM information_schema.columns 
WHERE table_name = 'notifications' AND column_name = 'coach_id';

-- ADIM 3: coach_id yoksa ekle
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS coach_id UUID;

-- ADIM 4: Mevcut verileri güncelle
UPDATE notifications 
SET coach_id = recipient_id 
WHERE coach_id IS NULL;

-- ADIM 5: Publication oluştur (eğer yoksa)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- ADIM 6: Notifications tablosunu publication'a ekle (eğer yoksa)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;
END $$;

-- ADIM 7: RLS'i kapat (geçici)
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- ADIM 8: İzinleri ver
GRANT ALL ON notifications TO anon;
GRANT ALL ON notifications TO authenticated;

-- ADIM 9: Test bildirimi ekle
INSERT INTO notifications (
    coach_id,
    recipient_id,
    type,
    title,
    message,
    is_read
) VALUES (
    '88888888-8888-8888-8888-888888888888',
    '88888888-8888-8888-8888-888888888888',
    'realtime_test',
    '✅ REAL-TIME TEST',
    'Test zamanı: ' || NOW()::text,
    false
);

-- ADIM 10: Kontrol
SELECT 'SONUÇ: Publications' as baslangic;
SELECT pubname FROM pg_publication;

SELECT 'SONUÇ: Publication Tables' as baslangic;
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

SELECT 'SONUÇ: Son Bildirimler' as baslangic;
SELECT 
    coach_id,
    title,
    created_at
FROM notifications 
ORDER BY created_at DESC 
LIMIT 3;