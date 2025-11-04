-- SÜPER BASİT Real-time Kurulum (Hata almaz)

-- 1. Tablo yapısını göster
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications';

-- 2. coach_id zaten var - kontrol et
SELECT COUNT(*) as coach_id_dolu_kayit 
FROM notifications 
WHERE coach_id IS NOT NULL;

-- 3. Mevcut verileri güncelle (eğer boş olanlar varsa)
UPDATE notifications SET coach_id = recipient_id WHERE coach_id IS NULL;

-- 4. Publication oluştur
CREATE PUBLICATION supabase_realtime;

-- 5. Tabloyu ekle
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 6. RLS kapat
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- 7. İzin ver
GRANT ALL ON notifications TO anon;
GRANT ALL ON notifications TO authenticated;

-- 8. Test bildirimi
INSERT INTO notifications (coach_id, recipient_id, type, title, message, is_read) 
VALUES ('77777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', 'test', 'TEST BİLDİRİM', 'Test mesajı', false);

-- 9. Kontrol
SELECT pubname FROM pg_publication;
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
SELECT coach_id, title FROM notifications ORDER BY created_at DESC LIMIT 2;