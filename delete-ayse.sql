-- AYŞE ADIYAMAN'ı tamamen sil
-- Önce daily_logs'larını sil (foreign key nedeniyle)
DELETE FROM daily_logs WHERE student_id IN (
    SELECT id FROM users WHERE full_name = 'AYŞE ADIYAMAN'
);

-- Trial exam results varsa sil (doğru tablo adı: trial_exams)
DELETE FROM trial_exams WHERE student_id IN (
    SELECT id FROM users WHERE full_name = 'AYŞE ADIYAMAN'
);

-- Assignments varsa sil
DELETE FROM assignments WHERE student_id IN (
    SELECT id FROM users WHERE full_name = 'AYŞE ADIYAMAN'
);

-- Son olarak user'ı sil
DELETE FROM users WHERE full_name = 'AYŞE ADIYAMAN';

-- Kontrol et - hiçbirşey çıkmamalı
SELECT 
    id, 
    full_name, 
    email,
    coach_id,
    role 
FROM users 
WHERE full_name = 'AYŞE ADIYAMAN';

-- HALİL'in ID'sini göster (öğrenci eklerken lazım olacak)
SELECT 
    id, 
    full_name,
    role
FROM users 
WHERE full_name = 'HALİL ADIYAMAN';