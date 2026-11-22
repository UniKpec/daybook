"use client"

import { useState } from "react"
import { Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/lib/i18n"
import { useStore, type Result } from "@/lib/store"
import { Collapse } from "./motion"
import { ThemeToggle } from "./theme-toggle"

function GithubMark() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden data-icon="inline-start">
      <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.72 1.22 1.88.87 2.33.66.07-.52.28-.87.5-1.07-1.77-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.22 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0Z" />
    </svg>
  )
}

export function Login() {
  const { mode } = useStore()
  const { t, lang, setLang } = useI18n()
  return (
    <div className="relative grid min-h-svh place-items-center p-6">
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs font-semibold text-muted-foreground"
          aria-label={t("side.language")}
          title={t("side.language")}
          onClick={() => setLang(lang === "tr" ? "en" : "tr")}
        >
          {lang === "tr" ? "TR" : "EN"}
        </Button>
        <ThemeToggle className="text-muted-foreground" />
      </div>
      <div className="anim-enter grid w-full max-w-xs gap-6">
        <div className="grid justify-items-center gap-3 text-center">
          <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <svg viewBox="0 0 16 16" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M3 4.5h10M3 8h10M3 11.5h6" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{t("app.name")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("app.tagline")}</p>
          </div>
        </div>
        {mode === "cloud" ? <AccountForm /> : <PasswordForm />}
      </div>
    </div>
  )
}

/** Hesaplı kip: GitHub ile ya da kullanıcı adı ve şifreyle giriş / kayıt. */
function AccountForm() {
  const { signInGithub, signInUser, signUpUser } = useStore()
  const { t } = useI18n()
  const [signup, setSignup] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [password2, setPassword2] = useState("")
  const [busy, setBusy] = useState<"github" | "user" | null>(null)
  const [error, setErrorState] = useState<Result | null>(null)
  // Hata kapanırken yazısı kaybolmasın diye son hata ayrıca tutulur.
  const [shown, setShown] = useState<Result | null>(null)
  const setError = (r: Result | null) => {
    setErrorState(r)
    if (r) setShown(r)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (signup && password !== password2) return setError({ error: "auth.mismatch" })
    setBusy("user")
    setError(null)
    const r = await (signup ? signUpUser : signInUser)(username, password)
    setBusy(null)
    if (r.error) setError(r)
  }

  const github = async () => {
    setBusy("github")
    setError(null)
    const r = await signInGithub()
    if (r.error) {
      setBusy(null)
      setError(r)
    }
  }

  return (
    <div className="grid gap-4">
      <Button variant="outline" size="lg" onClick={github} disabled={!!busy}>
        {busy === "github" ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <GithubMark />}
        {t("login.github")}
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("login.orUser")}
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={submit} className="grid">
        <div className="grid gap-1.5">
          <Label htmlFor="login-username">{t("login.username")}</Label>
          <Input
            id="login-username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            maxLength={24}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-describedby={signup ? "login-user-hint" : undefined}
          />
        </div>
        <Collapse open={signup}>
          <p id="login-user-hint" className="pt-1.5 text-xs text-muted-foreground">
            {t("login.userHint")}
          </p>
        </Collapse>
        <div className="mt-3 grid gap-1.5">
          <Label htmlFor="login-password">{t("login.password")}</Label>
          <Input
            id="login-password"
            type="password"
            autoComplete={signup ? "new-password" : "current-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby={signup ? "login-hint" : undefined}
          />
        </div>
        <Collapse open={signup}>
          <p id="login-hint" className="pt-1.5 text-xs text-muted-foreground">
            {t("login.min6")}
          </p>
          <div className="grid gap-1.5 pt-3 pb-1">
            <Label htmlFor="login-password2">{t("login.password2")}</Label>
            <Input
              id="login-password2"
              type="password"
              autoComplete="new-password"
              required={signup}
              minLength={6}
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
            />
          </div>
        </Collapse>
        <Collapse open={!!error?.error}>
          <p role="alert" className="pt-3 text-xs text-destructive">
            {shown?.error && t(shown.error, shown.vars)}
          </p>
        </Collapse>
        <Button type="submit" size="lg" disabled={!!busy} className="mt-3">
          {busy === "user" && <Loader2Icon data-icon="inline-start" className="animate-spin" />}
          {signup ? t("login.create") : t("login.signIn")}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {signup ? t("login.haveAccount") : t("login.noAccount")}{" "}
        <button
          type="button"
          onClick={() => {
            setSignup(!signup)
            setPassword2("")
            setError(null)
          }}
          className="font-medium text-foreground underline underline-offset-4 outline-none hover:no-underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {signup ? t("login.signIn") : t("login.signUp")}
        </button>
      </p>
    </div>
  )
}

/** Yerel kip: tek şifreyle giriş (APP_PASSWORD). */
function PasswordForm() {
  const { loginPassword } = useStore()
  const { t } = useI18n()
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<Result | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || busy) return
    setBusy(true)
    setError(null)
    const r = await loginPassword(password)
    setBusy(false)
    if (r.error) setError(r)
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="login-password">{t("login.password")}</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError(null)
          }}
          aria-invalid={!!error || undefined}
        />
        {error?.error && (
          <p role="alert" className="text-xs text-destructive">
            {t(error.error, error.vars)}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" disabled={!password || busy}>
        {busy && <Loader2Icon data-icon="inline-start" className="animate-spin" />} {t("login.signIn")}
      </Button>
    </form>
  )
}
