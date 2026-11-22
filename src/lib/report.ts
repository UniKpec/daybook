import { addDays, fmtDur, fmtLong, fmtShort } from "./dates"
import type { T } from "./i18n"
import { k, type State } from "./types"

export type Report = {
  title: string
  single: boolean
  totalMins: number
  days: { date: string; items: { id: string; name: string; text: string; mins: number; done: string[] }[] }[]
}

type Options = { pid: string | null; done: boolean; time: boolean }

/** pid: null = tüm projeler. done: o gün tamamlanan işleri, time: süreleri ekler. */
export function collect(state: State, from: string, to: string, o: Options, t: T): Report {
  const groups =
    o.pid === null ? [...state.projects, { id: "", name: t("common.general") }] : state.projects.filter((p) => p.id === o.pid)
  const days: Report["days"] = []
  let totalMins = 0
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const items = []
    for (const p of groups) {
      const e = state.entries[k(d, p.id)]
      const text = (e?.text || "").trim()
      const mins = o.time ? e?.mins || 0 : 0
      const done = o.done ? state.todos.filter((x) => x.done && x.doneOn === d && x.pid === p.id).map((x) => x.text) : []
      if (!text && !mins && !done.length) continue
      totalMins += mins
      items.push({ id: p.id, name: p.name, text, mins, done })
    }
    if (items.length) days.push({ date: d, items })
  }
  const single = from === to
  return {
    single,
    days,
    totalMins,
    title: single ? `${t("rep.daily")} — ${fmtLong(from)}` : `${t("rep.range")} — ${fmtShort(from)} – ${fmtShort(to)}`,
  }
}

export function toText(r: Report, format: "md" | "wa", t: T) {
  const wa = format === "wa"
  const o = [wa ? `*${r.title}*` : `# ${r.title}`, ""]
  if (!r.days.length) o.push(t("rep.empty"))
  for (const day of r.days) {
    if (!r.single) o.push(wa ? `*— ${fmtLong(day.date)} —*` : `## ${fmtLong(day.date)}`, "")
    for (const it of day.items) {
      const dur = it.mins ? ` (${fmtDur(it.mins, t)})` : ""
      o.push(wa ? `*${it.name}*${dur}` : (r.single ? "## " : "### ") + it.name + dur)
      if (it.text) o.push(it.text)
      if (it.done.length) {
        o.push("", wa ? `_${t("rep.completed")}_` : `**${t("rep.completed")}**`)
        for (const x of it.done) o.push(wa ? `✓ ${x}` : `- [x] ${x}`)
      }
      o.push("")
    }
  }
  if (r.totalMins) o.push(wa ? `*${t("rep.total")}: ${fmtDur(r.totalMins, t)}*` : `**${t("rep.total")}: ${fmtDur(r.totalMins, t)}**`)
  return o.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n"
}
