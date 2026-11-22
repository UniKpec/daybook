"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { addDays, fmtDur, fmtLong, fmtShort, monthOf, today, weekOf } from "@/lib/dates"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { k } from "@/lib/types"

type Period = "week" | "month" | "last"

export function TimeView({ filterPid, onDate }: { filterPid: string | null; onDate: (d: string) => void }) {
  const { state } = useStore()
  const { t } = useI18n()
  const [period, setPeriod] = useState<Period>("week")
  const now = today()
  const [from, to] = period === "week" ? weekOf(now) : monthOf(now, period === "last" ? -1 : 0)

  const { rows, days, total } = useMemo(() => {
    const projects = state.projects.filter((p) => !filterPid || p.id === filterPid)
    const rows = projects.map((p) => ({ ...p, mins: 0 }))
    const days: { date: string; mins: number }[] = []
    for (let d = from; d <= to; d = addDays(d, 1)) {
      let sum = 0
      for (const r of rows) {
        const m = state.entries[k(d, r.id)]?.mins || 0
        r.mins += m
        sum += m
      }
      if (sum) days.push({ date: d, mins: sum })
    }
    return { rows: rows.filter((r) => r.mins).sort((a, b) => b.mins - a.mins), days: days.reverse(), total: rows.reduce((n, r) => n + r.mins, 0) }
  }, [state.entries, state.projects, filterPid, from, to])

  const max = Math.max(1, ...rows.map((r) => r.mins))
  const tabs: { id: Period; label: string }[] = [
    { id: "week", label: t("time.thisWeek") },
    { id: "month", label: t("time.thisMonth") },
    { id: "last", label: t("time.lastMonth") },
  ]

  return (
    <>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {fmtShort(from)} – {fmtShort(to)}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t("time.title")}</h1>
        </div>
        <div className="flex items-center rounded-lg border bg-background p-0.5" role="group" aria-label={t("time.period")}>
          {tabs.map((x) => (
            <Button key={x.id} variant={period === x.id ? "secondary" : "ghost"} size="sm" aria-pressed={period === x.id} onClick={() => setPeriod(x.id)}>
              {x.label}
            </Button>
          ))}
        </div>
      </header>

      {total === 0 ? (
        <p className="rounded-2xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">{t("time.empty")}</p>
      ) : (
        <div className="grid gap-4">
          <section className="rounded-xl border bg-card px-5 py-4 shadow-xs">
            <p className="text-xs font-medium text-muted-foreground">{t("time.total")}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{fmtDur(total, t)}</p>
          </section>

          <section className="rounded-xl border bg-card px-5 py-4 shadow-xs">
            <h2 className="text-xs font-medium text-muted-foreground">{t("time.byProject")}</h2>
            <ul className="mt-3 grid gap-3">
              {rows.map((r) => (
                <li key={r.id} className="grid gap-1.5">
                  <div className="flex items-center gap-2.5 text-sm">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: r.color }} />
                    <span className="min-w-0 flex-1 truncate">{r.name}</span>
                    <span className="shrink-0 tabular-nums">{fmtDur(r.mins, t)}</span>
                    <span className="w-10 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{Math.round((r.mins / total) * 100)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${(r.mins / max) * 100}%`, background: r.color }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border bg-card px-5 py-4 shadow-xs">
            <h2 className="text-xs font-medium text-muted-foreground">{t("time.byDay")}</h2>
            <ul className="mt-1.5 divide-y">
              {days.map((d) => (
                <li key={d.date}>
                  <button
                    onClick={() => onDate(d.date)}
                    className="flex w-full items-center justify-between gap-3 py-2 text-left text-sm outline-none transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <span>{fmtLong(d.date)}</span>
                    <span className="shrink-0 tabular-nums">{fmtDur(d.mins, t)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </>
  )
}
