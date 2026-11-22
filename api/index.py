"""Günlük uygulamasının backend'i (FastAPI).

Hesapla girişte kayıtlar bu servis üzerinden Supabase'deki `gunluk_veri` tablosuna okunup yazılır.
Tarayıcı, Supabase oturum anahtarını (JWT) Authorization başlığında gönderir; servis aynı anahtarla
Supabase'e gider. Böylece tablodaki satır düzeyi güvenlik kuralları geçerli kalır ve burada gizli
(secret / service_role) anahtar tutmak gerekmez.

Yerelde: python -m uvicorn api.index:app --port 8210   (npm run dev bunu kendisi başlatır)
Vercel'de: api/ klasöründeki bu dosya Python fonksiyonu olarak yayınlanır.
"""

import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel


def _load_env_file() -> None:
    """Yerelde .env.local dosyasındaki değerleri ortam değişkenlerine ekler (Vercel'de dosya yoktur)."""
    f = Path(__file__).resolve().parent.parent / ".env.local"
    if not f.exists():
        return
    for line in f.read_text("utf-8").splitlines():
        key, sep, val = line.strip().partition("=")
        if sep and not key.startswith("#"):
            os.environ.setdefault(key.strip(), val.strip().strip("\"'"))


_load_env_file()
# Adresin sonuna yanlışlıkla eklenen yol (ör. /rest/v1/) atılır.
_u = urlsplit(os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").strip())
SUPABASE_URL = f"{_u.scheme}://{_u.netloc}" if _u.scheme and _u.netloc else ""
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
TABLE = "gunluk_veri"

app = FastAPI(title="Günlük API", docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")


class StateIn(BaseModel):
    """Bir hesabın tüm kayıtları; biçimi src/lib/types.ts içindeki State ile aynıdır."""

    projects: list[dict]
    entries: dict[str, dict]
    todos: list[dict]
    notes: list[dict]


class SaveBody(BaseModel):
    data: StateIn


def _headers(authorization: str | None) -> dict[str, str]:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(503, "Supabase ayarlı değil")
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Giriş gerekli")
    return {"apikey": SUPABASE_KEY, "Authorization": authorization}


async def _supabase(method: str, headers: dict[str, str], **kw) -> httpx.Response:
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.request(method, f"{SUPABASE_URL}/rest/v1/{TABLE}", headers=headers, **kw)
    except httpx.HTTPError:
        raise HTTPException(502, "Supabase'e ulaşılamadı")
    if r.status_code in (401, 403):
        raise HTTPException(401, "Oturum geçersiz")
    if r.status_code >= 400:
        raise HTTPException(502, r.text[:300])
    return r


@app.get("/api/py/health")
def health():
    return {"ok": True, "supabase": bool(SUPABASE_URL and SUPABASE_KEY)}


@app.get("/api/py/state")
async def get_state(authorization: str | None = Header(None)):
    """Giriş yapan hesabın kayıtlarını döndürür; hesap henüz hiç kaydetmediyse data null olur."""
    r = await _supabase("GET", _headers(authorization), params={"select": "data"})
    rows = r.json()
    return {"data": rows[0]["data"] if rows else None}


@app.put("/api/py/state")
async def put_state(body: SaveBody, authorization: str | None = Header(None)):
    """Giriş yapan hesabın kayıtlarını yazar. Satırın sahibi (user_id) Supabase'de oturumdan belirlenir."""
    headers = _headers(authorization) | {"Prefer": "resolution=merge-duplicates,return=minimal"}
    row = {"data": body.data.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}
    await _supabase("POST", headers, params={"on_conflict": "user_id"}, json=row)
    return {"ok": True}
