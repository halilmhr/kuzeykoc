-- Liderlik tablosu debug sorguları

-- 1. Önce öğrenci verilerini kontrol edelim
SELECT 'Öğrenci Verileri:' as check_type;
SELECT 
    id,
    full_name,
    email,
    role,
    coach_id,
    created_at
FROM users 
WHERE role = 'student'
ORDER BY created_at DESC;

-- 2. Daily logs verilerini kontrol edelim
SELECT 'Daily Logs Verileri:' as check_type;
SELECT 
    dl.id,
    dl.student_id,
    u.full_name as student_name,
    dl.subject,
    dl.question_count,
    dl.date,
    u.coach_id
FROM daily_logs dl
JOIN users u ON dl.student_id = u.id
ORDER BY dl.date DESC
LIMIT 10;

-- 3. Trial exams verilerini kontrol edelim
SELECT 'Trial Exams Verileri:' as check_type;
SELECT 
    te.id,
    te.student_id,
    u.full_name as student_name,
    te.exam_name,
    te.date,
    te.total_correct,
    u.coach_id
FROM trial_exams te
JOIN users u ON te.student_id = u.id
ORDER BY te.date DESC
LIMIT 10;

-- 4. Leaderboard view'ini test edelim
SELECT 'Leaderboard View Test:' as check_type;
SELECT * FROM leaderboard LIMIT 5;

-- 5. Specific coach leaderboard test edelim
-- Bu coach_id'yi gerçek bir coach id ile değiştirin
SELECT 'Coach Leaderboard Test:' as check_type;
SELECT * FROM get_coach_leaderboard('YOUR_COACH_ID_HERE'::UUID);

-- 6. Manuel puan hesaplama test
SELECT 'Manuel Puan Hesaplama:' as check_type;
SELECT 
    u.id,
    u.full_name,
    u.coach_id,
    -- Daily questions son 30 gün
    COALESCE((
        SELECT SUM(question_count) 
        FROM daily_logs dl 
        WHERE dl.student_id = u.id 
        AND dl.date >= CURRENT_DATE - INTERVAL '30 days'
    ), 0) as daily_questions_30d,
    -- Trial exams son 30 gün
    COALESCE((
        SELECT COUNT(*) * 50 
        FROM trial_exams te 
        WHERE te.student_id = u.id 
        AND te.date >= CURRENT_DATE - INTERVAL '30 days'
    ), 0) as trial_exams_30d,
    -- Programs varsa puan
    CASE 
        WHEN u.programs IS NOT NULL AND u.programs != '[]' AND u.programs != '' 
        THEN 100 
        ELSE 0 
    END as programs_score
FROM users u
WHERE u.role = 'student'
ORDER BY u.created_at DESC;