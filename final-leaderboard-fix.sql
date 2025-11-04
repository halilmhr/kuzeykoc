-- FINAL FIX: Tüm veri tipi uyumsuzlukları düzeltiliyor

-- 1. Önce mevcut fonksiyonu silelim
DROP FUNCTION IF EXISTS get_coach_leaderboard(UUID);

-- 2. Tamamen düzeltilmiş fonksiyon - tüm veri tipleri match ediyor
CREATE OR REPLACE FUNCTION get_coach_leaderboard(coach_id UUID)
RETURNS TABLE(
    student_id UUID,
    student_name VARCHAR(255),
    total_score INTEGER,
    monthly_questions INTEGER,  -- BIGINT değil INTEGER
    monthly_exams INTEGER,      -- BIGINT değil INTEGER
    last_activity DATE,
    rank INTEGER,
    streak_days INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH student_scores AS (
        SELECT 
            u.id as student_id,
            u.full_name::VARCHAR(255) as student_name,
            COALESCE(
                (
                    -- Daily questions son 30 gün (her soru 10 puan)
                    SELECT SUM(dl.question_count) * 10
                    FROM daily_logs dl
                    WHERE dl.student_id = u.id 
                    AND dl.date >= CURRENT_DATE - INTERVAL '30 days'
                ) +
                (
                    -- Trial exams son 30 gün (her deneme 50 puan)
                    SELECT COUNT(*) * 50
                    FROM trial_exams te
                    WHERE te.student_id = u.id
                    AND te.date >= CURRENT_DATE - INTERVAL '30 days'
                ) +
                (
                    -- Programs varsa puan (basit olarak 100)
                    CASE 
                        WHEN u.programs IS NOT NULL AND u.programs != '[]' AND u.programs != '' 
                        THEN 100 
                        ELSE 0 
                    END
                ) +
                (
                    -- Streak puanı (son 7 gün ardışık çalışma)
                    SELECT COALESCE(COUNT(DISTINCT dl2.date) * 5, 0)
                    FROM daily_logs dl2
                    WHERE dl2.student_id = u.id 
                    AND dl2.date >= CURRENT_DATE - INTERVAL '7 days'
                ), 0
            ) as total_score,
            -- Streak günleri hesaplama
            COALESCE((
                SELECT COUNT(DISTINCT dl3.date)
                FROM daily_logs dl3
                WHERE dl3.student_id = u.id 
                AND dl3.date >= CURRENT_DATE - INTERVAL '7 days'
            ), 0)::INTEGER as streak_days,  -- INTEGER cast
            -- Bu ay çözülen toplam soru sayısı
            COALESCE((
                SELECT SUM(question_count) 
                FROM daily_logs dl4
                WHERE dl4.student_id = u.id 
                AND dl4.date >= DATE_TRUNC('month', CURRENT_DATE)
            ), 0)::INTEGER as monthly_questions,  -- INTEGER cast
            -- Bu ay yapılan deneme sayısı
            COALESCE((
                SELECT COUNT(*) 
                FROM trial_exams te2
                WHERE te2.student_id = u.id 
                AND te2.date >= DATE_TRUNC('month', CURRENT_DATE)
            ), 0)::INTEGER as monthly_exams,  -- INTEGER cast
            -- Son aktivite tarihi
            GREATEST(
                COALESCE((SELECT MAX(date) FROM daily_logs dl5 WHERE dl5.student_id = u.id), '1900-01-01'::date),
                COALESCE((SELECT MAX(date) FROM trial_exams te3 WHERE te3.student_id = u.id), '1900-01-01'::date)
            ) as last_activity
        FROM users u
        WHERE u.role = 'student' 
        AND u.coach_id = get_coach_leaderboard.coach_id
    )
    SELECT 
        ss.student_id,
        ss.student_name,
        ss.total_score,
        ss.monthly_questions,
        ss.monthly_exams,
        ss.last_activity,
        ROW_NUMBER() OVER (ORDER BY ss.total_score DESC, ss.last_activity DESC)::INTEGER as rank,
        ss.streak_days
    FROM student_scores ss
    ORDER BY ss.total_score DESC, ss.last_activity DESC;
END;
$$ LANGUAGE plpgsql;

-- 3. Test için basit veri ekleme (eğer hiç veri yoksa)
-- Bu satırları kendi gerçek ID'lerinizle değiştirin

-- Coach ID'sini al
SELECT 'Available Coaches:' as info;
SELECT id, full_name, email FROM users WHERE role = 'coach';

-- Student ID'sini al  
SELECT 'Available Students:' as info;
SELECT id, full_name, email, coach_id FROM users WHERE role = 'student';

-- Test verisi ekleme örneği (gerçek ID'lerle değiştirin)
/*
-- Örnek daily log ekleme
INSERT INTO daily_logs (student_id, subject, question_count, date)
VALUES ('GERÇEK_STUDENT_ID', 'Matematik', 25, CURRENT_DATE);

-- Örnek trial exam ekleme  
INSERT INTO trial_exams (student_id, exam_name, date, total_correct, total_incorrect, total_blank)
VALUES ('GERÇEK_STUDENT_ID', 'Test Denemesi', CURRENT_DATE, 45, 15, 10);
*/

-- Test fonksiyonu (gerçek coach ID ile)
SELECT 'Function Test:' as info;
-- SELECT * FROM get_coach_leaderboard('GERÇEK_COACH_ID');