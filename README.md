# LGS Öğrenci Koçluk Platformu

Modern ve kullanıcı dostu LGS öğrenci koçluk platformu. React 19 + TypeScript + Supabase ile geliştirilmiştir.

## 🚀 Özellikler

### Koç Paneli
- 📊 **Öğrenci Yönetimi**: Öğrenci ekle, düzenle ve performans takibi
- 📋 **Program Oluşturma**: Haftalık çalışma programları oluşturma ve atama
- 📈 **Performans Analizi**: Öğrenci başarı grafikleri ve istatistikler
- 🎯 **Hedef Takibi**: Bireysel hedef belirleme ve izleme

### Öğrenci Paneli
- 📅 **Haftalık Program**: Koç tarafından atanan görevleri görüntüleme ve tamamlama
- ✅ **Görev Takibi**: Günlük soru sayısı kaydetme ve ilerleme izleme
- 📝 **Deneme Sonuçları**: Deneme sınavı sonuçlarını kaydetme ve analiz etme
- 💪 **Motivasyon**: Koçtan gelen motivasyonel mesajlar

### Genel Özellikler
- 🌓 **Tema Desteği**: Açık/koyu tema seçeneği
- 📱 **Responsive Tasarım**: Mobil ve masaüstü uyumlu
- 🔐 **Güvenli Veri Saklama**: Supabase ile güvenli veritabanı
- ⚡ **Hızlı Performans**: Modern React ve Vite ile optimize edilmiş

## 🛠️ Teknoloji Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Routing**: React Router DOM
- **Charts**: Recharts
- **Database**: Supabase (PostgreSQL)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS

## 📦 Kurulum

**Ön Gereksinimler:** Node.js (v16+), Supabase hesabı

1. **Projeyi klonlayın:**
   ```bash
   git clone <repository-url>
   cd lgs-student-coaching-platform
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Supabase kurulumu:**
   - [SUPABASE_SETUP.md](SUPABASE_SETUP.md) dosyasındaki detaylı kurulum talimatlarını takip edin
   - Supabase projenizi oluşturun
   - Veritabanı şemasını yükleyin
   - API anahtarlarını alın

4. **Environment değişkenlerini ayarlayın:**
   `.env.local` dosyasında:
   ```env
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

5. **Uygulamayı başlatın:**
   ```bash
   npm run dev
   ```

## 🎮 İlk Kurulum Sonrası

### Koç Hesabı Oluşturma
1. Login sayfasında **"Koç"** sekmesini seçin
2. **"Koç hesabı oluştur"** linkine tıklayın
3. Koç bilgilerini girin ve hesabı oluşturun
4. Oluşturulan e-posta ile giriş yapın

### Öğrenci Ekleme
1. Koç panelinde **"Yeni Öğrenci Ekle"** butonunu kullanın
2. Öğrenci bilgilerini girin
3. Öğrenci kendi e-postası ile giriş yapabilir

## 🏗️ Proje Yapısı

```
src/
├── components/          # Yeniden kullanılabilir bileşenler
│   ├── common/         # Genel UI bileşenleri
│   └── student/        # Öğrenciye özel bileşenler
├── contexts/           # React Context'ler
├── pages/              # Sayfa bileşenleri
├── services/           # API ve servis katmanı
├── types.ts            # TypeScript tip tanımları
└── App.tsx            # Ana uygulama bileşeni
```

## 📊 Veritabanı Şeması

- **users**: Kullanıcı bilgileri (koç/öğrenci)
- **assignments**: Ödevler ve görevler
- **daily_logs**: Günlük çalışma kayıtları
- **trial_exams**: Deneme sınavı sonuçları
- **trial_exam_details**: Ders bazında deneme detayları
- **books**: LGS kaynak kitapları

Detaylı şema için `supabase-schema.sql` dosyasına bakın.

## 🔧 Geliştirme

### Mevcut Komutlar

```bash
npm run dev      # Geliştirme sunucusunu başlat
npm run build    # Üretim için derle
npm run preview  # Üretim derlemeyi önizle
```

### Önemli Dosyalar

- `services/supabaseClient.ts`: Veritabanı işlemleri
- `services/supabaseApi.ts`: Uygulama API katmanı
- `types.ts`: TypeScript tip tanımları
- `SUPABASE_SETUP.md`: Detaylı kurulum rehberi

## 🚀 Üretim Ortamı

Üretim ortamı için ek adımlar:
1. Row Level Security (RLS) politikalarını ayarlayın
2. Supabase yedekleme stratejisi oluşturun
3. Environment değişkenlerini güvenli şekilde yönetin
4. Performans izleme aktivleştirin

## 🤝 Katkı Sağlama

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 Destek

Herhangi bir sorun yaşarsanız:
- [Issues](../../issues) bölümünde yeni bir issue açın
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) dosyasındaki rehberi kontrol edin
- Supabase dokümantasyonuna başvurun

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!
