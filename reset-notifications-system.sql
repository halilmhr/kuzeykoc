-- Notifications sistemini tamamen sıfırla ve doğru kur

-- 1. Önce RLS'i geçici olarak kapat
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- 2. Tüm mevcut politikaları sil
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Allow insert for development" ON notifications;
DROP POLICY IF EXISTS "Coaches can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Allow all operations for development" ON notifications;

-- 3. Tabloyu Real-time için yayınla (eğer publication yoksa)
DO $$
BEGIN
    -- supabase_realtime publication'ını kontrol et ve ekle
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;
EXCEPTION
    WHEN others THEN
        -- Publication yoksa oluştur
        CREATE PUBLICATION supabase_realtime FOR TABLE notifications;
END $$;

-- 4. Geçici olarak herkese tam erişim ver (development için)
GRANT ALL ON notifications TO anon;
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;

-- 5. Test bildirimi ekle (gerçek UUID'ler yerine placeholder)
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
    '00000000-0000-0000-0000-000000000001', -- Test coach ID
    '00000000-0000-0000-0000-000000000001', -- Test coach ID  
    '00000000-0000-0000-0000-000000000002', -- Test student ID
    'system_test',
    '🔧 SİSTEM TESTİ',
    'Notifications tablosu düzgün çalışıyor! Real-time aktif.',
    '{"test": true, "debug": true, "timestamp": "' || NOW()::text || '"}',
    false,
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 6. Kontrol sorguları
SELECT 'Tablo durumu:' as info;
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN is_read = false THEN 1 END) as unread,
    COUNT(CASE WHEN coach_id IS NOT NULL THEN 1 END) as with_coach_id
FROM notifications;

SELECT 'Son 3 bildirim:' as info;
SELECT 
    coach_id,
    type,
    title,
    created_at,
    is_read
FROM notifications 
ORDER BY created_at DESC 
LIMIT 3;