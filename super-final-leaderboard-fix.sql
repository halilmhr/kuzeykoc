-- SUPER FINAL FIX: total_score BIGINT sorunu düzeltiliyor

-- 1. Fonksiyonu tamamen sil ve yeniden oluştur
DROP FUNCTION IF EXISTS get_coach_leaderboard(UUID);

-- 2. Her şeyi INTEGER cast ile düzeltilmiş version
CREATE OR REPLACE FUNCTION get_coach_leaderboard(coach_id UUID)
RETURNS TABLE(
    student_id UUID,
    student_name VARCHAR(255),
    total_score INTEGER,
    monthly_questions INTEGER,
    monthly_exams INTEGER,
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
            -- Tüm hesaplamaları INTEGER cast ile yapıyoruz
            (
                COALESCE((
                    -- Daily questions son 30 gün (her soru 10 puan)
                    SELECT SUM(dl.question_count)::INTEGER * 10
                    FROM daily_logs dl
                    WHERE dl.student_id = u.id 
                    AND dl.date >= CURRENT_DATE - INTERVAL '30 days'
                ), 0) +
                COALESCE((
                    -- Trial exams son 30 gün (her deneme 50 puan)
                    SELECT COUNT(*)::INTEGER * 50
                    FROM trial_exams te
                    WHERE te.student_id = u.id
                    AND te.date >= CURRENT_DATE - INTERVAL '30 days'
                ), 0) +
                (
                    -- Programs varsa puan (basit olarak 100)
                    CASE 
                        WHEN u.programs IS NOT NULL AND u.programs != '[]' AND u.programs != '' 
                        THEN 100 
                        ELSE 0 
                    END
                ) +
                COALESCE((
                    -- Streak puanı (son 7 gün ardışık çalışma)
                    SELECT COUNT(DISTINCT dl2.date)::INTEGER * 5
                    FROM daily_logs dl2
                    WHERE dl2.student_id = u.id 
                    AND dl2.date >= CURRENT_DATE - INTERVAL '7 days'
                ), 0)
            ) as total_score,
            -- Streak günleri hesaplama
            COALESCE((
                SELECT COUNT(DISTINCT dl3.date)::INTEGER
                FROM daily_logs dl3
                WHERE dl3.student_id = u.id 
                AND dl3.date >= CURRENT_DATE - INTERVAL '7 days'
            ), 0) as streak_days,
            -- Bu ay çözülen toplam soru sayısı
            COALESCE((
                SELECT SUM(question_count)::INTEGER
                FROM daily_logs dl4
                WHERE dl4.student_id = u.id 
                AND dl4.date >= DATE_TRUNC('month', CURRENT_DATE)
            ), 0) as monthly_questions,
            -- Bu ay yapılan deneme sayısı
            COALESCE((
                SELECT COUNT(*)::INTEGER
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

-- Test fonksiyonu
SELECT 'Final Test:' as info;
SELECT * FROM get_coach_leaderboard('c6e70716-2c5d-457b-8b39-1d7bdcc6a32b');

-- Eğer hiç sonuç yoksa, test verisi ekleyelim
SELECT 'Adding test data if needed...' as info;