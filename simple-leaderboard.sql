-- Sadece günlük soru çözümlerine dayalı basit liderlik tablosu

-- 1. Mevcut fonksiyonu sil
DROP FUNCTION IF EXISTS get_coach_leaderboard(UUID);

-- 2. Basitleştirilmiş fonksiyon - sadece günlük sorular
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
            -- Sadece günlük sorular (son 30 gün) - her soru 1 puan
            COALESCE((
                SELECT SUM(dl.question_count)::INTEGER
                FROM daily_logs dl
                WHERE dl.student_id = u.id 
                AND dl.date >= CURRENT_DATE - INTERVAL '30 days'
            ), 0) as total_score,
            -- Bu ay çözülen toplam soru sayısı
            COALESCE((
                SELECT SUM(question_count)::INTEGER
                FROM daily_logs dl4
                WHERE dl4.student_id = u.id 
                AND dl4.date >= DATE_TRUNC('month', CURRENT_DATE)
            ), 0) as monthly_questions,
            -- Bu ay yapılan deneme sayısı (görüntü için - sıfır olacak)
            0 as monthly_exams,
            -- Streak günleri hesaplama (kaç gün üst üste soru çözmüş)
            COALESCE((
                SELECT COUNT(DISTINCT dl3.date)::INTEGER
                FROM daily_logs dl3
                WHERE dl3.student_id = u.id 
                AND dl3.date >= CURRENT_DATE - INTERVAL '7 days'
            ), 0) as streak_days,
            -- Son aktivite tarihi (sadece daily_logs'dan)
            COALESCE((
                SELECT MAX(date) 
                FROM daily_logs dl5 
                WHERE dl5.student_id = u.id
            ), '1900-01-01'::date) as last_activity
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
SELECT 'Simple Leaderboard Test:' as info;
SELECT * FROM get_coach_leaderboard('c6e70716-2c5d-457b-8b39-1d7bdcc6a32b');

-- Basit açıklama
SELECT 'Yeni sistem: Sadece günlük çözülen soru sayısı = puan' as explanation;