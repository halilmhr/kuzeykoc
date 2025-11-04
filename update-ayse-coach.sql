-- AYŞE'nin coach_id'sini HALİL'e update et
UPDATE users 
SET coach_id = 'db62a809-35d6-4ff2-a169-d571bd401f2e' 
WHERE full_name = 'AYŞE ADIYAMAN';

-- Kontrol et
SELECT 
    id, 
    full_name, 
    coach_id 
FROM users 
WHERE full_name = 'AYŞE ADIYAMAN';

-- HALİL'in adını da kontrol et
SELECT 
    id, 
    full_name 
FROM users 
WHERE id = 'db62a809-35d6-4ff2-a169-d571bd401f2e';