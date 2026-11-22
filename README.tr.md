# Günlük (Daybook)

"Bugün ne yaptın?" diye sorulanlar için sade bir çalışma defteri.

Her gün projelerine kısa bir rapor yaz, yapılacaklarını ve notlarını yanında tut, istediğin günü, haftayı ya da ayı yapıştırmaya hazır bir özet olarak paylaş.

[English](README.md) · **Türkçe**

## Özellikler

- **Günlük raporlar** — takvimden günü seç, her projede o gün ne yaptığını ve kaç saat çalıştığını yaz.
- **Yapılacaklar** — proje bazlı iş listeleri, son tarihli. Başkasını bekleyen işi "bekliyor" olarak işaretle. Tamamlanan işler o günün raporuna eklenir.
- **Notlar ve planlar** — serbest notlar; bir projeye bağlı ya da genel.
- **Süre özeti** — haftalık ve aylık toplam, projelere ve günlere göre.
- **Paylaş** — gün, hafta, ay ya da özel aralığı WhatsApp metni, Markdown ya da PDF olarak al.
- **Hesaplar** — yalnızca kullanıcı adı ve şifreyle kayıt ol ya da GitHub ile devam et. Herkes yalnızca kendi kayıtlarını görür.
- **GitHub'dan proje ekleme (isteğe bağlı)** — repolarını proje olarak ekle. Yalnızca adlar okunur.
- **Türkçe ve İngilizce**, açık ve koyu tema.

## Kullanılanlar

| Katman | Teknoloji |
|---|---|
| Arayüz | Next.js (App Router), React, Tailwind CSS, shadcn/ui |
| Backend | FastAPI (`api/index.py`) |
| Veritabanı ve giriş | Supabase (satır düzeyi güvenlikli Postgres) |
| Yayın | Vercel (FastAPI aynı projede Python fonksiyonu olarak çalışır) |

Giriş tarayıcıda Supabase Auth ile yapılır. Okuma ve yazma FastAPI backend'inden geçer; backend kullanıcının oturum anahtarını Supabase'e iletir. Böylece satır düzeyi güvenlik her istekte geçerlidir ve hiçbir yerde gizli anahtar gerekmez.

## Bilgisayarında çalıştırma

Gerekenler: Node.js 20+ ve Python 3.10+.

```bash
npm install
pip install -r requirements.txt
npm run dev
```

`http://localhost:3210` adresini aç. `npm run dev` arayüzü (3210) ve FastAPI backend'ini (8210) birlikte başlatır.

Hiçbir ayar yapmazsan giriş sorulmaz ve kayıtlar bilgisayarındaki `data/gunluk.json` dosyasında durur. Bu kipte Python gerekmez.

## Hesaplar ve bulutta kayıt (Supabase)

1. Supabase'de bir proje oluştur.
2. SQL Editor'de `supabase/kurulum.sql` dosyasını çalıştır.
3. Authentication → Sign In / Providers → Email bölümünde **Confirm email** ayarını kapat. Kullanıcı adıyla kayıt için gerekli, çünkü gerçek bir e-posta adresi alınmaz.
4. `.env.example` dosyasını `.env.local` adıyla kopyala; `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` değerlerini doldur. Publishable (anon) anahtarı kullan, secret anahtarı değil.
5. Authentication → URL Configuration bölümünde Site URL'i ayarla ve uygulamanın adresini Redirect URLs listesine ekle (`http://localhost:3210` ve yayındaki adres).

Bundan sonra uygulama giriş ister. E-posta alınmadığı için unutulan şifre yalnızca Supabase panelinden (Authentication → Users) sıfırlanır.

### GitHub ile giriş

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
   - Authorization callback URL: `https://<proje-kodun>.supabase.co/auth/v1/callback`
2. Supabase → Authentication → Sign In / Providers → GitHub: aç, Client ID ve Client Secret değerlerini gir.

## Vercel'de yayınlama

1. Repoyu Vercel'e aktar (framework: Next.js).
2. `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` değerlerini ortam değişkeni olarak ekle.
3. Yayınla, sonra yayındaki adresi Supabase'in Site URL ve Redirect URLs alanlarına ekle.

`api/index.py` kendiliğinden Python fonksiyonu olarak yayınlanır; ayrı sunucu gerekmez. `https://<adresin>/api/py/health` adresi `{"ok": true, "supabase": true}` döndürmelidir.
