"use client"

import { useState } from "react"
import { PlusIcon, StickyNoteIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { fmtShort, ymd } from "@/lib/dates"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { GENERAL_COLOR, type Note } from "@/lib/types"

export function NotesView({ filterPid }: { filterPid: string | null }) {
  const { state, addNote } = useStore()
  const { t } = useI18n()
  const known = new Set(state.projects.map((p) => p.id))
  const notes = state.notes.filter((n) => (filterPid ? n.pid === filterPid : !n.pid || known.has(n.pid)))

  return (
    <>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{notes.length ? t("notes.count", { n: notes.length }) : t("notes.none")}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t("notes.title")}</h1>
        </div>
        <Button onClick={() => addNote(filterPid || "")}>
          <PlusIcon data-icon="inline-start" /> {t("notes.new")}
        </Button>
      </header>

      {notes.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed px-6 py-16 text-center">
          <div className="grid size-11 place-items-center rounded-xl bg-muted">
            <StickyNoteIcon className="size-5 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-base font-medium">{t("notes.emptyTitle")}</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("notes.emptyBody")}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {notes.map((n) => (
            <NoteCard key={n.id} n={n} />
          ))}
        </div>
      )}
    </>
  )
}

function NoteCard({ n }: { n: Note }) {
  const { state, updateNote, deleteNote } = useStore()
  const { t } = useI18n()
  const [confirm, setConfirm] = useState(false)
  const items = [{ id: "", name: t("common.general"), color: GENERAL_COLOR }, ...state.projects].map((p) => ({
    value: p.id || "general",
    label: p.name,
    color: p.color,
  }))
  const current = items.find((i) => i.value === (n.pid || "general")) || items[0]

  return (
    <section className="proj-card rounded-xl border bg-card px-5 pt-4 pb-3 shadow-xs" style={{ "--c": current.color } as React.CSSProperties}>
      <input
        value={n.title}
        onChange={(e) => updateNote(n.id, { title: e.target.value })}
        aria-label={t("notes.titleAria")}
        placeholder={t("notes.titlePh")}
        autoFocus={!n.title && !n.body}
        className="w-full bg-transparent text-[17px] font-medium tracking-tight outline-none placeholder:text-muted-foreground/70"
      />
      <Textarea
        value={n.body}
        onChange={(e) => updateNote(n.id, { body: e.target.value })}
        aria-label={t("notes.bodyAria")}
        placeholder={t("notes.bodyPh")}
        className="mt-1 min-h-20 resize-none rounded-none border-0 bg-transparent px-0 py-1 text-[15px] leading-relaxed shadow-none focus-visible:border-0 focus-visible:ring-0 md:text-[15px] dark:bg-transparent"
      />
      <footer className="mt-1 flex items-center gap-2 border-t pt-2.5">
        <Select items={items} value={current.value} onValueChange={(v) => updateNote(n.id, { pid: v === "general" || v == null ? "" : String(v) })}>
          <SelectTrigger
            size="sm"
            aria-label={t("notes.projectAria")}
            className="border-transparent bg-transparent px-1.5 text-xs text-muted-foreground hover:bg-muted dark:bg-transparent"
          >
            <span className="size-2.5 rounded-full" style={{ background: current.color }} />
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start" alignItemWithTrigger={false} className="min-w-44">
            {items.map((i) => (
              <SelectItem key={i.value} value={i.value}>
                {i.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground tabular-nums">{fmtShort(ymd(new Date(n.upd || n.at)))}</span>
        <div className="ml-auto flex items-center gap-1">
          {confirm ? (
            <>
              <Button variant="destructive" size="xs" onClick={() => deleteNote(n.id)}>
                {t("notes.delete")}
              </Button>
              <Button variant="ghost" size="xs" onClick={() => setConfirm(false)}>
                {t("common.cancel")}
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground"
              onClick={() => (n.title || n.body ? setConfirm(true) : deleteNote(n.id))}
              aria-label={t("notes.delete")}
              title={t("notes.delete")}
            >
              <Trash2Icon />
            </Button>
          )}
        </div>
      </footer>
    </section>
  )
}
