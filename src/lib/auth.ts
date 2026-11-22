import { createHash, createHmac, timingSafeEqual } from "node:crypto"

// APP_PASSWORD doluysa uygulama giriş ister; boşsa (yalnızca bu bilgisayarda kullanım) giriş sorulmaz.
const password = process.env.APP_PASSWORD?.trim() || ""
const COOKIE = "gunluk_oturum"
const MAX_AGE = 60 * 60 * 24 * 90 // 90 gün

export const authEnabled = password.length > 0

const sha = (s: string) => createHash("sha256").update(s).digest()
const safeEqual = (a: string, b: string) => timingSafeEqual(sha(a), sha(b))
// Oturum değeri şifreden türetilir: şifre değişince eski oturumlar kendiliğinden geçersiz olur.
const sessionValue = () => createHmac("sha256", password).update("gunluk-oturum-v1").digest("hex")

export function isAuthed(req: Request) {
  if (!authEnabled) return true
  const m = /(?:^|;\s*)gunluk_oturum=([^;]+)/.exec(req.headers.get("cookie") || "")
  return !!m && safeEqual(m[1], sessionValue())
}

export const passwordMatches = (input: string) => authEnabled && safeEqual(input, password)

export function sessionCookie(clear = false) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : ""
  return `${COOKIE}=${clear ? "" : sessionValue()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : MAX_AGE}${secure}`
}
