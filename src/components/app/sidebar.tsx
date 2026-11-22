"use client"

import { useMemo } from "react"
import { enGB, tr as trLocale } from "date-fns/locale"
import {
  CheckIcon,
  ClockIcon,
  CloudOffIcon,
  DatabaseBackupIcon,
  FileTextIcon,
  FolderGit2Icon,
  ListTodoIcon,
  Loader2Icon,
  LogOutIcon,
  PencilIcon,
  PlusIcon,
  StickyNoteIcon,
} from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { ThemeToggle } from "./theme-toggle"
import { parse, ymd } from "@/lib/dates"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { hasContent, type View } from "@/lib/types"

type Props = {
  view: View
  onView: (v: View) => void
  date: string
  month: Date
  onMonth: (d: Date) => void
  onDate: (d: string) => void
  filterPid: string | null
  onFilter: (pid: string | null) => void
  onNewProject: () => void
  onEditProject: (id: string) => void
  onSettings: () => void
  onGithub: () => void
}

// Takvimde gün altındaki noktalar: yeşil = rapor var, sarı = o güne planlı açık iş var.
const DOT = "relative after:pointer-events-none after:absolute after:bottom-1 after:z-10 after:size-1 after:rounded-full"
const DOT2 = "before:pointer-events-none before:absolute before:bottom-1 before:z-10 before:size-1 before:rounded-full"

export function Sidebar(p: Props) {
  const { state, status, mode, user, passwordOn, logout } = useStore()
  const { t, lang, setLang } = useI18n()

  const marks = useMemo(() => {
    const report = new Set<string>()
    const due = new Set<string>()
    const known = new Set(state.projects.map((x) => x.id))
    for (const key in state.entries) {
      const [d, pid] = key.split("|")
      if (known.has(pid) && hasContent(state.entries[key]) && (!p.filterPid || p.filterPid === pid)) report.add(d)
    }
    for (const x of state.todos) if (!x.done && x.due && (!p.filterPid || p.filterPid === x.pid)) due.add(x.due)
    const pick = (f: (d: string) => boolean) => [...new Set([...report, ...due])].filter(f).map(parse)
    return {
      report: pick((d) => report.has(d) && !due.has(d)),
      due: pick((d) => due.has(d) && !report.has(d)),
      both: pick((d) => report.has(d) && due.has(d)),
    }
  }, [state.entries, state.todos, state.projects, p.filterPid])

  const open = state.todos.filter((x) => !x.done)
  const openOf = (pid: string) => open.filter((x) => x.pid === pid).length

  return (
    <aside className="flex shrink-0 flex-col gap-5 border-b bg-sidebar p-4 md:sticky md:top-0 md:h-svh md:w-[19rem] md:overflow-y-auto md:border-r md:border-b-0">
      <div className="flex items-center gap-2.5 px-1 pt-1">
        <div className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M3 4.5h10M3 8h10M3 11.5h6" />
          </svg>
        </div>
        <span className="text-[15px] font-semibold tracking-tight">{t("app.name")}</span>
      </div>

      <nav className="grid gap-0.5" aria-label={t("nav.sections")}>
        <Row active={p.view === "reports"} onClick={() => p.onView("reports")} name={t("nav.reports")} icon={<FileTextIcon />} />
        <Row active={p.view === "todos"} onClick={() => p.onView("todos")} name={t("nav.todos")} icon={<ListTodoIcon />} count={open.length} />
        <Row active={p.view === "notes"} onClick={() => p.onView("notes")} name={t("nav.notes")} icon={<StickyNoteIcon />} count={state.notes.length} />
        <Row active={p.view === "time"} onClick={() => p.onView("time")} name={t("nav.time")} icon={<ClockIcon />} />
      </nav>

      <Calendar
        mode="single"
        required
        locale={lang === "tr" ? trLocale : enGB}
        selected={parse(p.date)}
        onSelect={(d) => d && p.onDate(ymd(d))}
        month={p.month}
        onMonthChange={p.onMonth}
        modifiers={marks}
        modifiersClassNames={{
          report: cn(DOT, "after:left-1/2 after:-translate-x-1/2 after:bg-emerald-500"),
          due: cn(DOT, "after:left-1/2 after:-translate-x-1/2 after:bg-amber-500"),
          both: cn(DOT, DOT2, "after:left-[calc(50%-5px)] after:bg-emerald-500 before:left-[calc(50%+1px)] before:bg-amber-500"),
        }}
        className="w-full bg-transparent p-0 [--cell-size:--spacing(9)]"
      />

      <div className="grid gap-0.5">
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-xs font-medium text-muted-foreground">{t("side.projects")}</span>
          <div className="flex items-center gap-0.5">
            {mode === "cloud" && user?.github && (
              <Button variant="ghost" size="icon-xs" onClick={p.onGithub} aria-label={t("side.addFromGithub")} title={t("side.addFromGithub")}>
                <FolderGit2Icon />
              </Button>
            )}
            <Button variant="ghost" size="icon-xs" onClick={p.onNewProject} aria-label={t("side.addProject")} title={t("side.addProject")}>
              <PlusIcon />
            </Button>
          </div>
        </div>
        <Row active={!p.filterPid} onClick={() => p.onFilter(null)} name={t("common.allProjects")} dot="" />
        {state.projects.map((x) => (
          <Row
            key={x.id}
            active={p.filterPid === x.id}
            onClick={() => p.onFilter(x.id)}
            name={x.name}
            dot={x.color}
            count={openOf(x.id)}
            onEdit={() => p.onEditProject(x.id)}
            editLabel={t("side.editProject", { name: x.name })}
            editTitle={t("side.edit")}
          />
        ))}
      </div>

      {user && (
        <p className="mt-auto -mb-3 truncate px-2 text-xs text-muted-foreground" title={user.email}>
          {user.name}
        </p>
      )}
      <div className={cn("flex items-center gap-0.5", !user && "mt-auto")}>
        <Button variant="ghost" size="sm" className="justify-start text-muted-foreground" onClick={p.onSettings}>
          <DatabaseBackupIcon /> {t("side.backup")}
        </Button>
        <span className="ml-auto flex items-center gap-1.5 pr-1 text-xs text-muted-foreground" role="status">
          {status === "saving" && (
            <>
              <Loader2Icon className="size-3 animate-spin" /> {t("side.saving")}
            </>
          )}
          {status === "saved" && (
            <>
              <CheckIcon className="size-3" /> {t("side.saved")}
            </>
          )}
          {status === "error" && (
            <span className="flex items-center gap-1.5 text-destructive">
              <CloudOffIcon className="size-3" /> {t("side.saveError")}
            </span>
          )}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="px-1.5 text-xs font-semibold text-muted-foreground"
          aria-label={t("side.language")}
          title={t("side.language")}
          onClick={() => setLang(lang === "tr" ? "en" : "tr")}
        >
          {lang === "tr" ? "TR" : "EN"}
        </Button>
        {(user || passwordOn) && (
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground" aria-label={t("side.logout")} title={t("side.logout")} onClick={logout}>
            <LogOutIcon />
          </Button>
        )}
        <ThemeToggle className="text-muted-foreground" />
      </div>
    </aside>
  )
}

function Row(p: {
  active: boolean
  onClick: () => void
  name: string
  icon?: React.ReactNode
  dot?: string
  count?: number
  onEdit?: () => void
  editLabel?: string
  editTitle?: string
}) {
  return (
    <div className="group relative">
      <button
        onClick={p.onClick}
        aria-current={p.active || undefined}
        className={cn(
          "flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-left text-sm outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
          p.active && "bg-sidebar-accent font-medium [&_svg]:text-foreground"
        )}
      >
        {p.icon}
        {p.dot !== undefined && (
          <span className={cn("mx-0.5 size-3 shrink-0 rounded-full", !p.dot && "bg-muted-foreground/40")} style={p.dot ? { background: p.dot } : undefined} />
        )}
        <span className="min-w-0 flex-1 truncate">{p.name}</span>
        <span className={cn("text-xs tabular-nums text-muted-foreground", p.onEdit && "group-focus-within:opacity-0 group-hover:opacity-0")}>
          {p.count || ""}
        </span>
      </button>
      {p.onEdit && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={p.onEdit}
          aria-label={p.editLabel}
          title={p.editTitle}
          className="absolute top-1 right-1 text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        >
          <PencilIcon />
        </Button>
      )}
    </div>
  )
}
