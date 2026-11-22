"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { today } from "./dates"
import type { TKey } from "./i18n"
import { emailToUsername, supabase, USERNAME_RE, usernameToEmail } from "./supabase"
import { EMPTY, k, uid, type Note, type Project, type State } from "./types"

export type SaveStatus = "idle" | "saving" | "saved" | "error"
export type User = { email: string; name: string; github: boolean }
/** error: çeviri anahtarı; ekranda seçili dilde gösterilir. */
export type Result = { error?: TKey; vars?: Record<string, string> }

type Store = {
  state: State
  ready: boolean
  loadError: boolean
  status: SaveStatus
  /** "cloud": Supabase hesabıyla, "file": bu bilgisayardaki dosyayla */
  mode: "cloud" | "file"
  needsLogin: boolean
  user: User | null
  /** Yerel kipte tek şifreyle korunuyor mu */
  passwordOn: boolean
  /** GitHub ile girişten gelen erişim anahtarı (yalnızca bu tarayıcıda durur) */
  githubToken: string | null
  loginPassword: (password: string) => Promise<Result>
  signInGithub: (withPrivate?: boolean) => Promise<Result>
  signInUser: (username: string, password: string) => Promise<Result>
  signUpUser: (username: string, password: string) => Promise<Result>
  changePassword: (password: string) => Promise<Result>
  logout: () => Promise<void>
  setEntry: (date: string, pid: string, patch: { text?: string; mins?: number }) => void
  saveProject: (p: Pick<Project, "name" | "color"> & { id?: string; repo?: string }) => void
  deleteProject: (id: string) => void
  addTodo: (pid: string, text: string, due?: string) => void
  setTodoDue: (id: string, due: string | undefined) => void
  /** who: tanımsızsa bekleme kaldırılır */
  setTodoWaiting: (id: string, who: string | undefined) => void
  toggleTodo: (id: string) => void
  deleteTodo: (id: string) => void
  addNote: (pid: string) => void
  updateNote: (id: string, patch: Partial<Pick<Note, "pid" | "title" | "body">>) => void
  deleteNote: (id: string) => void
  replaceAll: (s: State) => void
}

const Ctx = createContext<Store | null>(null)
export const useStore = () => {
  const s = useContext(Ctx)
  if (!s) throw new Error("StoreProvider eksik")
  return s
}

/** Dosyadan, buluttan ya da yedekten gelen veriyi güncel biçime tamamlar. */
export function normalize(d: Partial<State> | null | undefined): State {
  return {
    projects: Array.isArray(d?.projects) ? d.projects : [],
    entries: d?.entries && typeof d.entries === "object" ? d.entries : {},
    todos: Array.isArray(d?.todos) ? d.todos : [],
    notes: Array.isArray(d?.notes) ? d.notes : [],
  }
}

const GH_KEY = "gunluk.github-token"
const AUTH_ERRORS: [RegExp, TKey][] = [
  [/invalid login credentials/i, "auth.invalid"],
  [/already registered|already been registered/i, "auth.exists"],
  [/email not confirmed/i, "auth.confirmOn"],
  [/password should be at least|weak password/i, "auth.weak"],
  [/rate limit|too many/i, "auth.rate"],
  [/provider is not enabled/i, "auth.provider"],
]
const authError = (msg: string): Result => {
  const known = AUTH_ERRORS.find(([re]) => re.test(msg))?.[1]
  return known ? { error: known } : { error: "auth.generic", vars: { msg } }
}

/** Bulut kipinde kayıtlar FastAPI backend'i üzerinden okunup yazılır; istek kullanıcının Supabase oturum anahtarını taşır. */
async function api(method: "GET" | "PUT", body?: unknown) {
  const { data } = await supabase!.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error()
  const r = await fetch("/api/py/state", {
    method,
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!r.ok) throw new Error()
  return r
}

function toUser(session: Session): User {
  const u = session.user
  const meta = u.user_metadata || {}
  // Kullanıcı adıyla açılan hesaplarda e-posta arka planda üretilmiş bir adrestir; ekranda gösterilmez.
  const username = emailToUsername(u.email || "")
  return {
    email: username ? "" : u.email || "",
    name: username || meta.user_name || meta.preferred_username || meta.full_name || u.email || "",
    github: (u.app_metadata?.providers as string[] | undefined)?.includes("github") || u.app_metadata?.provider === "github",
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(EMPTY)
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [status, setStatus] = useState<SaveStatus>("idle")
  const [needsLogin, setNeedsLogin] = useState(false)
  const [passwordOn, setPasswordOn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [githubToken, setGithubToken] = useState<string | null>(null)
  const latest = useRef(state)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saving = useRef(false)
  const loaded = useRef(false)
  const userId = useRef<string | null>(null)

  /** Kayıtları okur. Giriş gerekiyorsa null döner. */
  const read = useCallback(async (): Promise<State | null> => {
    if (!supabase) {
      const r = await fetch("/api/state", { cache: "no-store" })
      setPasswordOn(r.headers.get("x-gunluk-auth") === "on")
      if (r.status === 401) {
        setNeedsLogin(true)
        return null
      }
      if (!r.ok) throw new Error()
      return normalize(await r.json())
    }
    if (!userId.current) return null
    const { data } = await (await api("GET")).json()
    // Yeni hesap boş başlar.
    return normalize(data)
  }, [])

  const write = useCallback(async (s: State) => {
    if (!supabase) {
      const r = await fetch("/api/state", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) })
      // Oturum bittiyse yazılanlar bellekte kalır; yeniden giriş yapılınca kaydedilir.
      if (r.status === 401) setNeedsLogin(true)
      if (!r.ok) throw new Error()
      return
    }
    if (!userId.current) throw new Error()
    await api("PUT", { data: s })
  }, [])

  const pull = useCallback(async () => {
    const s = await read()
    if (!s) return false
    // Kaydedilmemiş değişiklik varken gelen yanıt yok sayılır; yoksa yazılanların üstüne eski veri gelirdi.
    if (timer.current || saving.current) return true
    if (JSON.stringify(s) !== JSON.stringify(latest.current)) {
      latest.current = s
      setState(s)
    }
    return true
  }, [read])

  const start = useCallback(
    () =>
      pull()
        .then((ok) => {
          if (!ok) return
          loaded.current = true
          setLoadError(false)
          setReady(true)
        })
        .catch(() => setLoadError(true)),
    [pull]
  )

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    saving.current = true
    try {
      await write(latest.current)
      if (!timer.current) setStatus("saved")
    } catch {
      setStatus("error")
    }
    saving.current = false
  }, [write])

  // Açılış: yerel kipte kayıtlar doğrudan okunur; bulut kipinde önce oturuma bakılır.
  useEffect(() => {
    if (!supabase) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- açılışta kayıtlar sunucudan okunur
      start()
      return
    }
    setGithubToken(localStorage.getItem(GH_KEY))
    const apply = (session: Session | null) => {
      if (session?.provider_token) {
        localStorage.setItem(GH_KEY, session.provider_token)
        setGithubToken(session.provider_token)
      }
      setUser(session ? toUser(session) : null)
      const id = session?.user.id ?? null
      if (!id) setNeedsLogin(true)
      if (id === userId.current) return
      userId.current = id
      loaded.current = false
      setReady(false)
      if (id) {
        setNeedsLogin(false)
        start()
      }
    }
    // Oturum olayının içinden Supabase çağrısı yapılmaz; bir sonraki tura bırakılır.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setTimeout(() => apply(session), 0))
    return () => data.subscription.unsubscribe()
  }, [start])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        // Sekme arka plana geçerken bekleyen değişiklik hemen kaydedilir.
        if (timer.current) flush()
      } else if (loaded.current && !timer.current && !saving.current) {
        // Başka bir cihazda yazılanları görmek için geri dönüldüğünde kayıtlar yeniden okunur.
        pull().catch(() => {})
      }
    }
    const onLeave = () => {
      if (!timer.current) return
      if (supabase) flush()
      else navigator.sendBeacon("/api/state", new Blob([JSON.stringify(latest.current)], { type: "application/json" }))
    }
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pagehide", onLeave)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pagehide", onLeave)
    }
  }, [flush, pull])

  const mutate = useCallback(
    (fn: (s: State) => State) => {
      const next = fn(latest.current)
      latest.current = next
      setState(next)
      setStatus("saving")
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(flush, 500)
    },
    [flush]
  )

  const loginPassword = useCallback(
    async (password: string): Promise<Result> => {
      try {
        const r = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) })
        if (r.status === 401) return { error: "login.wrongPw" }
        if (!r.ok) throw new Error()
      } catch {
        return { error: "login.connFail" }
      }
      setNeedsLogin(false)
      // İlk giriş: kayıtları oku. Oturum kullanım sırasında bittiyse: bellekte bekleyen değişiklikleri kaydet.
      if (loaded.current) await flush()
      else await start()
      return {}
    },
    [flush, start]
  )

  const signInGithub = useCallback(async (withPrivate = false): Promise<Result> => {
    if (!supabase) return { error: "auth.notConfigured" }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      // Ek izin istenmezse yalnızca herkese açık repolar okunabilir; özel repo adları için "repo" izni gerekir.
      options: { redirectTo: window.location.origin, scopes: withPrivate ? "repo" : undefined },
    })
    return error ? authError(error.message) : {}
  }, [])

  const signInUser = useCallback(async (username: string, password: string): Promise<Result> => {
    if (!supabase) return { error: "auth.notConfigured" }
    // Biçime uymayan bir ad zaten kayıtlı olamaz.
    if (!USERNAME_RE.test(username.trim().toLowerCase())) return { error: "auth.invalid" }
    const { error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password })
    return error ? authError(error.message) : {}
  }, [])

  const signUpUser = useCallback(async (username: string, password: string): Promise<Result> => {
    if (!supabase) return { error: "auth.notConfigured" }
    if (!USERNAME_RE.test(username.trim().toLowerCase())) return { error: "auth.username" }
    const { data, error } = await supabase.auth.signUp({ email: usernameToEmail(username), password })
    if (error) return authError(error.message)
    // Oturum gelmediyse panelde e-posta doğrulaması açık kalmıştır; kullanıcı adlı hesap doğrulanamaz.
    return data.session ? {} : { error: "auth.confirmOn" }
  }, [])

  const changePassword = useCallback(async (password: string): Promise<Result> => {
    if (!supabase) return { error: "auth.notConfigured" }
    const { error } = await supabase.auth.updateUser({ password })
    return error ? authError(error.message) : {}
  }, [])

  const logout = useCallback(async () => {
    if (timer.current) await flush()
    if (supabase) {
      localStorage.removeItem(GH_KEY)
      await supabase.auth.signOut().catch(() => {})
    } else {
      await fetch("/api/login", { method: "DELETE" }).catch(() => {})
    }
    window.location.reload()
  }, [flush])

  const store = useMemo<Store>(
    () => ({
      state,
      ready,
      loadError,
      status,
      mode: supabase ? "cloud" : "file",
      needsLogin,
      user,
      passwordOn,
      githubToken,
      loginPassword,
      signInGithub,
      signInUser,
      signUpUser,
      changePassword,
      logout,
      setEntry: (date, pid, patch) =>
        mutate((s) => {
          const entries = { ...s.entries }
          const old = entries[k(date, pid)]
          const text = patch.text ?? old?.text ?? ""
          const mins = "mins" in patch ? patch.mins : old?.mins
          // Metin de süre de boşsa kayıt tutulmaz.
          if (text.trim() || mins) entries[k(date, pid)] = { text, at: Date.now(), ...(mins ? { mins } : {}) }
          else delete entries[k(date, pid)]
          return { ...s, entries }
        }),
      saveProject: (p) =>
        mutate((s) => ({
          ...s,
          projects: s.projects.some((x) => x.id === p.id)
            ? s.projects.map((x) => (x.id === p.id ? { ...x, name: p.name, color: p.color } : x))
            : [...s.projects, { id: uid(), name: p.name, color: p.color, ...(p.repo ? { repo: p.repo } : {}) }],
        })),
      deleteProject: (id) =>
        mutate((s) => ({
          projects: s.projects.filter((x) => x.id !== id),
          entries: Object.fromEntries(Object.entries(s.entries).filter(([key]) => !key.endsWith("|" + id))),
          todos: s.todos.filter((t) => t.pid !== id),
          notes: s.notes.filter((n) => n.pid !== id),
        })),
      addTodo: (pid, text, due) =>
        mutate((s) => ({
          ...s,
          todos: [...s.todos, { id: uid(), pid, text, done: false, at: Date.now(), ...(due ? { due } : {}) }],
        })),
      setTodoDue: (id, due) =>
        mutate((s) => ({ ...s, todos: s.todos.map((x) => (x.id === id ? { ...x, due: due || undefined } : x)) })),
      setTodoWaiting: (id, who) =>
        mutate((s) => ({
          ...s,
          todos: s.todos.map((x) => {
            if (x.id !== id) return x
            const rest = { ...x }
            delete rest.waitingOn
            return who === undefined ? rest : { ...rest, waitingOn: who }
          }),
        })),
      toggleTodo: (id) =>
        mutate((s) => ({
          ...s,
          todos: s.todos.map((t) => (t.id === id ? { ...t, done: !t.done, doneOn: t.done ? undefined : today() } : t)),
        })),
      deleteTodo: (id) => mutate((s) => ({ ...s, todos: s.todos.filter((t) => t.id !== id) })),
      addNote: (pid) =>
        mutate((s) => ({
          ...s,
          notes: [{ id: uid(), pid, title: "", body: "", at: Date.now(), upd: Date.now() }, ...s.notes],
        })),
      updateNote: (id, patch) =>
        mutate((s) => ({
          ...s,
          notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch, upd: Date.now() } : n)),
        })),
      deleteNote: (id) => mutate((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) })),
      replaceAll: (n) => mutate(() => n),
    }),
    [state, ready, loadError, status, needsLogin, user, passwordOn, githubToken, loginPassword, signInGithub, signInUser, signUpUser, changePassword, logout, mutate]
  )

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}
