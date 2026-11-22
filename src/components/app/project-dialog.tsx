"use client"

import { useState } from "react"
import { CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import { COLORS } from "@/lib/types"
import { Field } from "./field"

type Props = { open: boolean; id: string | null; onOpenChange: (o: boolean) => void; onDeleted: (id: string) => void }

export function ProjectDialog({ open, id, onOpenChange, onDeleted }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <Body id={id} close={() => onOpenChange(false)} onDeleted={onDeleted} />
      </DialogContent>
    </Dialog>
  )
}

function Body({ id, close, onDeleted }: { id: string | null; close: () => void; onDeleted: (id: string) => void }) {
  const { state, saveProject, deleteProject } = useStore()
  const { t } = useI18n()
  const p = state.projects.find((x) => x.id === id)
  const [name, setName] = useState(p?.name || "")
  const [color, setColor] = useState(p?.color || COLORS[state.projects.length % COLORS.length])
  const [confirm, setConfirm] = useState(false)
  const owned = p
    ? {
        r: Object.keys(state.entries).filter((key) => key.endsWith("|" + p.id)).length,
        t: state.todos.filter((x) => x.pid === p.id).length,
        n: state.notes.filter((x) => x.pid === p.id).length,
      }
    : null

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    saveProject({ id: p?.id, name: name.trim(), color })
    close()
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{p ? t("proj.edit") : t("proj.new")}</DialogTitle>
        <DialogDescription>{t("proj.desc")}</DialogDescription>
      </DialogHeader>

      <Field label={t("proj.name")} htmlFor="p-name">
        <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} placeholder={t("proj.namePh")} />
      </Field>
      <Field label={t("proj.color")}>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={t("proj.colorAria", { c })}
              aria-pressed={c === color}
              className="grid size-7 place-items-center rounded-full text-white outline-none transition-transform hover:scale-110 focus-visible:ring-3 focus-visible:ring-ring/50"
              style={{ background: c }}
            >
              {c === color && <CheckIcon className="size-3.5" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </Field>

      {confirm && owned && <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">{t("proj.deleteWarn", owned)}</p>}

      <DialogFooter className="sm:justify-between">
        {p ? (
          confirm ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  deleteProject(p.id)
                  onDeleted(p.id)
                  close()
                }}
              >
                {t("proj.deleteYes")}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setConfirm(false)}>
                {t("common.cancel")}
              </Button>
            </div>
          ) : (
            <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirm(true)}>
              {t("proj.delete")}
            </Button>
          )
        ) : (
          <span />
        )}
        {!confirm && (
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={close}>
              {t("common.cancel")}
            </Button>
            <Button type="submit">{t("common.save")}</Button>
          </div>
        )}
      </DialogFooter>
    </form>
  )
}
