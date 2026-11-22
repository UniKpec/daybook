"use client"

import { useRef } from "react"
import { CalendarIcon } from "lucide-react"
import { cn } from "cn"
import { dueLabel, today } from "@/lib/dates"
import { useI18n } from "@/lib/i18n"

/** Son tarih etiketi. Tıklanınca tarayıcının tarih seçicisi açılır; seçicideki "temizle" tarihi kaldırır. */
export function DueChip({ due, done, onChange, className }: { due?: string; done?: boolean; onChange: (due: string | undefined) => void; className?: string }) {
  const { t } = useI18n()
  const input = useRef<HTMLInputElement>(null)
  const overdue = !!due && !done && due < today()

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <button
        type="button"
        onClick={() => {
          const el = input.current
          if (!el) return
          try {
            el.showPicker()
          } catch {
            el.focus()
          }
        }}
        aria-label={due ? `${t("due.aria")}: ${dueLabel(due, t)}` : t("due.add")}
        title={due ? t("due.aria") : t("due.add")}
        className={cn(
          "inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-xs tabular-nums outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
          !due && "text-muted-foreground",
          due && !overdue && "bg-muted text-foreground/80",
          overdue && "bg-destructive/10 font-medium text-destructive"
        )}
      >
        <CalendarIcon className="size-3.5" />
        {due && dueLabel(due, t)}
      </button>
      <input
        ref={input}
        type="date"
        tabIndex={-1}
        aria-hidden
        value={due || ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="pointer-events-none absolute bottom-0 left-0 size-0 opacity-0"
      />
    </span>
  )
}
