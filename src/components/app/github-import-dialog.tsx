"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2Icon, LockIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { COLORS } from "@/lib/types"

type Repo = { full: string; name: string; owner: string; isPrivate: boolean }

export function GithubImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <Body close={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

/** Yalnızca repo adlarını okur; kod, commit ya da başka bir içerik çekilmez. */
async function listRepos(token: string): Promise<Repo[]> {
  const out: Repo[] = []
  for (let page = 1; page <= 3; page++) {
    const r = await fetch(`https://api.github.com/user/repos?per_page=100&sort=pushed&page=${page}`, {
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}` },
    })
    if (r.status === 401) throw new Error("expired")
    if (!r.ok) throw new Error("fail")
    const list = (await r.json()) as { full_name: string; name: string; private: boolean; owner: { login: string } }[]
    for (const x of list) out.push({ full: x.full_name, name: x.name, owner: x.owner.login, isPrivate: x.private })
    if (list.length < 100) break
  }
  return out
}

function Body({ close }: { close: () => void }) {
  const { state, githubToken, signInGithub, saveProject } = useStore()
  const { t } = useI18n()
  const [repos, setRepos] = useState<Repo[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [expired, setExpired] = useState(!githubToken)
  const [query, setQuery] = useState("")
  const [picked, setPicked] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!githubToken) return
    let off = false
    listRepos(githubToken)
      .then((r) => !off && setRepos(r))
      .catch((e: Error) => {
        if (off) return
        if (e.message === "expired") setExpired(true)
        else setFailed(true)
      })
    return () => {
      off = true
    }
  }, [githubToken])

  const added = useMemo(() => new Set(state.projects.map((p) => p.repo).filter(Boolean)), [state.projects])
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (repos || []).filter((r) => !q || r.full.toLowerCase().includes(q))
  }, [repos, query])
  const hasPrivate = !!repos?.some((r) => r.isPrivate)

  const toggle = (full: string) =>
    setPicked((s) => {
      const n = new Set(s)
      if (n.has(full)) n.delete(full)
      else n.add(full)
      return n
    })

  const add = () => {
    const list = (repos || []).filter((r) => picked.has(r.full))
    list.forEach((r, i) => saveProject({ name: r.name, color: COLORS[(state.projects.length + i) % COLORS.length], repo: r.full }))
    toast.success(t("gh.addedToast", { n: list.length }))
    close()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("gh.title")}</DialogTitle>
        <DialogDescription>{t("gh.desc")}</DialogDescription>
      </DialogHeader>

      {expired ? (
        <div className="grid gap-3 rounded-lg border p-4 text-sm">
          <p>{t("gh.reconnectText")}</p>
          <div>
            <Button onClick={() => signInGithub()}>{t("gh.reconnect")}</Button>
          </div>
        </div>
      ) : failed ? (
        <p role="alert" className="text-sm text-destructive">
          {t("gh.fail")}
        </p>
      ) : !repos ? (
        <div className="grid place-items-center py-10 text-muted-foreground">
          <Loader2Icon className="size-5 animate-spin" aria-label={t("gh.loading")} />
        </div>
      ) : (
        <>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("gh.search")} aria-label={t("gh.search")} />
          <ul className="-mx-1 grid max-h-72 overflow-y-auto">
            {shown.map((r) => {
              const has = added.has(r.full)
              return (
                <li key={r.full}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted has-disabled:cursor-default has-disabled:opacity-60">
                    <Checkbox checked={has || picked.has(r.full)} disabled={has} onCheckedChange={() => toggle(r.full)} />
                    <span className="min-w-0 flex-1 truncate">
                      <span className="text-muted-foreground">{r.owner}/</span>
                      {r.name}
                    </span>
                    {r.isPrivate && <LockIcon className="size-3.5 shrink-0 text-muted-foreground" aria-label={t("gh.private")} />}
                    {has && <span className="shrink-0 text-xs text-muted-foreground">{t("gh.added")}</span>}
                  </label>
                </li>
              )
            })}
            {shown.length === 0 && <li className="px-2 py-6 text-center text-sm text-muted-foreground">{t("gh.noMatch")}</li>}
          </ul>
          {!hasPrivate && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("gh.publicOnly")}{" "}
              <button
                type="button"
                onClick={() => signInGithub(true)}
                className="font-medium text-foreground underline underline-offset-4 outline-none hover:no-underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {t("gh.showPrivate")}
              </button>{" "}
              {t("gh.showPrivateAfter")}
            </p>
          )}
        </>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={close}>
          {t("common.cancel")}
        </Button>
        <Button onClick={add} disabled={!picked.size}>
          {picked.size ? t("gh.addN", { n: picked.size }) : t("gh.addNone")}
        </Button>
      </DialogFooter>
    </>
  )
}
