-- Güncellenmiş liderlik tablosu fonksiyonları
-- streak_days eksikliği düzeltildi

-- 1. Önce eski view'i drop edelim
DROP VIEW IF EXISTS leaderboard;
DROP FUNCTION IF EXISTS get_coach_leaderboard(UUID);

-- 2. Güncellenmiş puan hesaplama fonksiyonu
CREATE OR REPLACE FUNCTION calculate_student_score_with_details(student_id UUID, coach_id UUID)
RETURNS TABLE(
    total_score INTEGER,
    daily_questions_score INTEGER,
    trial_exams_score INTEGER,
    completed_tasks_score INTEGER,
    streak_score INTEGER,
    streak_days INTEGER
) AS $$
DECLARE
    _daily_questions INTEGER := 0;
    _trial_exams INTEGER := 0;
    _completed_tasks INTEGER := 0;
    _streak_days INTEGER := 0;
    _streak_score INTEGER := 0;
BEGIN
    -- Günlük soru sayısı puanı (son 30 gün) - her soru 10 puan
    SELECT COALESCE(SUM(question_count) * 10, 0)
    INTO _daily_questions
    FROM daily_logs dl
    JOIN users u ON dl.student_id = u.id
    WHERE dl.student_id = calculate_student_score_with_details.student_id 
    AND u.coach_id = calculate_student_score_with_details.coach_id
    AND dl.date >= CURRENT_DATE - INTERVAL '30 days';

    -- Deneme sınavı puanı (son 30 gün) - her deneme 50 puan
    SELECT COALESCE(COUNT(*) * 50, 0)
    INTO _trial_exams
    FROM trial_exams te
    JOIN users u ON te.student_id = u.id
    WHERE te.student_id = calculate_student_score_with_details.student_id
    AND u.coach_id = calculate_student_score_with_details.coach_id
    AND te.date >= CURRENT_DATE - INTERVAL '30 days';

    -- Tamamlanan görev puanı - her görev 20 puan
    SELECT CASE 
        WHEN u.programs IS NOT NULL AND u.programs != '[]' AND u.programs != '' 
        THEN 100 
        ELSE 0 
    END
    INTO _completed_tasks
    FROM users u
    WHERE u.id = calculate_student_score_with_details.student_id 
    AND u.coach_id = calculate_student_score_with_details.coach_id;

    -- Streak günleri hesaplama (ardışık çalışma günleri)
    WITH recent_activity_days AS (
        SELECT DISTINCT dl.date
        FROM daily_logs dl
        JOIN users u ON dl.student_id = u.id
        WHERE dl.student_id = calculate_student_score_with_details.student_id
        AND u.coach_id = calculate_student_score_with_details.coach_id
        AND dl.date >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY dl.date DESC
    ),
    streak_calculation AS (
        SELECT 
            date,
            date - (ROW_NUMBER() OVER (ORDER BY date DESC))::INTEGER * INTERVAL '1 day' as streak_group
        FROM recent_activity_days
    ),
    current_streak AS (
        SELECT COUNT(*) as streak_length
        FROM streak_calculation
        WHERE streak_group = (
            SELECT streak_group 
            FROM streak_calculation 
            WHERE date = (SELECT MAX(date) FROM recent_activity_days)
        )
    )
    SELECT COALESCE(streak_length, 0)
    INTO _streak_days
    FROM current_streak;

    -- Streak puanı - her gün 5 puan
    _streak_score := _streak_days * 5;

    -- Return values
    total_score := _daily_questions + _trial_exams + _completed_tasks + _streak_score;
    daily_questions_score := _daily_questions;
    trial_exams_score := _trial_exams;
    completed_tasks_score := _completed_tasks;
    streak_score := _streak_score;
    streak_days := _streak_days;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- 3. Güncellenmiş koç bazlı liderlik tablosu
CREATE OR REPLACE FUNCTION get_coach_leaderboard(coach_id UUID)
RETURNS TABLE(
    student_id UUID,
    student_name TEXT,
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
            u.full_name as student_name,
            scores.total_score,
            scores.streak_days,
            -- Bu ay çözülen toplam soru sayısı
            COALESCE((
                SELECT SUM(question_count) 
                FROM daily_logs dl
                WHERE dl.student_id = u.id 
                AND dl.date >= DATE_TRUNC('month', CURRENT_DATE)
            ), 0) as monthly_questions,
            -- Bu ay yapılan deneme sayısı
            COALESCE((
                SELECT COUNT(*) 
                FROM trial_exams te
                WHERE te.student_id = u.id 
                AND te.date >= DATE_TRUNC('month', CURRENT_DATE)
            ), 0) as monthly_exams,
            -- Son aktivite tarihi
            GREATEST(
                COALESCE((SELECT MAX(date) FROM daily_logs dl WHERE dl.student_id = u.id), '1900-01-01'::date),
                COALESCE((SELECT MAX(date) FROM trial_exams te WHERE te.student_id = u.id), '1900-01-01'::date)
            ) as last_activity
        FROM users u
        CROSS JOIN LATERAL calculate_student_score_with_details(u.id, u.coach_id) as scores
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

-- 4. Test sorgusu
-- Bu coach_id'yi gerçek bir coach id ile değiştirin
SELECT 'Test Coach Leaderboard:' as test_name;
-- SELECT * FROM get_coach_leaderboard('YOUR_REAL_COACH_ID_HERE'::UUID);

-- 5. Tüm öğrencileri görmek için
SELECT 'All Students Basic Info:' as test_name;
SELECT 
    id,
    full_name,
    email,
    coach_id,
    role,
    created_at
FROM users 
WHERE role = 'student'
ORDER BY created_at DESC;