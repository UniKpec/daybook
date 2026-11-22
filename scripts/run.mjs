// Arayüzü (Next.js) ve backend'i (FastAPI) birlikte başlatır: node scripts/run.mjs dev | start
import { spawn } from "node:child_process"

const mode = process.argv[2] === "start" ? "start" : "dev"
const API_PORT = "8210"

const api = spawn(
  "python",
  ["-m", "uvicorn", "api.index:app", "--host", "127.0.0.1", "--port", API_PORT, ...(mode === "dev" ? ["--reload", "--reload-dir", "api"] : [])],
  { stdio: "inherit" }
)
api.on("error", () =>
  console.warn("\n[backend] Python bulunamadı; FastAPI başlatılamadı. Hesapla giriş çalışmaz, yerel dosya kipi çalışır.\n")
)

const web = spawn(process.execPath, ["node_modules/next/dist/bin/next", mode, "--port", "3210", "--hostname", "127.0.0.1"], { stdio: "inherit" })

const stop = () => {
  api.kill()
  web.kill()
}
process.on("SIGINT", stop)
process.on("SIGTERM", stop)
process.on("exit", stop)
web.on("exit", (code) => process.exit(code ?? 0))
