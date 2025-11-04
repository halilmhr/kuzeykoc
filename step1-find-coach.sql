-- Adım adım ID'leri bulalım

-- 1. Sadece coach'ları göster
SELECT id, full_name, email FROM users WHERE role = 'coach';