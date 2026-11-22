"use client"

import { useRef, useState } from "react"
import { DownloadIcon, Loader2Icon, LogOutIcon, Trash2Icon, UploadIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { today } from "@/lib/dates"
import { useI18n } from "@/lib/i18n"
import { normalize, useStore, type Result } from "@/lib/store"
import { EMPTY, type State } from "@/lib/types"
import { download, Field } from "./field"
import { Collapse } from "./motion"
import { ThemeToggle } from "./theme-toggle"

export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-md">
        <Body close={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3 border-t pt-4">
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
      {children}
    </section>
  )
}

function Body({ close }: { close: () => void }) {
  const { mode, user, passwordOn, logout } = useStore()
  const { t, lang, setLang } = useI18n()
  const { resolvedTheme } = useTheme()

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("set.title")}</DialogTitle>
        <DialogDescription>{t("set.desc")}</DialogDescription>
      </DialogHeader>

      {user && (
        <Section title={t("set.account")}>
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold uppercase">{user.name.slice(0, 1)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.github ? t("set.viaGithub") : t("set.viaUsername")}</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOutIcon data-icon="inline-start" /> {t("side.logout")}
            </Button>
          </div>
          {!user.github && <PasswordChange />}
        </Section>
      )}
      {!user && passwordOn && (
        <Section title={t("set.account")}>
          <Button variant="outline" size="sm" className="justify-self-start" onClick={logout}>
            <LogOutIcon data-icon="inline-start" /> {t("side.logout")}
          </Button>
        </Section>
      )}

      <Section title={t("set.appearance")}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm">{t("set.language")}</span>
          <div className="flex items-center rounded-lg border bg-background p-0.5" role="group" aria-label={t("set.language")}>
            {(["tr", "en"] as const).map((l) => (
              <Button key={l} variant={lang === l ? "secondary" : "ghost"} size="sm" aria-pressed={lang === l} onClick={() => setLang(l)}>
                {l === "tr" ? "Türkçe" : "English"}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm">{t("set.theme")}</span>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            {resolvedTheme === "light" ? t("set.light") : t("set.dark")}
            <ThemeToggle variant="outline" />
          </span>
        </div>
      </Section>

      <Section title={t("set.data")}>
        <p className="text-xs leading-relaxed text-muted-foreground">{mode === "cloud" ? t("backup.descCloud") : t("backup.descFile")}</p>
        <Records close={close} />
      </Section>
    </>
  )
}

/** Kullanıcı adıyla açılan hesaplarda şifre değiştirme. */
function PasswordChange() {
  const { changePassword } = useStore()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<Result | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (pw !== pw2) return setError({ error: "auth.mismatch" })
    setBusy(true)
    setError(null)
    const r = await changePassword(pw)
    setBusy(false)
    if (r.error) return setError(r)
    toast.success(t("set.pwDone"))
    setPw("")
    setPw2("")
    setOpen(false)
  }

  return (
    <div>
      {!open && (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          {t("set.changePw")}
        </Button>
      )}
      <Collapse open={open}>
        <form onSubmit={submit} className="grid gap-3 pb-1">
          <Field label={t("set.newPw")} htmlFor="set-pw" hint={t("login.min6")}>
            <Input id="set-pw" type="password" autoComplete="new-password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} />
          </Field>
          <Field label={t("login.password2")} htmlFor="set-pw2">
            <Input id="set-pw2" type="password" autoComplete="new-password" required minLength={6} value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </Field>
          {error?.error && (
            <p role="alert" className="text-xs text-destructive">
              {t(error.error, error.vars)}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy}>
              {busy && <Loader2Icon data-icon="inline-start" className="animate-spin" />}
              {t("set.changePw")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setOpen(false)
                setError(null)
              }}
            >
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </Collapse>
    </div>
  )
}

/** Yedek alma, yedekten geri yükleme ve tüm kayıtları silme. */
function Records({ close }: { close: () => void }) {
  const { state, replaceAll } = useStore()
  const { t } = useI18n()
  const [pending, setPending] = useState<State | null>(null)
  const [clearing, setClearing] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  const counts = (s: State) => ({ p: s.projects.length, e: Object.keys(s.entries).length, t: s.todos.length, n: s.notes.length })

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (!f) return
    try {
      const d = JSON.parse(await f.text())
      if (!Array.isArray(d.projects) || typeof d.entries !== "object" || !d.entries) throw new Error()
      setPending(normalize(d))
    } catch {
      toast.error(t("backup.invalid"))
    }
  }

  if (pending)
    return (
      <div className="anim-enter grid gap-3 rounded-lg border p-3 text-sm">
        <p>{t("backup.confirm", counts(pending))}</p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              replaceAll(pending)
              toast.success(t("backup.done"))
              close()
            }}
          >
            {t("backup.replace")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
            {t("common.cancel")}
          </Button>
        </div>
      </div>
    )

  if (clearing)
    return (
      <div className="anim-enter grid gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
        <p>{t("set.clearWarn", counts(state))}</p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              replaceAll(EMPTY)
              toast.success(t("set.cleared"))
              close()
            }}
          >
            {t("set.clearYes")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setClearing(false)}>
            {t("common.cancel")}
          </Button>
        </div>
      </div>
    )

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={() => download(`daybook-${today()}.json`, JSON.stringify(state, null, 2), "application/json")}>
        <DownloadIcon data-icon="inline-start" /> {t("backup.download")}
      </Button>
      <Button variant="outline" size="sm" onClick={() => file.current?.click()}>
        <UploadIcon data-icon="inline-start" /> {t("backup.restore")}
      </Button>
      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setClearing(true)}>
        <Trash2Icon data-icon="inline-start" /> {t("set.clear")}
      </Button>
      <input ref={file} type="file" accept="application/json,.json" hidden onChange={onFile} />
    </div>
  )
}
