# Günlük

Günlük çalışma raporları, yapılacaklar ve notlar için sade bir defter. Projelere göre gruplar, gün gün rapor tutar ve "bugün ne yaptın?" diyene raporu tek tıkla paylaşır.

- **Raporlar:** Takvimden günü seç, her projeye o gün ne yaptığını ve kaç saat çalıştığını yaz.
- **Yapılacaklar:** Proje bazlı iş listeleri. İşlere son tarih verilir, başkasını bekleyen işler "bekliyor" olarak işaretlenir; tamamlananlar o günün raporuna eklenir.
- **Süre özeti:** Haftalık ve aylık çalışma süresi, projelere ve günlere göre.
- **İki dil:** Türkçe ve İngilizce (English: the app is called Daybook).
- **Notlar ve planlar:** Serbest notlar; bir projeye bağlı ya da genel.
- **Paylaş:** Gün, hafta, ay ya da özel aralık için raporu WhatsApp metni, Markdown ya da PDF olarak al.
- **GitHub (isteğe bağlı):** GitHub ile giriş yapanlar repolarının adlarını proje olarak ekleyebilir. Yalnızca adlar alınır.

Arayüz Next.js ve shadcn/ui, backend FastAPI (`api/index.py`), veritabanı ve giriş Supabase.

## Çalıştırma

```bash
npm install
pip install -r requirements.txt
npm run dev
```

`npm run dev` arayüzü (3210) ve FastAPI backend'ini (8210) birlikte başlatır. Python 3.10 ya da üstü gerekir.

Tarayıcıda `http://localhost:3210` adresini aç. Windows'ta `baslat.bat` dosyasına çift tıklamak da yeter.

Hiçbir ayar yapmadan çalıştırırsan giriş sorulmaz ve kayıtlar `data/gunluk.json` dosyasında durur; bu kipte Python kurulu olmasa da uygulama çalışır.

## Hesapla giriş ve bulutta kayıt (Supabase)

1. Supabase'de bir proje oluştur.
2. SQL Editor'de `supabase/kurulum.sql` dosyasını çalıştır.
3. `.env.example` dosyasını `.env.local` adıyla kopyala; `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` değerlerini doldur. Buraya publishable (anon) anahtar yazılır, secret anahtar değil.
4. Authentication → Sign In / Providers → Email bölümünde **Confirm email** ayarını kapat (kullanıcı adıyla kayıt için gerekli).
5. Authentication → URL Configuration bölümünde Site URL'i ve Redirect URLs listesini uygulamanın adresiyle doldur (`http://localhost:3210` ve yayındaki adres).

Bundan sonra uygulama giriş ister; herkes bir kullanıcı adı ve şifreyle kayıt olup yalnızca kendi kayıtlarını görür. E-posta sorulmaz; bu yüzden unutulan şifre ancak Supabase panelinden (Authentication → Users) sıfırlanır.

Giriş tarayıcıda Supabase ile yapılır. Kayıtlar FastAPI backend'i üzerinden okunup yazılır (`/api/py/state`); backend, kullanıcının oturum anahtarıyla Supabase'e gider, bu yüzden gizli (secret) anahtar gerekmez. Uç noktaların dökümü: `http://localhost:3210/api/py/docs`.

### GitHub ile giriş

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
   - Authorization callback URL: `https://<proje-kodun>.supabase.co/auth/v1/callback`
2. Supabase → Authentication → Sign In / Providers → GitHub'ı aç; Client ID ve Client Secret değerlerini gir.

## Yayınlama (Vercel)

Repoyu Vercel'e bağla (Framework: Next.js). `api/index.py` Python fonksiyonu olarak kendiliğinden yayınlanır; ayrı sunucu gerekmez. `.env.local` içindeki iki Supabase değerini Environment Variables bölümüne gir. Yayındaki adresi Supabase'in Redirect URLs listesine eklemeyi unutma.
