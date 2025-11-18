-- Doğru verileri bulalım ve test edelim

-- 1. Tüm kullanıcıları listele
SELECT 'All Users:' as info;
SELECT id, full_name, email, role, coach_id FROM users ORDER BY role, full_name;

-- 2. Coach'ları listele
SELECT 'Coaches:' as info;
SELECT id, full_name, email FROM users WHERE role = 'coach';

-- 3. Students ve coach ilişkilerini göster
SELECT 'Student-Coach Relations:' as info;
SELECT 
    s.id as student_id,
    s.full_name as student_name,
    s.coach_id,
    c.full_name as coach_name
FROM users s
LEFT JOIN users c ON s.coach_id = c.id
WHERE s.role = 'student';

-- 4. Doğru coach ID ile leaderboard test et (aşağıdaki sorguyu gerçek coach ID ile güncelleyin)
SELECT 'Leaderboard Test with Real Coach ID:' as info;
-- İlk önce yukarıdaki sonuçları görün, sonra gerçek coach ID'yi buraya yazın