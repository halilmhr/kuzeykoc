-- AYŞE'nin gerçek coach'ını bulalım ve düzeltelim

-- 1. AYŞE'nin mevcut durumu
SELECT 
    id, 
    full_name, 
    email, 
    role, 
    coach_id 
FROM users 
WHERE full_name = 'AYŞE ADIYAMAN';

-- 2. Tüm coach'ları listele
SELECT 
    id, 
    full_name, 
    email 
FROM users 
WHERE role = 'coach';

-- 3. Eğer AYŞE'nin farklı bir koçu varsa onu göster
SELECT 
    coach.id as coach_id,
    coach.full_name as coach_name,
    coach.email as coach_email
FROM users student
JOIN users coach ON student.coach_id = coach.id
WHERE student.full_name = 'AYŞE ADIYAMAN' 
AND coach.role = 'coach';