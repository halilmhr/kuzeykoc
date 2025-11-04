-- Notifications tablosu coach_id kontrol ve ekleme

-- 1. Mevcut sütunları listele
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- 2. coach_id sütunu var mı kontrol et
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ coach_id sütunu mevcut'
        ELSE '❌ coach_id sütunu YOK - eklenecek'
    END as coach_id_durumu
FROM information_schema.columns 
WHERE table_name = 'notifications' AND column_name = 'coach_id';

-- 3. Eğer coach_id yoksa ekle
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'coach_id'
    ) THEN
        ALTER TABLE notifications ADD COLUMN coach_id UUID;
        RAISE NOTICE '✅ coach_id sütunu eklendi';
        
        -- Mevcut verileri güncelle (recipient_id'den kopyala)
        UPDATE notifications SET coach_id = recipient_id WHERE coach_id IS NULL;
        RAISE NOTICE '✅ Mevcut veriler güncellendi';
    ELSE
        RAISE NOTICE '✅ coach_id sütunu zaten mevcut';
    END IF;
END $$;

-- 4. İndeksleri ekle (eğer yoksa)
CREATE INDEX IF NOT EXISTS idx_notifications_coach_id ON notifications(coach_id);
CREATE INDEX IF NOT EXISTS idx_notifications_coach_unread ON notifications(coach_id, is_read) WHERE is_read = false;

-- 5. Kontrol: Güncellenmiş tablo yapısı
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- 6. Veri kontrolü
SELECT 
    COUNT(*) as toplam,
    COUNT(coach_id) as coach_id_dolu,
    COUNT(CASE WHEN coach_id IS NULL THEN 1 END) as coach_id_bos
FROM notifications;