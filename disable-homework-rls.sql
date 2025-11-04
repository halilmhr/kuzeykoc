-- Homework tablosu için RLS'i geçici olarak devre dışı bırak
-- Authentication sistemi düzeltilene kadar

ALTER TABLE homework DISABLE ROW LEVEL SECURITY;

-- Mevcut politikaları sil
DROP POLICY IF EXISTS "Coaches can view homework for their students" ON homework;
DROP POLICY IF EXISTS "Coaches can insert homework for their students" ON homework;
DROP POLICY IF EXISTS "Coaches can update homework for their students" ON homework;
DROP POLICY IF EXISTS "Coaches can delete homework for their students" ON homework;
DROP POLICY IF EXISTS "Students can view their own homework" ON homework;
DROP POLICY IF EXISTS "Students can update completion status of their homework" ON homework;

-- Geçici olarak herkese erişim izni ver (development için)
-- NOT: Production'da mutlaka RLS aktif olmalı!