-- SORUN ÇÖZÜMÜ: Veri tipi uyumsuzluğu düzeltme

-- 1. Önce mevcut fonksiyonu silelim
DROP FUNCTION IF EXISTS get_coach_leaderboard(UUID);

-- 2. Düzeltilmiş fonksiyonu oluşturalım
-- student_name için VARCHAR(255) yerine TEXT kullanıyoruz
CREATE OR REPLACE FUNCTION get_coach_leaderboard(coach_id UUID)
RETURNS TABLE(
    student_id UUID,
    student_name VARCHAR(255),  -- Bu satırda VARCHAR(255) kullanıyoruz
    total_score INTEGER,
    monthly_questions BIGINT,
    monthly_exams BIGINT,
    last_activity DATE,
    rank INTEGER,
    streak_days INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH student_scores AS (
        SELECT 
            u.id as student_id,
            u.full_name::VARCHAR(255) as student_name,  -- Açık cast yapıyoruz
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
            ), 0) as streak_days,
            -- Bu ay çözülen toplam soru sayısı
            COALESCE((
                SELECT SUM(question_count) 
                FROM daily_logs dl4
                WHERE dl4.student_id = u.id 
                AND dl4.date >= DATE_TRUNC('month', CURRENT_DATE)
            ), 0) as monthly_questions,
            -- Bu ay yapılan deneme sayısı
            COALESCE((
                SELECT COUNT(*) 
                FROM trial_exams te2
                WHERE te2.student_id = u.id 
                AND te2.date >= DATE_TRUNC('month', CURRENT_DATE)
            ), 0) as monthly_exams,
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

-- 3. Test sorgusu - gerçek coach ID'nizi buraya yazın
SELECT 'Fonksiyon Test:' as test_type;
-- SELECT * FROM get_coach_leaderboard('GERÇEK_COACH_ID_BURAYA');

-- 4. Tüm coach'ları listeleyelim
SELECT 'Coach Listesi:' as test_type;
SELECT 
    id as coach_id,
    full_name as coach_name,
    email
FROM users 
WHERE role = 'coach'
ORDER BY created_at DESC;