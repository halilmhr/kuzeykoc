-- Bildirim sistemini debug et - RLS ve subscription kontrol

-- 1. Önce notifications tablosunun durumunu kontrol et
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    enablerls
FROM pg_tables 
WHERE tablename = 'notifications';

-- 2. Mevcut bildirimleri kontrol et
SELECT 
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count,
    COUNT(CASE WHEN coach_id IS NOT NULL THEN 1 END) as with_coach_id,
    COUNT(CASE WHEN recipient_id IS NOT NULL THEN 1 END) as with_recipient_id
FROM notifications;

-- 3. Son bildirimleri listele
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

-- 4. RLS politikalarını kontrol et
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'notifications';

-- 5. Publications kontrol et (Real-time için)
SELECT 
    pubname,
    puballtables,
    pubinsert,
    pubupdate,
    pubdelete,
    pubtruncate
FROM pg_publication;

-- 6. Publication tables kontrol et
SELECT 
    pub.pubname,
    pt.schemaname,
    pt.tablename
FROM pg_publication pub
LEFT JOIN pg_publication_tables pt ON pub.pubname = pt.pubname
WHERE pt.tablename = 'notifications' OR pub.puballtables = true;