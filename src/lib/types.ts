export type Project = { id: string; name: string; color: string; repo?: string; branch?: string }
/** mins: o gün o projede çalışılan süre (dakika) */
export type Entry = { text: string; at: number; mins?: number }
/**
 * pid "" = Genel (projeye bağlı değil). due: son tarih (YYYY-AA-GG). doneOn: tamamlandığı gün.
 * waitingOn: iş başka birini bekliyorsa kimi beklediği; tanımlıysa (boş metin de olabilir) iş "bekliyor" sayılır.
 */
export type Todo = { id: string; pid: string; text: string; done: boolean; at: number; due?: string; doneOn?: string; waitingOn?: string }
export type Note = { id: string; pid: string; title: string; body: string; at: number; upd: number }
export type State = {
  projects: Project[]
  entries: Record<string, Entry>
  todos: Todo[]
  notes: Note[]
}

export const EMPTY: State = { projects: [], entries: {}, todos: [], notes: [] }
export const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899", "#14b8a6", "#64748b"]
export const GENERAL_COLOR = "#a1a1aa"
export const k = (date: string, pid: string) => `${date}|${pid}`
export const uid = () => Math.random().toString(36).slice(2, 10)
export const hasContent = (e: Entry | undefined) => !!e && (!!e.text.trim() || !!e.mins)
export type View = "reports" | "todos" | "notes" | "time"
