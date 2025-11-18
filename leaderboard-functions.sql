-- Liderlik tablosu için view oluşturuyoruz
-- Bu view sadece aynı koçun öğrencilerini karşılaştırır

-- 1. Öğrenci puanlama sistemi için fonksiyon
CREATE OR REPLACE FUNCTION calculate_student_score(student_id UUID, coach_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_score INTEGER := 0;
    daily_questions INTEGER := 0;
    trial_exams INTEGER := 0;
    completed_tasks INTEGER := 0;
    streak_days INTEGER := 0;
BEGIN
    -- Günlük soru sayısı puanı (son 30 gün)
    SELECT COALESCE(SUM(question_count), 0)
    INTO daily_questions
    FROM daily_logs dl
    JOIN users u ON dl.student_id = u.id
    WHERE dl.student_id = student_id 
    AND u.coach_id = coach_id
    AND dl.date >= CURRENT_DATE - INTERVAL '30 days';

    -- Deneme sınavı puanı (son 30 gün)
    SELECT COUNT(*) * 50
    INTO trial_exams
    FROM trial_exams te
    JOIN users u ON te.student_id = u.id
    WHERE te.student_id = student_id
    AND u.coach_id = coach_id
    AND te.date >= CURRENT_DATE - INTERVAL '30 days';

    -- Tamamlanan görev puanı (programs JSON'dan hesaplanacak)
    -- Bu basit bir implementasyon, gerçekte JSON parse edilmeli
    SELECT CASE 
        WHEN u.programs IS NOT NULL AND u.programs != '[]' AND u.programs != '' 
        THEN 100 
        ELSE 0 
    END
    INTO completed_tasks
    FROM users u
    WHERE u.id = student_id AND u.coach_id = coach_id;

    -- Streak puanı (ardışık çalışma günleri - son 7 gün)
    WITH consecutive_days AS (
        SELECT date,
               ROW_NUMBER() OVER (ORDER BY date) as rn,
               date - (ROW_NUMBER() OVER (ORDER BY date))::integer * INTERVAL '1 day' as group_date
        FROM (
            SELECT DISTINCT date
            FROM daily_logs dl
            JOIN users u ON dl.student_id = u.id
            WHERE dl.student_id = student_id 
            AND u.coach_id = coach_id
            AND dl.date >= CURRENT_DATE - INTERVAL '7 days'
            ORDER BY date
        ) distinct_dates
    ),
    max_streak AS (
        SELECT MAX(COUNT(*)) as longest_streak
        FROM consecutive_days
        GROUP BY group_date
    )
    SELECT COALESCE((SELECT longest_streak FROM max_streak), 0) * 20
    INTO streak_days;

    -- Toplam puan hesaplama
    total_score := daily_questions + trial_exams + completed_tasks + streak_days;

    RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- 2. Liderlik tablosu view'i
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    u.id,
    u.full_name,
    u.email,
    u.coach_id,
    calculate_student_score(u.id, u.coach_id) as total_score,
    -- Son aktivite tarihi
    GREATEST(
        COALESCE((SELECT MAX(date) FROM daily_logs WHERE student_id = u.id), '1900-01-01'::date),
        COALESCE((SELECT MAX(date) FROM trial_exams WHERE student_id = u.id), '1900-01-01'::date)
    ) as last_activity,
    -- Bu ay çözülen toplam soru sayısı
    COALESCE((
        SELECT SUM(question_count) 
        FROM daily_logs 
        WHERE student_id = u.id 
        AND date >= DATE_TRUNC('month', CURRENT_DATE)
    ), 0) as monthly_questions,
    -- Bu ay yapılan deneme sayısı
    COALESCE((
        SELECT COUNT(*) 
        FROM trial_exams 
        WHERE student_id = u.id 
        AND date >= DATE_TRUNC('month', CURRENT_DATE)
    ), 0) as monthly_exams
FROM users u
WHERE u.role = 'student'
ORDER BY total_score DESC, last_activity DESC;

-- 3. Koç bazlı liderlik tablosu için fonksiyon
CREATE OR REPLACE FUNCTION get_coach_leaderboard(coach_id UUID)
RETURNS TABLE(
    student_id UUID,
    student_name TEXT,
    total_score INTEGER,
    monthly_questions BIGINT,
    monthly_exams BIGINT,
    last_activity DATE,
    rank INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id as student_id,
        l.full_name as student_name,
        l.total_score,
        l.monthly_questions,
        l.monthly_exams,
        l.last_activity,
        ROW_NUMBER() OVER (ORDER BY l.total_score DESC, l.last_activity DESC)::INTEGER as rank
    FROM leaderboard l
    WHERE l.coach_id = get_coach_leaderboard.coach_id
    ORDER BY l.total_score DESC, l.last_activity DESC;
END;
$$ LANGUAGE plpgsql;