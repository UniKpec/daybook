import { createClient } from "@supabase/supabase-js"

// Bu iki değer tarayıcıya gider ve gizli değildir: verileri korumayı tablodaki satır düzeyi güvenlik kuralları yapar.
// Adresin sonuna yanlışlıkla eklenen yol (ör. /rest/v1/) atılır; yalnızca https://<proje>.supabase.co kısmı kullanılır.
const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
let url = raw
try {
  if (raw) url = new URL(raw).origin
} catch {}
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

/** Supabase ayarlıysa hesaplı (bulut) kip: giriş buradan, kayıtların okunup yazılması FastAPI backend'inden (api/index.py) yapılır; değilse null ve uygulama bu bilgisayardaki dosyayla çalışır. */
export const supabase = url && key ? createClient(url, key) : null

/**
 * Kullanıcı adıyla kayıt: Supabase hesap için e-posta ister, bu yüzden kullanıcı adı arka planda
 * "ad@<projenin Supabase adresi>" biçiminde bir adrese çevrilir. Bu adrese hiçbir zaman posta gönderilmez
 * (panelde "Confirm email" kapalı olmalıdır).
 */
let host = ""
try {
  host = url ? new URL(url).hostname : ""
} catch {}
export const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,23}$/
export const usernameToEmail = (username: string) => `${username.trim().toLowerCase()}@${host}`
export const emailToUsername = (email: string) => (host && email.endsWith("@" + host) ? email.slice(0, -host.length - 1) : null)
