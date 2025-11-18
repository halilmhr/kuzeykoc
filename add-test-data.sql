-- Test verisi ekleme ve sonuç kontrolü

-- 1. Önce bu coach'a ait öğrenciler var mı bakalım
SELECT 'Students for this coach:' as info;
SELECT id, full_name, email 
FROM users 
WHERE role = 'student' AND coach_id = 'c6e70716-2c5d-457b-8b39-1d7bdcc6a32b';

-- 2. Eğer öğrenci varsa, onlar için test verisi ekleyelim
-- Daily logs ekle
INSERT INTO daily_logs (student_id, subject, question_count, date)
SELECT id, 'Matematik', 25, CURRENT_DATE
FROM users 
WHERE role = 'student' AND coach_id = 'c6e70716-2c5d-457b-8b39-1d7bdcc6a32b'
LIMIT 1;

INSERT INTO daily_logs (student_id, subject, question_count, date)
SELECT id, 'Türkçe', 15, CURRENT_DATE - INTERVAL '1 day'
FROM users 
WHERE role = 'student' AND coach_id = 'c6e70716-2c5d-457b-8b39-1d7bdcc6a32b'
LIMIT 1;

-- Trial exams ekle
INSERT INTO trial_exams (student_id, exam_name, date, total_correct, total_incorrect, total_blank)
SELECT id, 'Test Denemesi 1', CURRENT_DATE, 45, 15, 10
FROM users 
WHERE role = 'student' AND coach_id = 'c6e70716-2c5d-457b-8b39-1d7bdcc6a32b'
LIMIT 1;

-- 3. Şimdi leaderboard'u test edelim
SELECT 'Leaderboard Results:' as info;
SELECT * FROM get_coach_leaderboard('c6e70716-2c5d-457b-8b39-1d7bdcc6a32b');

-- 4. Eğer hala sonuç yoksa, coach'a yeni öğrenci ekleyelim
-- (Bu durumda manuel olarak ekleyeceğiz)