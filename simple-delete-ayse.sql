-- AYŞE'yi basit şekilde sil
-- Sadece users tablosundan sil, diğer veriler varsa manuel silinir

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

-- HALİL'in ID'sini göster
SELECT 
    id, 
    full_name,
    role
FROM users 
WHERE full_name = 'HALİL ADIYAMAN';