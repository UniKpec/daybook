"use client"

import { useMemo } from "react"
import { ChevronLeftIcon, ChevronRightIcon, NotebookPenIcon, PlusIcon, Share2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { addDays, fmtDay, fmtDur, fmtLong, fmtWeekday, relLabel, today } from "@/lib/dates"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { GENERAL_COLOR, hasContent, k } from "@/lib/types"
import { DueChip } from "./due-chip"
import { ReportCard } from "./report-card"

type Props = {
  date: string
  onDate: (d: string) => void
  filterPid: string | null
  onShare: () => void
  onNewProject: () => void
}

export function DayView({ date, onDate, filterPid, onShare, onNewProject }: Props) {
  const { state, toggleTodo, setTodoDue } = useStore()
  const { t } = useI18n()
  const list = state.projects.filter((p) => !filterPid || p.id === filterPid)
  const reports = list.filter((p) => state.entries[k(date, p.id)]?.text.trim()).length
  const mins = list.reduce((n, p) => n + (state.entries[k(date, p.id)]?.mins || 0), 0)
  const done = state.todos.filter((x) => x.done && x.doneOn === date && (!filterPid || x.pid === filterPid)).length
  const isToday = date === today()

  // O güne planlı açık işler; bugüne bakılırken gecikmiş olanlar da listelenir.
  const planned = state.todos
    .filter((x) => !x.done && x.due && (x.due === date || (isToday && x.due < date)) && (!filterPid || x.pid === filterPid))
    .sort((a, b) => (a.due! < b.due! ? -1 : 1))
  const projectOf = (pid: string) => state.projects.find((p) => p.id === pid)

  const history = useMemo(() => {
    const days: Record<string, { name: string; color: string; text: string }[]> = {}
    for (const key in state.entries) {
      const [d, pid] = key.split("|")
      const p = state.projects.find((x) => x.id === pid)
      const e = state.entries[key]
      if (!p || !hasContent(e) || d === date || (filterPid && pid !== filterPid)) continue
      ;(days[d] ||= []).push({ name: p.name, color: p.color, text: e.text.trim().replace(/\s+/g, " ") || fmtDur(e.mins || 0, t) })
    }
    return Object.keys(days)
      .sort()
      .reverse()
      .slice(0, 30)
      .map((d) => ({ date: d, items: days[d] }))
  }, [state.entries, state.projects, date, filterPid, t])

  const stats = [t("day.reports", { n: reports }), mins ? fmtDur(mins, t) : "", done ? t("day.done", { n: done }) : ""].filter(Boolean)

  return (
    <>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {relLabel(date, t)} · {fmtWeekday(date)}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{fmtDay(date)}</h1>
          {state.projects.length > 0 && <p className="mt-2 text-sm text-muted-foreground tabular-nums">{stats.join(" · ")}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border bg-background p-0.5">
            <Button variant="ghost" size="icon-sm" onClick={() => onDate(addDays(date, -1))} aria-label={t("day.prev")}>
              <ChevronLeftIcon />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDate(today())}>
              {t("common.today")}
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => onDate(addDays(date, 1))} aria-label={t("day.next")}>
              <ChevronRightIcon />
            </Button>
          </div>
          <Button onClick={onShare} disabled={!state.projects.length}>
            <Share2Icon data-icon="inline-start" /> {t("day.share")}
          </Button>
        </div>
      </header>

      {planned.length > 0 && (
        <section className="mb-4 rounded-xl border bg-card px-5 py-4 shadow-xs">
          <h2 className="text-xs font-medium text-muted-foreground">{isToday ? t("day.plannedToday") : t("day.planned")}</h2>
          <ul className="mt-1.5 grid">
            {planned.map((x) => {
              const p = projectOf(x.pid)
              return (
                <li key={x.id} className="flex items-start gap-2.5 py-1.5">
                  <Checkbox checked={false} onCheckedChange={() => toggleTodo(x.id)} aria-label={x.text} className="mt-0.5" />
                  <span className="min-w-0 flex-1 text-sm break-words">{x.text}</span>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-2 rounded-full" style={{ background: p?.color || GENERAL_COLOR }} />
                    <span className="max-w-28 truncate">{p?.name || t("common.general")}</span>
                  </span>
                  <DueChip due={x.due} onChange={(due) => setTodoDue(x.id, due)} />
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {state.projects.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed px-6 py-16 text-center">
          <div className="grid size-11 place-items-center rounded-xl bg-muted">
            <NotebookPenIcon className="size-5 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-base font-medium">{t("day.emptyTitle")}</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("day.emptyBody")}</p>
          <Button className="mt-5" onClick={onNewProject}>
            <PlusIcon data-icon="inline-start" /> {t("side.addProject")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {list.map((p) => (
            <ReportCard key={`${p.id}|${date}`} project={p} date={date} />
          ))}
        </div>
      )}

      {history.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-2 text-xs font-medium text-muted-foreground">{t("day.history")}</h2>
          <ul className="divide-y border-y">
            {history.map((h) => (
              <li key={h.date}>
                <button
                  onClick={() => onDate(h.date)}
                  className="grid w-full gap-1 px-1 py-3 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="text-sm font-medium">{fmtLong(h.date)}</span>
                  {h.items.map((it, i) => (
                    <span key={i} className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                      <span className="size-1.5 shrink-0 rounded-full" style={{ background: it.color }} />
                      <span className="shrink-0 text-foreground/80">{it.name}</span>
                      <span className="truncate">{it.text}</span>
                    </span>
                  ))}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
