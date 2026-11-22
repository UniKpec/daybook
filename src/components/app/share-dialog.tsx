"use client"

import { useMemo, useState } from "react"
import { createPortal, flushSync } from "react-dom"
import { CopyIcon, DownloadIcon, PrinterIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { fmtDur, fmtLong, monthOf, weekOf } from "@/lib/dates"
import { useI18n, type T } from "@/lib/i18n"
import { collect, toText, type Report } from "@/lib/report"
import { useStore } from "@/lib/store"
import { Field, download } from "./field"

type Props = { open: boolean; onOpenChange: (o: boolean) => void; date: string; filterPid: string | null }

export function ShareDialog({ open, onOpenChange, date, filterPid }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <Body date={date} filterPid={filterPid} />
      </DialogContent>
    </Dialog>
  )
}

function Pick(p: { id: string; value: string; onChange: (v: string) => void; items: { value: string; label: string }[] }) {
  return (
    <Select items={p.items} value={p.value} onValueChange={(v) => p.onChange(String(v ?? p.items[0].value))}>
      <SelectTrigger id={p.id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {p.items.map((i) => (
          <SelectItem key={i.value} value={i.value}>
            {i.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function Body({ date, filterPid }: { date: string; filterPid: string | null }) {
  const { state } = useStore()
  const { t } = useI18n()
  const [mode, setMode] = useState("day")
  const [cf, setCf] = useState(date)
  const [ct, setCt] = useState(date)
  const [pid, setPid] = useState(filterPid || "all")
  const [withDone, setWithDone] = useState(true)
  const [withTime, setWithTime] = useState(true)
  const [fmt, setFmt] = useState("wa")
  const [printing, setPrinting] = useState<Report | null>(null)

  const [from, to] = useMemo(() => {
    if (mode === "day") return [date, date]
    if (mode === "week") return weekOf(date)
    if (mode === "month") return monthOf(date)
    const a = cf || date
    const b = ct || a
    return b < a ? [b, a] : [a, b]
  }, [mode, date, cf, ct])

  const report = useMemo(
    () => collect(state, from, to, { pid: pid === "all" ? null : pid, done: withDone, time: withTime }, t),
    [state, from, to, pid, withDone, withTime, t]
  )
  const text = useMemo(() => toText(report, fmt as "md" | "wa", t), [report, fmt, t])
  const ranges = [
    { value: "day", label: t("share.rDay") },
    { value: "week", label: t("share.rWeek") },
    { value: "month", label: t("share.rMonth") },
    { value: "custom", label: t("share.rCustom") },
  ]
  const formats = [
    { value: "wa", label: t("share.fmtWa") },
    { value: "md", label: t("share.fmtMd") },
  ]
  const projects = [{ value: "all", label: t("common.allProjects") }, ...state.projects.map((p) => ({ value: p.id, label: p.name }))]

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t("share.copied"))
    } catch {
      toast.error(t("share.copyFail"))
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("share.title")}</DialogTitle>
        <DialogDescription>{t("share.desc")}</DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label={t("share.range")} htmlFor="sh-range">
          <Pick id="sh-range" value={mode} onChange={setMode} items={ranges} />
        </Field>
        <Field label={t("share.from")} htmlFor="sh-from">
          <Input id="sh-from" type="date" value={mode === "custom" ? cf : from} disabled={mode !== "custom"} onChange={(e) => setCf(e.target.value)} />
        </Field>
        <Field label={t("share.to")} htmlFor="sh-to">
          <Input id="sh-to" type="date" value={mode === "custom" ? ct : to} disabled={mode !== "custom"} onChange={(e) => setCt(e.target.value)} />
        </Field>
        <Field label={t("share.project")} htmlFor="sh-proj">
          <Pick id="sh-proj" value={pid} onChange={setPid} items={projects} />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-2">
          <Switch id="sh-done" checked={withDone} onCheckedChange={setWithDone} />
          <Label htmlFor="sh-done">{t("share.withDone")}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="sh-time" checked={withTime} onCheckedChange={setWithTime} />
          <Label htmlFor="sh-time">{t("share.withTime")}</Label>
        </div>
        <div className="ml-auto w-full sm:w-60">
          <Pick id="sh-fmt" value={fmt} onChange={setFmt} items={formats} />
        </div>
      </div>

      <Textarea readOnly value={text} aria-label={t("share.preview")} className="h-72 resize-none font-mono text-xs leading-relaxed md:text-xs" />

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => {
            flushSync(() => setPrinting(report))
            window.print()
          }}
        >
          <PrinterIcon data-icon="inline-start" /> {t("share.print")}
        </Button>
        <Button
          variant="outline"
          onClick={() => download(`rapor-${from}${to !== from ? "_" + to : ""}.${fmt === "wa" ? "txt" : "md"}`, text, "text/plain;charset=utf-8")}
        >
          <DownloadIcon data-icon="inline-start" /> {t("share.download")}
        </Button>
        <Button onClick={copy}>
          <CopyIcon data-icon="inline-start" /> {t("share.copy")}
        </Button>
      </DialogFooter>

      {printing && createPortal(<PrintSheet r={printing} t={t} />, document.body)}
    </>
  )
}

function PrintSheet({ r, t }: { r: Report; t: T }) {
  return (
    <div id="print-root">
      <h1>{r.title}</h1>
      {!r.days.length && <p>{t("rep.empty")}</p>}
      {r.days.map((day) => (
        <section key={day.date}>
          {!r.single && <h2>{fmtLong(day.date)}</h2>}
          {day.items.map((it) => (
            <div key={it.id}>
              <h3>
                {it.name} {it.mins > 0 && <span className="meta">{fmtDur(it.mins, t)}</span>}
              </h3>
              {it.text && <div className="text">{it.text}</div>}
              {it.done.length > 0 && (
                <>
                  <p className="meta">{t("rep.completed")}</p>
                  <ul>
                    {it.done.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))}
        </section>
      ))}
      {r.totalMins > 0 && (
        <h3>
          {t("rep.total")}: {fmtDur(r.totalMins, t)}
        </h3>
      )}
    </div>
  )
}
