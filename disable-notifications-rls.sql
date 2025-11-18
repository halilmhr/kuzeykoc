-- Notifications tablosu için RLS'i geçici olarak devre dışı bırak
-- Authentication sistemi düzeltilene kadar

ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Mevcut politikaları sil
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Allow insert for development" ON notifications;

-- Geçici olarak herkese erişim izni ver (development için)
-- NOT: Production'da mutlaka RLS aktif olmalı!