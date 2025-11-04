-- RLS (Row Level Security) Geçici Devre Dışı Bırakma
-- Geliştirme aşaması için RLS politikalarını kaldırın

-- Tüm tablolar için RLS'yi devre dışı bırak
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE trial_exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE trial_exam_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE books DISABLE ROW LEVEL SECURITY;

-- Alternatif: Sadece users tablosu için RLS'yi devre dışı bırakmak isterseniz:
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- NOT: Üretim ortamında RLS'yi yeniden aktifleştirmeyi unutmayın!