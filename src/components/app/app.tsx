"use client"

import { useState } from "react"
import { parse, today } from "@/lib/dates"
import { useI18n } from "@/lib/i18n"
import { useStore } from "@/lib/store"
import type { View } from "@/lib/types"
import { DayView } from "./day-view"
import { GithubImportDialog } from "./github-import-dialog"
import { Login } from "./login"
import { Splash } from "./motion"
import { NotesView } from "./notes-view"
import { ProjectDialog } from "./project-dialog"
import { SettingsDialog } from "./settings-dialog"
import { ShareDialog } from "./share-dialog"
import { Sidebar } from "./sidebar"
import { TimeView } from "./time-view"
import { TodosView } from "./todos-view"

export function App() {
  const { ready, loadError, needsLogin } = useStore()
  const { t } = useI18n()
  const [view, setView] = useState<View>("reports")
  const [date, setDate] = useState(today)
  const [month, setMonth] = useState(() => parse(today()))
  const [filterPid, setFilterPid] = useState<string | null>(null)
  const [projDialog, setProjDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [githubOpen, setGithubOpen] = useState(false)

  const go = (d: string) => {
    setDate(d)
    setMonth(parse(d))
    setView("reports")
    window.scrollTo({ top: 0 })
  }
  const newProject = () => setProjDialog({ open: true, id: null })

  if (needsLogin) return <Login />

  if (!ready)
    return loadError ? (
      <div className="anim-fade grid min-h-svh place-items-center p-6 text-center text-sm text-muted-foreground">
        <p className="max-w-sm">{t("load.error")}</p>
      </div>
    ) : (
      <Splash name={t("app.name")} label={t("common.loading")} />
    )

  return (
    <div className="anim-fade flex min-h-svh flex-col md:flex-row">
      <Sidebar
        view={view}
        onView={setView}
        date={date}
        month={month}
        onMonth={setMonth}
        onDate={go}
        filterPid={filterPid}
        onFilter={setFilterPid}
        onNewProject={newProject}
        onEditProject={(id) => setProjDialog({ open: true, id })}
        onSettings={() => setSettingsOpen(true)}
        onGithub={() => setGithubOpen(true)}
      />
      <main className="min-w-0 flex-1">
        {/* key: görünüm değişince içerik yeniden belirir */}
        <div key={view} className="anim-enter mx-auto w-full max-w-3xl px-5 py-8 md:px-10 md:py-12">
          {view === "reports" && (
            <DayView date={date} onDate={go} filterPid={filterPid} onShare={() => setShareOpen(true)} onNewProject={newProject} />
          )}
          {view === "todos" && <TodosView filterPid={filterPid} />}
          {view === "notes" && <NotesView filterPid={filterPid} />}
          {view === "time" && <TimeView filterPid={filterPid} onDate={go} />}
        </div>
      </main>
      <ProjectDialog
        open={projDialog.open}
        id={projDialog.id}
        onOpenChange={(open) => setProjDialog((p) => ({ ...p, open }))}
        onDeleted={(id) => filterPid === id && setFilterPid(null)}
      />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <GithubImportDialog open={githubOpen} onOpenChange={setGithubOpen} />
      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} date={date} filterPid={filterPid} />
    </div>
  )
}
