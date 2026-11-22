import { promises as fs } from "node:fs"
import path from "node:path"
import { authEnabled, isAuthed } from "@/lib/auth"

// Yalnızca yerel kipte (Supabase ayarlı değilken) kullanılır: kayıtlar bu bilgisayardaki data/gunluk.json dosyasında durur.
export const dynamic = "force-dynamic"

const DIR = path.join(process.cwd(), "data")
const FILE = path.join(DIR, "gunluk.json")
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "x-gunluk-auth": authEnabled ? "on" : "off" } })
const denied = () => json({ error: "Giriş gerekli." }, 401)
// Hesaplı kipte (Supabase ayarlıyken) dosya hiç kullanılmaz; bu adres kapalıdır.
const cloud = !!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
const closed = () => json({ error: "Bulunamadı." }, 404)

export async function GET(req: Request) {
  if (cloud) return closed()
  if (!isAuthed(req)) return denied()
  try {
    return json(JSON.parse(await fs.readFile(FILE, "utf8")))
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return json({})
    return json({ error: "Kayıtlar okunamadı." }, 500)
  }
}

async function write(req: Request) {
  if (cloud) return closed()
  if (!isAuthed(req)) return denied()
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return json({ error: "Geçersiz veri." }, 400)
  }
  const b = body as { projects?: unknown; entries?: unknown }
  if (!b || !Array.isArray(b.projects) || typeof b.entries !== "object" || !b.entries)
    return json({ error: "Geçersiz veri." }, 400)
  try {
    await fs.mkdir(DIR, { recursive: true })
    const tmp = FILE + ".tmp"
    await fs.writeFile(tmp, JSON.stringify(body, null, 1), "utf8")
    await fs.rename(tmp, FILE)
    return json({ ok: true })
  } catch {
    return json({ error: "Kaydedilemedi." }, 500)
  }
}

export const PUT = write
export const POST = write
