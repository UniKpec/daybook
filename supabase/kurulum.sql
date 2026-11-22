-- Günlük uygulaması için Supabase kurulumu.
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını yapıştır → Run.

-- Her hesabın tüm kayıtları (projeler, raporlar, yapılacaklar, notlar) tek satırda durur.
create table if not exists public.gunluk_veri (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Satır düzeyi güvenlik: herkes yalnızca kendi satırını okuyup yazabilir.
alter table public.gunluk_veri enable row level security;

drop policy if exists "kendi kaydini oku" on public.gunluk_veri;
create policy "kendi kaydini oku" on public.gunluk_veri
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "kendi kaydini ekle" on public.gunluk_veri;
create policy "kendi kaydini ekle" on public.gunluk_veri
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "kendi kaydini guncelle" on public.gunluk_veri;
create policy "kendi kaydini guncelle" on public.gunluk_veri
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Proje "yeni tablolara otomatik API erişimi verme" kapalıyken oluşturulduysa gerekli.
-- Giriş yapmamış ziyaretçilere (anon) hiçbir izin verilmez.
grant select, insert, update on public.gunluk_veri to authenticated;
