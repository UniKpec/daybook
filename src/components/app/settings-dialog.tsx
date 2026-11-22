"use client"

import { useRef, useState } from "react"
import { DownloadIcon, UploadIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { today } from "@/lib/dates"
import { useI18n } from "@/lib/i18n"
import { normalize, useStore } from "@/lib/store"
import type { State } from "@/lib/types"
import { download } from "./field"

export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <Body close={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function Body({ close }: { close: () => void }) {
  const { state, replaceAll, mode } = useStore()
  const { t } = useI18n()
  const [pending, setPending] = useState<State | null>(null)
  const file = useRef<HTMLInputElement>(null)

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (!f) return
    try {
      const d = JSON.parse(await f.text())
      if (!Array.isArray(d.projects) || typeof d.entries !== "object" || !d.entries) throw new Error()
      setPending(normalize(d))
    } catch {
      toast.error(t("backup.invalid"))
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("backup.title")}</DialogTitle>
        <DialogDescription>{mode === "cloud" ? t("backup.descCloud") : t("backup.descFile")}</DialogDescription>
      </DialogHeader>

      {pending ? (
        <div className="grid gap-3 rounded-lg border p-3 text-sm">
          <p>
            {t("backup.confirm", {
              p: pending.projects.length,
              e: Object.keys(pending.entries).length,
              t: pending.todos.length,
              n: pending.notes.length,
            })}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                replaceAll(pending)
                toast.success(t("backup.done"))
                close()
              }}
            >
              {t("backup.replace")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => download(`gunluk-yedek-${today()}.json`, JSON.stringify(state, null, 2), "application/json")}>
            <DownloadIcon data-icon="inline-start" /> {t("backup.download")}
          </Button>
          <Button variant="outline" onClick={() => file.current?.click()}>
            <UploadIcon data-icon="inline-start" /> {t("backup.restore")}
          </Button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={onFile} />
        </div>
      )}
    </>
  )
}
