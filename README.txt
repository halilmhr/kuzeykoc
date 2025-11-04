================================
LGS KOÇLUK PLATFORMU - PROJE NOTLARI
================================

Bu dosya, LGS Koçluk Platformu uygulamasının genel yapısı, özellikleri ve demo kullanımı hakkında bilgi içerir.

----------------
1. PROJE AÇIKLAMASI
----------------
Bu platform, LGS'ye hazırlanan öğrenciler ve onlara koçluk yapan eğitmenler için geliştirilmiştir. Koçlar, öğrencilerini sisteme ekleyebilir, onlara özel haftalık çalışma programları oluşturabilir ve gelişimlerini (çözülen soru sayıları, deneme sınavı sonuçları) takip edebilirler. Öğrenciler ise kendilerine atanan programları görebilir, günlük çözdükleri soru sayılarını ve deneme sınavı sonuçlarını sisteme girebilirler.

----------------
2. ÖZELLİKLER
----------------

--- Koç Arayüzü ---
- Koç olarak sisteme giriş yapma.
- Kendisine bağlı olan öğrencilerin listesini görme.
- "Yeni Öğrenci Ekle" butonu ile sisteme yeni öğrenci kaydetme.
- Öğrenci listesinden bir öğrencinin ismine tıklayarak detay sayfasına gitme.
- Öğrenci Detay Sayfasında:
  - **Program Oluşturma:** Öğrenciye özel, sürükle-bırak destekli haftalık ders programı hazırlama ve kaydetme.
  - **Program Takibi:** Öğrencinin daha önce atanmış programlarını ve tamamlama yüzdelerini görme.
  - **Soru Analizi:** Öğrencinin günlük girdiği soru sayılarının grafiksel raporunu inceleme.
  - **Deneme Analizi:** Öğrencinin deneme sınavı sonuçlarını, netlerini ve gelişim grafiğini görme.

--- Öğrenci Arayüzü ---
- Öğrenci olarak sisteme giriş yapma.
- Girişte koçundan gelen motivasyonel bir mesajla karşılaşma.
- **Programlarım:** Kendisine atanan haftalık programları görme ve tamamladığı görevleri işaretleme.
- **Günlük Takip:** Tarih seçerek derslere göre çözdüğü günlük soru sayılarını sisteme kaydetme.
- **Deneme Sonuçları:** Girdiği deneme sınavlarının adını, tarihini ve derslere göre doğru/yanlış sayılarını girerek kaydetme.
- Kaydettiği geçmiş deneme sınavlarının detaylı sonuçlarını (doğru, yanlış, boş, net) ve listesini görme.

----------------
3. KURULUM VE VERİTABANI BAĞLANTISI
----------------

Uygulama, hem sahte verilerle (`services/mockApi.ts`) çalışabilir hem de bir Supabase projesine bağlanabilir.

**3.1. Supabase Bağlantısı (Önerilen):**

1.  Projenin ana dizininde `.env.local` adında yeni bir dosya oluşturun.
2.  Aşağıdaki içeriği kopyalayıp bu dosyaya yapıştırın:

    ```
    # Supabase projenizin ayarlarından bu bilgileri kopyalayın
    # Proje Ayarları > API > Proje URL'si
    VITE_SUPABASE_URL="YOUR_SUPABASE_URL"

    # Proje Ayarları > API > Proje API Anahtarları > anon (public)
    VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    ```

3.  `YOUR_SUPABASE_URL` ve `YOUR_SUPABASE_ANON_KEY` alanlarını kendi Supabase projenizin bilgileriyle güncelleyin.
4.  Aşağıdaki "SUPABASE VERİTABANI ŞEMASI" bölümündeki SQL kodunu çalıştırarak veritabanınızı hazırlayın.

**3.2. Demo (Çevrimdışı) Kullanım:**

Eğer Supabase kullanmak istemiyorsanız, uygulama `services/mockApi.ts` dosyasındaki sahte verilerle çalışmaya devam edecektir. Giriş yapmak için aşağıdaki bilgileri kullanabilirsiniz. Şifre alanı demo için gerekli değildir.

- **Öğrenci Girişi:**
  - **Rol:** Öğrenci
  - **E-posta:** ayse.lgs@example.com

- **Koç Girişi:**
  - **Rol:** Koç
  - **E-posta:** ahmet.hoca@example.com

----------------
4. TEMEL DOSYA YAPISI
----------------
- `index.html`: Ana HTML dosyası.
- `index.tsx`: React uygulamasını başlatan dosya.
- `App.tsx`: Ana yönlendirme (routing) ve yetkilendirme (authentication) mantığını içerir.
- `pages/`: Uygulamanın ana sayfalarını (Login, CoachDashboard, StudentDashboard vb.) barındıran bileşenler.
- `components/`: Sayfalar arasında tekrar kullanılabilen daha küçük UI bileşenleri (Card, Header, Spinner vb.).
- `services/`: API isteklerini (`mockApi.ts`, `supabaseClient.ts`) ve diğer servis dosyalarını içerir.
- `types.ts`: Uygulama genelinde kullanılan TypeScript arayüzlerini ve enum'larını tanımlar.
- `constants.ts`: Uygulamada kullanılan sabit değerleri içerir.
- `.env.local`: Supabase bağlantı bilgilerini saklayan ortam değişkenleri dosyası.

----------------
5. SUPABASE VERİTABANI ŞEMASI (SQL)
----------------
Aşağıdaki SQL kodunu Supabase projenizdeki SQL Editor'e yapıştırıp çalıştırarak uygulamanın veritabanı altyapısını kurabilirsiniz.

```sql
-- #############################################################################
-- ########################### LGS COACHING PLATFORM ###########################
-- ######################## SUPABASE DATABASE SCHEMA ###########################
-- #############################################################################

-- -----------------------------------------------------------------------------
-- 1. ENUMS (Custom Data Types)
-- -----------------------------------------------------------------------------

-- User roles
create type public.user_role as enum ('coach', 'student');

-- LGS Subjects
create type public.lgs_subject as enum ('Türkçe', 'Matematik', 'Fen Bilimleri', 'T.C. İnkılap Tarihi', 'Din Kültürü', 'İngilizce');

-- -----------------------------------------------------------------------------
-- 2. USERS TABLE
-- -----------------------------------------------------------------------------
-- This table stores public user information and is synced with auth.users.
create table public.users (
  id uuid not null primary key, -- References auth.users.id
  full_name text,
  email text unique,
  role public.user_role not null,
  coach_id uuid references public.users(id) on delete set null, -- For students, links to their coach
  programs jsonb default '[]'::jsonb -- For students, stores their weekly programs
);

-- Row Level Security for users table
alter table public.users enable row level security;

create policy "Users can view their own profile."
  on public.users for select
  using ( auth.uid() = id );

create policy "Coaches can view their students' profiles."
  on public.users for select
  using (
    id in (
      select u.id from public.users u where u.coach_id = auth.uid()
    )
  );

create policy "Students can view their coach's profile."
  on public.users for select
  using (
    id = (
      select u.coach_id from public.users u where u.id = auth.uid()
    )
  );

create policy "Users can update their own profile."
  on public.users for update
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

-- -----------------------------------------------------------------------------
-- 3. TRIGGER to sync AUTH.USERS with PUBLIC.USERS
-- -----------------------------------------------------------------------------
-- This function and trigger automatically create a new user profile
-- when a new user signs up via Supabase Auth.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, full_name, email, role, coach_id)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    (new.raw_user_meta_data->>'role')::public.user_role,
    (new.raw_user_meta_data->>'coach_id')::uuid
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- -----------------------------------------------------------------------------
-- 4. DAILY LOGS TABLE
-- -----------------------------------------------------------------------------
-- Stores the number of questions solved by a student daily per subject.
create table public.daily_logs (
  id bigint generated by default as identity primary key,
  student_id uuid not null references public.users(id) on delete cascade,
  subject public.lgs_subject not null,
  question_count int not null check (question_count >= 0),
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index on public.daily_logs (student_id);
create index on public.daily_logs (date);

-- Row Level Security for daily_logs table
alter table public.daily_logs enable row level security;

create policy "Students can create and manage their own logs."
  on public.daily_logs for all
  using ( auth.uid() = student_id )
  with check ( auth.uid() = student_id );

create policy "Coaches can view the logs of their students."
  on public.daily_logs for select
  using (
    student_id in (
      select u.id from public.users u where u.coach_id = auth.uid()
    )
  );


-- -----------------------------------------------------------------------------
-- 5. TRIAL EXAMS TABLE
-- -----------------------------------------------------------------------------
-- Stores results for trial exams.
create table public.trial_exams (
    id bigint generated by default as identity primary key,
    student_id uuid not null references public.users(id) on delete cascade,
    exam_name text not null,
    date date not null,
    total_correct int not null,
    total_incorrect int not null,
    total_blank int not null,
    details jsonb, -- Stores subject-specific results, e.g., [{"subject": "Türkçe", "correct": 18, ...}]
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index on public.trial_exams (student_id);

-- Row Level Security for trial_exams table
alter table public.trial_exams enable row level security;

create policy "Students can create and manage their own exam results."
  on public.trial_exams for all
  using ( auth.uid() = student_id )
  with check ( auth.uid() = student_id );

create policy "Coaches can view the exam results of their students."
  on public.trial_exams for select
  using (
    student_id in (
      select u.id from public.users u where u.coach_id = auth.uid()
    )
  );

```