import { passwordMatches, sessionCookie } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  let input = ""
  try {
    input = String((await req.json())?.password ?? "")
  } catch {}
  if (!passwordMatches(input)) {
    // Deneme-yanılmayı yavaşlatmak için kısa bekleme
    await new Promise((r) => setTimeout(r, 800))
    return Response.json({ error: "Şifre yanlış." }, { status: 401 })
  }
  return Response.json({ ok: true }, { headers: { "Set-Cookie": sessionCookie() } })
}

export async function DELETE() {
  return Response.json({ ok: true }, { headers: { "Set-Cookie": sessionCookie(true) } })
}
