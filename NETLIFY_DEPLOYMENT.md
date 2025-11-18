# Netlify Deployment Guide

Bu proje Netlify'de otomatik olarak deploy edilebilir.

## 🚀 Netlify'de Deploy Etme

### Adım 1: Netlify Hesabı
1. [Netlify](https://netlify.com) hesabı oluşturun
2. GitHub hesabınızı bağlayın

### Adım 2: Site Oluşturma  
1. Netlify dashboard'da "New site from Git" tıklayın
2. GitHub'ı seçin ve bu repository'yi seçin
3. Build settings otomatik algılanacak:
   - **Branch to deploy**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### Adım 3: Environment Variables
Site settings > Environment variables bölümünde şu değişkenleri ekleyin:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Supabase bilgilerinizi nereden alacağınız:**
1. [Supabase Dashboard](https://app.supabase.com) > Projeniz
2. Settings > API > Project URL ve anon public key'i kopyalayın

### Adım 4: Deploy
1. "Deploy site" butonuna tıklayın
2. Build process başlayacak (2-3 dakika)
3. Site otomatik deploy edilecek

## 🔧 Netlify.toml Açıklaması

```toml
[build]
  publish = "dist"          # Vite build output directory
  command = "npm run build" # Build komutu

[build.environment]
  NODE_VERSION = "18"       # Node.js version

[[redirects]]
  from = "/*"              # Tüm routes
  to = "/index.html"       # React Router için SPA redirect
  status = 200             # 200 status code (rewrite)
```

## 📡 Custom Domain (Opsiyonel)

1. Site settings > Domain management
2. "Add custom domain" tıklayın
3. Domain'inizi girin
4. DNS ayarlarını yapın

## 🔄 Otomatik Deploy

- `main` branch'e her push'da otomatik deploy
- Pull request'ler için preview deploy
- Build başarısız olursa bildirim

## 🛠️ Troubleshooting

### Build Hatası
- Environment variables kontrol edin
- Node.js version uyumluluğu (18+)
- Package.json dependencies

### Runtime Hatası  
- Browser console log'larını kontrol edin
- Supabase bağlantısını test edin
- Network panel'de API call'ları kontrol edin

### 404 Hatası
- `netlify.toml` redirect kurallarını kontrol edin
- SPA routing ayarlarını doğrulayın

## 📊 Performance

Netlify otomatik olarak:
- ✅ CDN dağıtım
- ✅ Gzip sıkıştırma  
- ✅ Asset optimization
- ✅ Form handling
- ✅ Analytics (ücretsiz plan ile sınırlı)

## 📞 Destek

- [Netlify Docs](https://docs.netlify.com)
- [Netlify Community](https://community.netlify.com)
- GitHub Issues bu repository'de