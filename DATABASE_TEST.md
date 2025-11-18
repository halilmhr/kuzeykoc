# Database Connection Test

Bu dosya Supabase bağlantınızı test etmenize yardımcı olur.

## Bağlantıyı Test Etme

1. **Environment Variables Kontrolü**
   - `.env.local` dosyasında `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` değerlerinin doğru olduğunu kontrol edin
   - URL formatı: `https://project-id.supabase.co`
   - Anon key formatı: `eyJ...` ile başlayan uzun string

2. **Browser Developer Console**
   - Uygulamayı açın (`npm run dev`)
   - Tarayıcıda F12'ye basın ve Console sekmesine gidin
   - Hata mesajları olup olmadığını kontrol edin

3. **Manual Test Queries**
   - Supabase Dashboard > SQL Editor'da şu sorguları çalıştırabilirsiniz:

```sql
-- Tüm tabloları listele
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Users tablosunu kontrol et
SELECT COUNT(*) FROM users;

-- Örnek koç ekleme testi
INSERT INTO users (email, full_name, role) 
VALUES ('test@example.com', 'Test Coach', 'coach')
RETURNING *;

-- Test koçu sil
DELETE FROM users WHERE email = 'test@example.com';
```

## Yaygın Sorunlar ve Çözümleri

### 1. "Cannot connect to Supabase" Hatası
- **Çözüm**: URL ve API key'lerin doğruluğunu kontrol edin
- **Kontrol**: Supabase dashboard > Settings > API

### 2. "Column does not exist" Hatası  
- **Çözüm**: `supabase-schema.sql` dosyasının tamamen çalıştırıldığından emin olun
- **Kontrol**: Supabase dashboard > Table Editor'da tabloları görün

### 3. "Permission denied" Hatası
- **Çözüm**: RLS (Row Level Security) politikalarını kontrol edin
- **Geçici çözüm**: Development için RLS'i devre dışı bırakabilirsiniz:

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE trial_exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE trial_exam_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE books DISABLE ROW LEVEL SECURITY;
```

### 4. "Invalid input syntax for type uuid" Hatası
- **Çözüm**: UUID extension'ının yüklendiğinden emin olun:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## Successful Connection Indicators

Bağlantı başarılı ise:
- ✅ Console'da Supabase hataları yok
- ✅ Login sayfası açılıyor
- ✅ "Koç hesabı oluştur" formu açılıyor
- ✅ Koç oluşturma işlemi çalışıyor

## Support

Hala sorun yaşıyorsanız:
1. Supabase project'inin aktif olduğunu kontrol edin
2. Internet bağlantınızı kontrol edin
3. Supabase status page'i kontrol edin: https://status.supabase.com
4. Proje dokümantasyonunu tekrar gözden geçirin