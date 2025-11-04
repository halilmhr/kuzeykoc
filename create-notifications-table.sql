-- Bildirim sistemi için tablo oluşturma
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'daily_log', 'homework_completed', 'trial_exam'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Ek veri (studentId, subject, questionCount vs.)
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler performans için
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id, is_read) WHERE is_read = FALSE;

-- RLS politikaları
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi bildirimlerini görebilir
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid()::text = recipient_id::text);

-- Kullanıcılar kendi bildirimlerini güncelleyebilir (okundu işareti)
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid()::text = recipient_id::text);

-- Sistem bildirimleri ekleyebilir (geçici olarak herkese izin - production'da düzeltilecek)
CREATE POLICY "Allow insert for development" ON notifications
    FOR INSERT WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();