"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { CheckIcon, ChevronDownIcon, ClockIcon, PencilIcon } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { k, type Project } from "@/lib/types"

/** Kapalıyken raporun görünen yüksekliği (px). */
const CLOSED = 152
const TEXT = "px-0 py-1 text-[15px] leading-relaxed md:text-[15px]"

export function ReportCard({ project: p, date }: { project: Project; date: string }) {
  const { state, setEntry } = useStore()
  const { t } = useI18n()
  const entry = state.entries[k(date, p.id)]
  const text = entry?.text || ""
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  // Saat kutusu yazılırken ("1." gibi yarım değerler) metin olarak tutulur.
  const [hours, setHours] = useState(entry?.mins ? String(+(entry.mins / 60).toFixed(2)) : "")
  const inner = useRef<HTMLDivElement>(null)
  const caretToEnd = useRef(false)
  const open = editing || expanded
  const done = state.todos.filter((x) => x.done && x.doneOn === date && x.pid === p.id)

  // İçerik kapalı yükseklikten uzun mu? (soluklaşma ve "Tümünü göster" için)
  useLayoutEffect(() => {
    const el = inner.current
    if (!el) return
    const check = () => setOverflows(el.scrollHeight > CLOSED + 4)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const save = () => {
    setEditing(false)
    setExpanded(false)
  }
  const edit = () => {
    caretToEnd.current = true
    setEditing(true)
  }
  const changeHours = (v: string) => {
    setHours(v)
    const n = parseFloat(v.replace(",", "."))
    setEntry(date, p.id, { mins: Number.isFinite(n) && n > 0 ? Math.round(Math.min(n, 24) * 60) : undefined })
  }

  return (
    <section className="proj-card overflow-hidden rounded-xl border bg-card shadow-xs" style={{ "--c": p.color } as React.CSSProperties}>
      <header className="proj-head flex items-center gap-2.5 px-5 py-2.5">
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
        <h2 className="min-w-0 flex-1 truncate text-[15px] font-medium">{p.name}</h2>
        <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <ClockIcon className="size-3.5" />
          <input
            inputMode="decimal"
            value={hours}
            onChange={(e) => changeHours(e.target.value)}
            placeholder="0"
            aria-label={t("report.hoursAria", { name: p.name })}
            className="h-6 w-11 rounded-md border bg-background/60 px-1.5 text-right text-xs text-foreground tabular-nums outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          {t("report.hoursUnit")}
        </label>
      </header>
      <div className="px-5 pt-3 pb-3">
        <div className="relative">
          <Clamp open={open}>
            <div ref={inner}>
              {editing || !text ? (
                <Textarea
                  value={text}
                  autoFocus={editing}
                  onChange={(e) => setEntry(date, p.id, { text: e.target.value })}
                  onFocus={(e) => {
                    setEditing(true)
                    if (caretToEnd.current) {
                      caretToEnd.current = false
                      e.target.setSelectionRange(e.target.value.length, e.target.value.length)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape" || (e.key === "Enter" && (e.ctrlKey || e.metaKey))) {
                      e.preventDefault()
                      save()
                    }
                  }}
                  aria-label={t("report.aria", { name: p.name })}
                  placeholder={t("report.placeholder")}
                  className={cn(
                    TEXT,
                    "min-h-24 resize-none rounded-none border-0 bg-transparent shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
                  )}
                />
              ) : (
                <button
                  type="button"
                  onClick={edit}
                  aria-label={t("report.editAria", { name: p.name })}
                  className={cn(TEXT, "block w-full cursor-text text-left break-words whitespace-pre-wrap outline-none")}
                >
                  {text}
                </button>
              )}
            </div>
          </Clamp>
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-linear-to-t from-card to-transparent transition-opacity duration-300",
              overflows && !open ? "opacity-100" : "opacity-0"
            )}
          />
        </div>

        {(editing || text) && (
          <div className="mt-2 flex items-center gap-2">
            {editing ? (
              <>
                <Button size="sm" onClick={save}>
                  <CheckIcon data-icon="inline-start" /> {t("common.save")}
                </Button>
                <span className="text-xs text-muted-foreground">Ctrl + Enter</span>
              </>
            ) : (
              <>
                {overflows && (
                  <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
                    <ChevronDownIcon data-icon="inline-start" className={cn("transition-transform duration-300", expanded && "rotate-180")} />
                    {expanded ? t("report.collapse") : t("report.showAll")}
                  </Button>
                )}
                <Button variant="ghost" size="sm" className={cn("text-muted-foreground", overflows ? "ml-auto" : "-ml-2")} onClick={edit}>
                  <PencilIcon data-icon="inline-start" /> {t("report.edit")}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {done.length > 0 && (
        <div className="border-t bg-muted/40 px-5 py-3">
          <p className="text-xs font-medium text-muted-foreground">{t("report.doneToday")}</p>
          <ul className="mt-1.5 grid gap-1">
            {done.map((x) => (
              <li key={x.id} className="flex items-baseline gap-2 text-[13px]">
                <CheckIcon className="size-3.5 shrink-0 translate-y-0.5 text-emerald-500" />
                <span className="break-words">{x.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

/** Açılıp kapanırken yüksekliği yumuşakça değiştiren sarmalayıcı. Açıkken içerik serbestçe uzar. */
function Clamp({ open, children }: { open: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  // Yükseklik yalnızca ilk çizimde React'ten gelir; sonrasında geçişi bozmamak için doğrudan öğe üzerinde yönetilir.
  const [initial] = useState(open ? undefined : CLOSED)
  const prev = useRef(open)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || prev.current === open) return
    prev.current = open
    // Geçiş "none" değerinden başlayamaz: önce ölçülen yükseklik verilir, sonra hedef.
    el.style.maxHeight = el.scrollHeight + "px"
    if (open) {
      const timer = setTimeout(() => (el.style.maxHeight = "none"), 320)
      return () => clearTimeout(timer)
    }
    void el.offsetHeight
    el.style.maxHeight = CLOSED + "px"
  }, [open])

  return (
    <div
      ref={ref}
      style={{ maxHeight: initial }}
      className="overflow-hidden transition-[max-height] duration-300 ease-out motion-reduce:transition-none"
    >
      {children}
    </div>
  )
}
