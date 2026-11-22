"use client"

import { useState } from "react"
import { ChevronRightIcon, HourglassIcon, PlusIcon, XIcon } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { fmtShort, today, weekOf } from "@/lib/dates"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { GENERAL_COLOR, type Todo } from "@/lib/types"
import { DueChip } from "./due-chip"
import { Collapse } from "./motion"

type Filter = "all" | "week" | "overdue" | "waiting"

function matches(x: Todo, f: Filter) {
  if (f === "all") return true
  if (f === "waiting") return x.waitingOn !== undefined
  if (!x.due) return false
  const now = today()
  if (f === "overdue") return x.due < now
  return x.due <= weekOf(now)[1] // bu hafta: haftanın sonuna kadar olanlar, gecikenler dahil
}

export function TodosView({ filterPid }: { filterPid: string | null }) {
  const { state } = useStore()
  const { t } = useI18n()
  const [filter, setFilter] = useState<Filter>("all")
  const general = { id: "", name: t("common.general"), color: GENERAL_COLOR }
  const groups = filterPid ? state.projects.filter((p) => p.id === filterPid) : [...state.projects, general]
  const open = state.todos.filter((x) => !x.done && (!filterPid || x.pid === filterPid))
  const count = (f: Filter) => open.filter((x) => matches(x, f)).length
  const shown = filter === "all" ? groups : groups.filter((g) => open.some((x) => x.pid === g.id && matches(x, filter)))
  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: t("todos.filterAll") },
    { id: "week", label: t("todos.filterWeek") },
    { id: "overdue", label: t("todos.filterOverdue") },
    { id: "waiting", label: t("todos.filterWaiting") },
  ]

  return (
    <>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{open.length ? t("todos.openCount", { n: open.length }) : t("todos.none")}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t("todos.title")}</h1>
        </div>
        <div className="flex items-center rounded-lg border bg-background p-0.5" role="group" aria-label={t("todos.filter")}>
          {tabs.map((x) => (
            <Button
              key={x.id}
              variant={filter === x.id ? "secondary" : "ghost"}
              size="sm"
              aria-pressed={filter === x.id}
              onClick={() => setFilter(x.id)}
              className={cn(x.id === "overdue" && count("overdue") > 0 && filter !== x.id && "text-destructive hover:text-destructive")}
            >
              {x.label}
              {x.id !== "all" && count(x.id) > 0 && <span className="tabular-nums opacity-70">{count(x.id)}</span>}
            </Button>
          ))}
        </div>
      </header>
      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">{t("todos.emptyFilter")}</p>
      ) : (
        <div className="grid gap-4">
          {shown.map((g) => (
            <Group key={g.id || "general"} pid={g.id} name={g.name} color={g.color} filter={filter} />
          ))}
        </div>
      )}
    </>
  )
}

function Group({ pid, name, color, filter }: { pid: string; name: string; color: string; filter: Filter }) {
  const { state, addTodo } = useStore()
  const { t } = useI18n()
  const [text, setText] = useState("")
  const [due, setDue] = useState<string | undefined>()
  const [showDone, setShowDone] = useState(false)
  const mine = state.todos.filter((x) => x.pid === pid)
  // Tarihli işler önce ve yakın tarihten uzağa; tarihsizler eklenme sırasıyla.
  const open = mine
    .filter((x) => !x.done && matches(x, filter))
    .sort((a, b) => (a.due && b.due ? (a.due < b.due ? -1 : a.due > b.due ? 1 : a.at - b.at) : a.due ? -1 : b.due ? 1 : a.at - b.at))
  const done = mine.filter((x) => x.done).sort((a, b) => ((a.doneOn || "") < (b.doneOn || "") ? 1 : -1))

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    addTodo(pid, text.trim(), due)
    setText("")
    setDue(undefined)
  }

  return (
    <section className="proj-card overflow-hidden rounded-xl border bg-card shadow-xs" style={{ "--c": color } as React.CSSProperties}>
      <header className="proj-head flex items-center gap-2.5 px-5 py-2.5">
        <span className="size-2.5 rounded-full" style={{ background: color }} />
        <h2 className="text-[15px] font-medium">{name}</h2>
        {open.length > 0 && <span className="text-xs text-muted-foreground tabular-nums">{open.length}</span>}
      </header>
      <div className="px-5 pt-1 pb-3">
        {open.length > 0 && (
          <ul className="mt-1.5 grid">
            {open.map((x) => (
              <Item key={x.id} x={x} />
            ))}
          </ul>
        )}

        <form onSubmit={add} className="mt-2 flex items-center gap-2.5">
          <PlusIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label={t("todos.addAria", { name })}
            placeholder={t("todos.addPlaceholder")}
            className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <DueChip due={due} onChange={setDue} />
        </form>

        {filter === "all" && done.length > 0 && (
          <div className="mt-2 border-t pt-2">
            <button
              onClick={() => setShowDone(!showDone)}
              aria-expanded={showDone}
              className="flex items-center gap-1 rounded-md text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <ChevronRightIcon className={cn("size-3.5 transition-transform", showDone && "rotate-90")} />
              {t("todos.completed", { n: done.length })}
            </button>
            <Collapse open={showDone}>
              <ul className="mt-1 grid">
                {done.map((x) => (
                  <Item key={x.id} x={x} />
                ))}
              </ul>
            </Collapse>
          </div>
        )}
      </div>
    </section>
  )
}

function Item({ x }: { x: Todo }) {
  const { toggleTodo, deleteTodo, setTodoDue } = useStore()
  const { t } = useI18n()
  return (
    <li className="group flex items-start gap-2.5 py-1.5">
      <Checkbox checked={x.done} onCheckedChange={() => toggleTodo(x.id)} aria-label={x.text} className="mt-0.5" />
      <span className={cn("min-w-0 flex-1 text-sm break-words", x.done && "text-muted-foreground line-through")}>{x.text}</span>
      {x.done ? (
        x.doneOn && <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{fmtShort(x.doneOn)}</span>
      ) : (
        <>
          <WaitChip x={x} />
          <DueChip due={x.due} onChange={(due) => setTodoDue(x.id, due)} className={cn(!x.due && "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100")} />
        </>
      )}
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => deleteTodo(x.id)}
        aria-label={t("todos.deleteAria", { text: x.text })}
        title={t("todos.delete")}
        className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      >
        <XIcon />
      </Button>
    </li>
  )
}

/** "Bekliyor" etiketi: iş başka birinin işini bekliyorsa işaretlenir; tıklanınca kimi beklediği yazılır. */
function WaitChip({ x }: { x: Todo }) {
  const { setTodoWaiting } = useStore()
  const { t } = useI18n()
  const [editing, setEditing] = useState(false)
  const [who, setWho] = useState("")
  const waiting = x.waitingOn !== undefined
  const tone = "bg-amber-500/15 text-amber-700 dark:text-amber-300"

  const commit = () => {
    setTodoWaiting(x.id, who.trim())
    setEditing(false)
  }

  if (editing)
    return (
      <span className={cn("inline-flex h-6 shrink-0 items-center gap-1 rounded-md pr-0.5 pl-1.5 text-xs", tone)}>
        <HourglassIcon className="size-3.5" />
        <input
          autoFocus
          value={who}
          onChange={(e) => setWho(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit()
            if (e.key === "Escape") setEditing(false)
          }}
          maxLength={40}
          placeholder={t("wait.ph")}
          aria-label={t("wait.ph")}
          className="h-6 w-32 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
        />
        {waiting && (
          <button
            type="button"
            // Kutudan çıkış (blur) kaydetmesin diye tıklama öncesinde odak korunur.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setTodoWaiting(x.id, undefined)
              setEditing(false)
            }}
            aria-label={t("wait.clear")}
            title={t("wait.clear")}
            className="grid size-5 place-items-center rounded outline-none hover:bg-amber-500/20 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <XIcon className="size-3" />
          </button>
        )}
      </span>
    )

  return (
    <button
      type="button"
      onClick={() => {
        setWho(x.waitingOn || "")
        setEditing(true)
      }}
      aria-label={waiting ? (x.waitingOn ? t("wait.on", { who: x.waitingOn }) : t("wait.label")) : t("wait.add")}
      title={waiting ? t("wait.label") : t("wait.add")}
      className={cn(
        "inline-flex h-6 max-w-44 shrink-0 items-center gap-1 rounded-md px-1.5 text-xs outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
        waiting ? tone : "text-muted-foreground opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-muted"
      )}
    >
      <HourglassIcon className="size-3.5 shrink-0" />
      {waiting && <span className="truncate">{x.waitingOn ? t("wait.on", { who: x.waitingOn }) : t("wait.label")}</span>}
    </button>
  )
}
