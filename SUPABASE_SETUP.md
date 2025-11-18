# LGS Student Coaching Platform - Supabase Kurulum Rehberi

Bu rehber, LGS Öğrenci Koçluk Platformunu Supabase veritabanı ile nasıl ayarlayacağınızı açıklar.

## Ön Gereksinimler

- Node.js (v16 veya üzeri)
- Bir Supabase hesabı ([supabase.com](https://supabase.com))

## Adım 1: Supabase Proje Kurulumu

1. [Supabase Dashboard](https://app.supabase.com)'a gidin
2. "New Project" butonuna tıklayın
3. Proje detaylarını doldurun:
   - **Name**: `lgs-coaching-platform` (veya istediğiniz isim)
   - **Database Password**: Güçlü bir şifre seçin
   - **Region**: Size en yakın bölge
4. "Create new project" butonuna tıklayın
5. Proje oluşturulmasını bekleyin (2-3 dakika sürebilir)

## Adım 2: Veritabanı Şemasını Oluşturma

1. Supabase dashboard'unuzda sol menüden **SQL Editor**'a gidin
2. "New Query" butonuna tıklayın
3. `supabase-schema.sql` dosyasının içeriğini kopyalayıp SQL editörüne yapıştırın
4. "Run" butonuna tıklayarak şemayı çalıştırın
5. İşlemin başarıyla tamamlandığını kontrol edin

## Adım 3: API Anahtarlarını Alma

1. Supabase dashboard'unuzda sol menüden **Settings** > **API**'ye gidin
2. Aşağıdaki bilgileri not alın:
   - **Project URL**: `https://xxxxxxxxxx.supabase.co` formatında
   - **anon public key**: `eyJ...` ile başlayan uzun anahtar

## Adım 4: Environment Değişkenlerini Ayarlama

1. Projenizin kök dizinindeki `.env.local` dosyasını açın
2. Aşağıdaki değerleri güncelleyin:

```env
GEMINI_API_KEY=PLACEHOLDER_API_KEY

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Önemli**: `your-project-id` ve `your-anon-key-here` kısımlarını gerçek değerlerle değiştirin.

## Adım 5: Bağımlılıkları Yükleme ve Uygulamayı Başlatma

```bash
# Bağımlılıkları yükle
npm install

# Uygulamayı geliştirme modunda başlat
npm run dev
```

## İlk Koç Hesabını Oluşturma

Veritabanı boş bir şekilde kurulur. İlk koç hesabınızı oluşturmak için:

1. Uygulamayı başlatın (`npm run dev`)
2. Login sayfasında **"Koç"** sekmesini seçin
3. **"Koç hesabı oluştur"** linkine tıklayın
4. Açılan formda:
   - **Ad Soyad**: Koçun tam adı
   - **E-posta**: Koçun e-posta adresi
5. **"Koç Oluştur"** butonuna tıklayın
6. Başarıyla oluşturulduktan sonra aynı e-posta ile giriş yapabilirsiniz

### Öğrenci Ekleme

Koç hesabı oluşturduktan sonra:
1. Koç hesabı ile giriş yapın
2. Dashboard'da **"Yeni Öğrenci Ekle"** butonuna tıklayın
3. Öğrenci bilgilerini doldurun
4. Öğrenci eklendikten sonra o öğrenci kendi e-postası ile giriş yapabilir

## Veritabanı Yapısı

### Ana Tablolar

1. **users**: Koçlar ve öğrenciler için kullanıcı bilgileri
2. **books**: LGS kitapları ve kaynakları
3. **assignments**: Ödevler ve görevler
4. **daily_logs**: Günlük soru sayısı kayıtları
5. **trial_exams**: Deneme sınavı sonuçları
6. **trial_exam_details**: Deneme sınavı ders bazında detayları

### Önemli Özellikler

- **UUID Primary Keys**: Güvenli ve ölçeklenebilir kimlik sistemi
- **Row Level Security (RLS)**: Veri güvenliği için hazırlanmış (geliştirme aşamasında devre dışı)
- **Indexes**: Performans optimizasyonu için gerekli indeksler
- **Triggers**: Otomatik `updated_at` alanı güncelleme
- **Foreign Keys**: Veri bütünlüğü için referans kısıtlamaları

## Geliştirme Notları

### Mock API'den Supabase'e Geçiş

Proje artık gerçek Supabase veritabanını kullanıyor:
- ✅ Tüm mock API çağrıları Supabase API ile değiştirildi
- ✅ Async/await desteği eklendi
- ✅ Error handling iyileştirildi
- ✅ TypeScript tipleri güncellendi

### Önemli Dosya Değişiklikleri

1. **services/supabaseClient.ts**: Supabase client ve veritabanı fonksiyonları
2. **services/supabaseApi.ts**: Uygulama katmanı API fonksiyonları
3. **vite-env.d.ts**: TypeScript environment değişkenleri
4. **App.tsx**: Async authentication desteği
5. **pages/*.tsx**: Tüm sayfalar Supabase API kullanacak şekilde güncellendi

## Sorun Giderme

### Bağlantı Hataları
- `.env.local` dosyasında Supabase URL ve anahtarın doğru olduğunu kontrol edin
- Supabase projesinin aktif olduğunu doğrulayın

### Şema Hataları
- SQL dosyasının tamamen çalıştırıldığından emin olun
- Supabase SQL Editor'da hata mesajlarını kontrol edin

### Authentication Sorunları
- Test kullanıcılarının veritabanında mevcut olduğunu kontrol edin
- Doğru e-posta adreslerini kullandığınızdan emin olun

## Üretim Ortamı için Ek Adımlar

1. **Row Level Security (RLS) Politikaları**: Üretim için uygun güvenlik politikaları ekleyin
2. **Database Backups**: Otomatik yedekleme ayarlayın
3. **Environment Variables**: Üretim ortamı için ayrı değişkenler kullanın
4. **Monitoring**: Supabase dashboard'da performans izleme aktivleştirin

## Destek

Herhangi bir sorun yaşarsanız:
1. Bu dokümantasyonu tekrar gözden geçirin
2. Supabase resmi dokümantasyonuna bakın
3. Proje repository'sindeki issues bölümünü kontrol edin

Artık LGS Öğrenci Koçluk Platformunuz Supabase ile entegre olarak çalışmaya hazır! 🎉