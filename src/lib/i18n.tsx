"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { setLocale } from "./dates"

/** Çoğul biçimi olan metinler "tekil|çoğul" yazılır; {n} 1 ise tekil seçilir. */
const tr = {
  "app.name": "Günlük",
  "app.tagline": "Raporların, yapılacakların ve notların tek yerde.",
  "common.cancel": "Vazgeç",
  "common.save": "Kaydet",
  "common.today": "Bugün",
  "common.general": "Genel",
  "common.allProjects": "Tüm projeler",
  "common.loading": "Yükleniyor",
  "load.error": "Veriler okunamadı. Uygulamanın çalıştığından emin olup sayfayı yenile. Kayıtların silinmemesi için düzenleme kapatıldı.",

  "nav.sections": "Bölümler",
  "nav.reports": "Raporlar",
  "nav.todos": "Yapılacaklar",
  "nav.notes": "Notlar ve planlar",
  "nav.time": "Süre özeti",

  "side.projects": "Projeler",
  "side.addProject": "Proje ekle",
  "side.addFromGithub": "GitHub'dan proje ekle",
  "side.editProject": "{name} projesini düzenle",
  "side.edit": "Düzenle",
  "side.backup": "Yedek",
  "side.saving": "Kaydediliyor",
  "side.saved": "Kaydedildi",
  "side.saveError": "Kaydedilemedi",
  "side.logout": "Çıkış yap",
  "side.theme": "Açık / koyu tema",
  "side.language": "Dili değiştir: English",

  "rel.today": "Bugün",
  "rel.yesterday": "Dün",
  "rel.tomorrow": "Yarın",
  "rel.daysAgo": "{n} gün önce",
  "rel.daysLater": "{n} gün sonra",

  "day.prev": "Önceki gün",
  "day.next": "Sonraki gün",
  "day.share": "Paylaş",
  "day.reports": "{n} rapor",
  "day.done": "{n} iş tamamlandı",
  "day.emptyTitle": "İlk projeni ekle",
  "day.emptyBody": "Projelerini ekle, her gün ne yaptığını yaz. Biri sorduğunda o günün raporunu tek tıkla paylaşırsın.",
  "day.history": "Önceki kayıtlar",
  "day.planned": "Bu gün için planlananlar",
  "day.plannedToday": "Bugünün işleri",

  "report.placeholder": "Bu projede ne yaptın? Her satıra bir madde yazabilirsin.",
  "report.aria": "{name} raporu",
  "report.editAria": "{name} raporunu düzenle",
  "report.showAll": "Tümünü göster",
  "report.collapse": "Daralt",
  "report.edit": "Düzenle",
  "report.doneToday": "Bu gün tamamlananlar",
  "report.hoursUnit": "saat",
  "report.hoursAria": "{name} için çalışılan süre (saat)",

  "dur.h": "sa",
  "dur.m": "dk",

  "todos.title": "Yapılacaklar",
  "todos.openCount": "{n} açık iş",
  "todos.none": "Açık iş yok",
  "todos.addPlaceholder": "Yeni iş ekle ve Enter'a bas",
  "todos.addAria": "{name} için yeni iş",
  "todos.completed": "Tamamlanan ({n})",
  "todos.deleteAria": "Sil: {text}",
  "todos.delete": "Sil",
  "todos.filter": "İşleri süz",
  "todos.filterAll": "Tümü",
  "todos.filterWeek": "Bu hafta",
  "todos.filterOverdue": "Geciken",
  "todos.emptyFilter": "Bu görünümde iş yok.",
  "todos.filterWaiting": "Bekleyen",
  "wait.add": "Bekliyor olarak işaretle",
  "wait.label": "Bekliyor",
  "wait.on": "{who} bekleniyor",
  "wait.ph": "Kimi bekliyorsun?",
  "wait.clear": "Beklemeyi kaldır",
  "due.add": "Tarih ekle",
  "due.aria": "Son tarih",
  "due.today": "Bugün",
  "due.tomorrow": "Yarın",
  "due.overdue": "{n} gün gecikti",

  "notes.title": "Notlar ve planlar",
  "notes.count": "{n} not",
  "notes.none": "Henüz not yok",
  "notes.new": "Yeni not",
  "notes.emptyTitle": "Planlarını ve fikirlerini buraya yaz",
  "notes.emptyBody": "Yol haritası, toplantı notu, aklına gelen fikir. İstersen bir projeye bağla, istersen genel bırak.",
  "notes.titlePh": "Başlık",
  "notes.titleAria": "Not başlığı",
  "notes.bodyPh": "Yazmaya başla…",
  "notes.bodyAria": "Not içeriği",
  "notes.projectAria": "Notun projesi",
  "notes.delete": "Notu sil",

  "time.title": "Süre özeti",
  "time.total": "Toplam",
  "time.period": "Dönem",
  "time.thisWeek": "Bu hafta",
  "time.thisMonth": "Bu ay",
  "time.lastMonth": "Geçen ay",
  "time.byProject": "Projelere göre",
  "time.byDay": "Günlere göre",
  "time.empty": "Bu dönemde süre girilmemiş. Raporlar bölümünde her projenin kartına çalıştığın saati yazabilirsin.",

  "proj.new": "Yeni proje",
  "proj.edit": "Projeyi düzenle",
  "proj.desc": "Raporlar, yapılacaklar ve notlar projelere göre gruplanır.",
  "proj.name": "Proje adı",
  "proj.namePh": "Örn. Web sitesi yenileme",
  "proj.color": "Renk",
  "proj.colorAria": "Renk {c}",
  "proj.delete": "Projeyi sil",
  "proj.deleteWarn": "Bu projeyle birlikte {r} rapor, {t} yapılacak ve {n} not kalıcı olarak silinecek.",
  "proj.deleteYes": "Evet, sil",

  "backup.title": "Yedek",
  "backup.descCloud": "Kayıtların hesabına bağlı olarak bulutta durur; giriş yaptığın her yerden aynı kayıtlara ulaşırsın. Ara sıra yedek almak yine de iyi olur.",
  "backup.descFile": "Tüm kayıtların bu bilgisayarda, proje klasöründeki data/gunluk.json dosyasında durur. Ara sıra yedek almak iyi olur.",
  "backup.download": "Yedeği indir",
  "backup.restore": "Yedekten geri yükle",
  "backup.invalid": "Bu dosya geçerli bir yedek değil.",
  "backup.confirm": "Yedekteki {p} proje, {e} rapor, {t} yapılacak ve {n} not yüklenecek; şu anki kayıtların yerine geçecek.",
  "backup.replace": "Kayıtları değiştir",
  "backup.done": "Yedek yüklendi.",

  "share.title": "Raporu paylaş",
  "share.desc": "Dönemi seç, raporu kopyala ya da dosya olarak gönder.",
  "share.range": "Dönem",
  "share.from": "Başlangıç",
  "share.to": "Bitiş",
  "share.project": "Proje",
  "share.rDay": "Seçili gün",
  "share.rWeek": "Bu hafta",
  "share.rMonth": "Bu ay",
  "share.rCustom": "Özel aralık",
  "share.withDone": "Tamamlanan işler",
  "share.withTime": "Süreler",
  "share.fmtWa": "Düz metin (WhatsApp)",
  "share.fmtMd": "Markdown (Slack, GitHub)",
  "share.preview": "Rapor önizlemesi",
  "share.print": "PDF / Yazdır",
  "share.download": "İndir",
  "share.copy": "Kopyala",
  "share.copied": "Rapor panoya kopyalandı.",
  "share.copyFail": "Kopyalanamadı. Metni seçip elle kopyalayabilirsin.",

  "rep.daily": "Günlük Rapor",
  "rep.range": "Çalışma Raporu",
  "rep.empty": "Bu dönem için kayıt yok.",
  "rep.completed": "Tamamlananlar",
  "rep.time": "Süre",
  "rep.total": "Toplam süre",

  "login.github": "GitHub ile devam et",
  "login.orUser": "ya da kullanıcı adıyla",
  "login.username": "Kullanıcı adı",
  "login.userHint": "3-24 karakter: İngilizce harf, rakam, nokta, alt çizgi ya da tire.",
  "login.password2": "Şifre (tekrar)",
  "login.password": "Şifre",
  "login.signIn": "Giriş yap",
  "login.signUp": "Kayıt ol",
  "login.create": "Hesap oluştur",
  "login.haveAccount": "Zaten hesabın var mı?",
  "login.noAccount": "Hesabın yok mu?",
  "login.min6": "En az 6 karakter.",
  "login.wrongPw": "Şifre yanlış.",
  "login.connFail": "Bağlanılamadı. Biraz sonra yeniden dene.",

  "auth.invalid": "Kullanıcı adı ya da şifre yanlış.",
  "auth.exists": "Bu kullanıcı adı alınmış. Başka bir ad dene ya da giriş yap.",
  "auth.confirmOn": "Supabase panelinde e-posta doğrulaması açık. Authentication → Sign In / Providers → Email altındaki \"Confirm email\" ayarını kapat.",
  "auth.weak": "Şifre en az 6 karakter olmalı.",
  "auth.username": "Kullanıcı adı 3-24 karakter olmalı; yalnızca İngilizce harf, rakam, nokta, alt çizgi ve tire içerebilir.",
  "auth.mismatch": "Şifreler aynı değil.",
  "auth.rate": "Çok fazla deneme yapıldı. Biraz sonra yeniden dene.",
  "auth.provider": "Bu giriş yöntemi Supabase panelinde açılmamış.",
  "auth.generic": "İşlem tamamlanamadı: {msg}",
  "auth.notConfigured": "Supabase ayarlı değil.",

  "gh.title": "GitHub'dan proje ekle",
  "gh.desc": "Repolarından seçtiklerin proje olarak eklenir. Yalnızca adları alınır; kod ya da commit okunmaz.",
  "gh.reconnectText": "Repo listesini görmek için GitHub bağlantısını yenilemen gerekiyor.",
  "gh.reconnect": "GitHub'a yeniden bağlan",
  "gh.loading": "Repolar alınıyor",
  "gh.fail": "GitHub'a ulaşılamadı. Biraz sonra yeniden dene.",
  "gh.search": "Repo ara",
  "gh.private": "Özel repo",
  "gh.added": "Eklendi",
  "gh.noMatch": "Eşleşen repo yok.",
  "gh.publicOnly": "Yalnızca herkese açık repoların listeleniyor.",
  "gh.showPrivate": "Özel repoları da göster",
  "gh.showPrivateAfter": "dersen GitHub senden özel repolara erişim izni ister.",
  "gh.addN": "{n} projeyi ekle",
  "gh.addNone": "Proje ekle",
  "gh.addedToast": "{n} proje eklendi.",
}

export type TKey = keyof typeof tr
export type T = (key: TKey, vars?: Record<string, string | number>) => string

const en: Record<TKey, string> = {
  "app.name": "Daybook",
  "app.tagline": "Your reports, to-dos and notes in one place.",
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.today": "Today",
  "common.general": "General",
  "common.allProjects": "All projects",
  "common.loading": "Loading",
  "load.error": "Your data couldn't be loaded. Make sure the app is running, then refresh the page. Editing is off so nothing gets overwritten.",

  "nav.sections": "Sections",
  "nav.reports": "Reports",
  "nav.todos": "To-dos",
  "nav.notes": "Notes & plans",
  "nav.time": "Time summary",

  "side.projects": "Projects",
  "side.addProject": "Add project",
  "side.addFromGithub": "Add projects from GitHub",
  "side.editProject": "Edit project {name}",
  "side.edit": "Edit",
  "side.backup": "Backup",
  "side.saving": "Saving",
  "side.saved": "Saved",
  "side.saveError": "Couldn't save",
  "side.logout": "Sign out",
  "side.theme": "Light / dark theme",
  "side.language": "Switch language: Türkçe",

  "rel.today": "Today",
  "rel.yesterday": "Yesterday",
  "rel.tomorrow": "Tomorrow",
  "rel.daysAgo": "{n} day ago|{n} days ago",
  "rel.daysLater": "In {n} day|In {n} days",

  "day.prev": "Previous day",
  "day.next": "Next day",
  "day.share": "Share",
  "day.reports": "{n} report|{n} reports",
  "day.done": "{n} task done|{n} tasks done",
  "day.emptyTitle": "Add your first project",
  "day.emptyBody": "Add your projects and write down what you did each day. When someone asks, share that day's report in one click.",
  "day.history": "Earlier entries",
  "day.planned": "Planned for this day",
  "day.plannedToday": "Today's tasks",

  "report.placeholder": "What did you do on this project? One item per line works well.",
  "report.aria": "{name} report",
  "report.editAria": "Edit {name} report",
  "report.showAll": "Show all",
  "report.collapse": "Collapse",
  "report.edit": "Edit",
  "report.doneToday": "Completed this day",
  "report.hoursUnit": "hours",
  "report.hoursAria": "Time worked on {name} (hours)",

  "dur.h": "h",
  "dur.m": "min",

  "todos.title": "To-dos",
  "todos.openCount": "{n} open task|{n} open tasks",
  "todos.none": "No open tasks",
  "todos.addPlaceholder": "Add a task and press Enter",
  "todos.addAria": "New task for {name}",
  "todos.completed": "Completed ({n})",
  "todos.deleteAria": "Delete: {text}",
  "todos.delete": "Delete",
  "todos.filter": "Filter tasks",
  "todos.filterAll": "All",
  "todos.filterWeek": "This week",
  "todos.filterOverdue": "Overdue",
  "todos.emptyFilter": "No tasks in this view.",
  "todos.filterWaiting": "Waiting",
  "wait.add": "Mark as waiting",
  "wait.label": "Waiting",
  "wait.on": "Waiting on {who}",
  "wait.ph": "Who are you waiting on?",
  "wait.clear": "Clear waiting",
  "due.add": "Add date",
  "due.aria": "Due date",
  "due.today": "Today",
  "due.tomorrow": "Tomorrow",
  "due.overdue": "{n} day overdue|{n} days overdue",

  "notes.title": "Notes & plans",
  "notes.count": "{n} note|{n} notes",
  "notes.none": "No notes yet",
  "notes.new": "New note",
  "notes.emptyTitle": "Write your plans and ideas here",
  "notes.emptyBody": "A roadmap, meeting notes, an idea you just had. Link it to a project or keep it general.",
  "notes.titlePh": "Title",
  "notes.titleAria": "Note title",
  "notes.bodyPh": "Start writing…",
  "notes.bodyAria": "Note body",
  "notes.projectAria": "Note's project",
  "notes.delete": "Delete note",

  "time.title": "Time summary",
  "time.total": "Total",
  "time.period": "Period",
  "time.thisWeek": "This week",
  "time.thisMonth": "This month",
  "time.lastMonth": "Last month",
  "time.byProject": "By project",
  "time.byDay": "By day",
  "time.empty": "No time logged in this period. In Reports, enter the hours you worked on each project's card.",

  "proj.new": "New project",
  "proj.edit": "Edit project",
  "proj.desc": "Reports, to-dos and notes are grouped by project.",
  "proj.name": "Project name",
  "proj.namePh": "e.g. Website redesign",
  "proj.color": "Color",
  "proj.colorAria": "Color {c}",
  "proj.delete": "Delete project",
  "proj.deleteWarn": "This permanently deletes the project along with {r} reports, {t} to-dos and {n} notes.",
  "proj.deleteYes": "Yes, delete",

  "backup.title": "Backup",
  "backup.descCloud": "Your data is stored in the cloud under your account, so you see the same data wherever you sign in. An occasional backup is still a good idea.",
  "backup.descFile": "All your data is stored on this computer, in data/gunluk.json inside the project folder. Take a backup now and then.",
  "backup.download": "Download backup",
  "backup.restore": "Restore from backup",
  "backup.invalid": "This file isn't a valid backup.",
  "backup.confirm": "The backup's {p} projects, {e} reports, {t} to-dos and {n} notes will replace your current data.",
  "backup.replace": "Replace data",
  "backup.done": "Backup restored.",

  "share.title": "Share report",
  "share.desc": "Pick a period, then copy the report or send it as a file.",
  "share.range": "Period",
  "share.from": "From",
  "share.to": "To",
  "share.project": "Project",
  "share.rDay": "Selected day",
  "share.rWeek": "This week",
  "share.rMonth": "This month",
  "share.rCustom": "Custom range",
  "share.withDone": "Completed tasks",
  "share.withTime": "Time",
  "share.fmtWa": "Plain text (WhatsApp)",
  "share.fmtMd": "Markdown (Slack, GitHub)",
  "share.preview": "Report preview",
  "share.print": "PDF / Print",
  "share.download": "Download",
  "share.copy": "Copy",
  "share.copied": "Report copied to clipboard.",
  "share.copyFail": "Couldn't copy. Select the text and copy it manually.",

  "rep.daily": "Daily Report",
  "rep.range": "Work Report",
  "rep.empty": "Nothing recorded for this period.",
  "rep.completed": "Completed",
  "rep.time": "Time",
  "rep.total": "Total time",

  "login.github": "Continue with GitHub",
  "login.orUser": "or with a username",
  "login.username": "Username",
  "login.userHint": "3-24 characters: letters, digits, dot, underscore or hyphen.",
  "login.password2": "Repeat password",
  "login.password": "Password",
  "login.signIn": "Sign in",
  "login.signUp": "Sign up",
  "login.create": "Create account",
  "login.haveAccount": "Already have an account?",
  "login.noAccount": "Don't have an account?",
  "login.min6": "At least 6 characters.",
  "login.wrongPw": "Wrong password.",
  "login.connFail": "Couldn't connect. Try again in a moment.",

  "auth.invalid": "Wrong username or password.",
  "auth.exists": "That username is taken. Try another one or sign in.",
  "auth.confirmOn": "Email confirmation is on in the Supabase dashboard. Turn off \"Confirm email\" under Authentication → Sign In / Providers → Email.",
  "auth.weak": "Password must be at least 6 characters.",
  "auth.username": "Usernames are 3-24 characters: letters, digits, dot, underscore and hyphen only.",
  "auth.mismatch": "The passwords don't match.",
  "auth.rate": "Too many attempts. Try again in a moment.",
  "auth.provider": "This sign-in method isn't enabled in the Supabase dashboard.",
  "auth.generic": "That didn't work: {msg}",
  "auth.notConfigured": "Supabase isn't configured.",

  "gh.title": "Add projects from GitHub",
  "gh.desc": "The repositories you pick are added as projects. Only their names are read; no code or commits.",
  "gh.reconnectText": "Reconnect GitHub to see your repository list.",
  "gh.reconnect": "Reconnect GitHub",
  "gh.loading": "Loading repositories",
  "gh.fail": "Couldn't reach GitHub. Try again in a moment.",
  "gh.search": "Search repositories",
  "gh.private": "Private repository",
  "gh.added": "Added",
  "gh.noMatch": "No matching repositories.",
  "gh.publicOnly": "Only your public repositories are listed.",
  "gh.showPrivate": "Show private ones too",
  "gh.showPrivateAfter": "and GitHub will ask you to grant access to private repositories.",
  "gh.addN": "Add {n} project|Add {n} projects",
  "gh.addNone": "Add projects",
  "gh.addedToast": "{n} project added.|{n} projects added.",
}

export type Lang = "tr" | "en"
const DICT: Record<Lang, Record<TKey, string>> = { tr, en }
const LOCALES: Record<Lang, string> = { tr: "tr-TR", en: "en-GB" }
const STORAGE = "gunluk.lang"

function makeT(lang: Lang): T {
  return (key, vars) => {
    let s = DICT[lang][key]
    if (s.includes("|")) {
      const [one, many] = s.split("|")
      s = vars && Number(vars.n) === 1 ? one : many
    }
    return vars ? s.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? "")) : s
  }
}

const Ctx = createContext<{ t: T; lang: Lang; setLang: (l: Lang) => void }>({ t: makeT("tr"), lang: "tr", setLang: () => {} })
export const useI18n = () => useContext(Ctx)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("tr")

  // Kayıtlı tercih yoksa tarayıcının diline bakılır.
  useEffect(() => {
    let saved: string | null = null
    try {
      saved = localStorage.getItem(STORAGE)
    } catch {}
    const next: Lang = saved === "tr" || saved === "en" ? saved : navigator.language.toLowerCase().startsWith("tr") ? "tr" : "en"
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dil tercihi yalnızca tarayıcıda bilinir
    setLangState(next)
  }, [])

  // Tarih biçimleri çizimden önce seçili dile geçmeli.
  setLocale(LOCALES[lang])

  const value = useMemo(() => {
    const t = makeT(lang)
    return {
      t,
      lang,
      setLang: (l: Lang) => {
        try {
          localStorage.setItem(STORAGE, l)
        } catch {}
        setLangState(l)
      },
    }
  }, [lang])

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = value.t("app.name")
  }, [lang, value])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
